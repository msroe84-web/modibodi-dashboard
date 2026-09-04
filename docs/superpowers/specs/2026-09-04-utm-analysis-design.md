# UTM 분석 탭 설계

## 배경 및 범위

`modibodi-dashboard/.worktrees/dashboard-v2/web` (React 재구축 버전)에 신규 탭 **UTM 분석**을
추가한다. 마케팅 담당자가 채널별로 UTM 링크를 직접 만들고(태그 관리), 그 링크들의 유입/전환
성과를 한 곳에서 훑어보기 위한 탭이다.

이번 스펙은 사용자가 이미 다른 프로젝트에서 만들어본 기능을 이 코드베이스 컨벤션에 맞춰 그대로
포팅하는 작업이다. 기능 스펙(4개 섹션: 헤더, 만들기 모달, 만든 링크 목록, 성과 분석)은 사용자가
확정했고, 이 문서는 그것을 dashboard-v2의 기존 패턴(디자인 토큰, 카드/테이블 컴포넌트, 상태 저장
방식, 탭 등록 방식)에 매핑하는 기술 설계를 다룬다.

성과 분석 섹션(4번)은 실제 클릭/전환 연동 전까지 **목업 데이터**로 채운다. 실제 UTM
클릭·전환 추적 연동(GA4, Apps Script 확장 등)은 범위 밖이며 별도 작업으로 진행한다.

기존 탭의 로직은 수정하지 않는다.

## 탭 구성 변경

`src/data/tabs.ts`의 `TABS` 배열에 `ad-performance` 바로 다음, `calendar`(캠페인 캘린더) 이전에
신규 탭을 추가한다 (사용자 확인 완료):

```
overview → marketing → ad-performance → utm(신규) → calendar → pnl → crm → md →
inventory → personal-calendar → settings
```

- 신규 탭 id: `utm` (라벨 "UTM 분석")
- 아이콘(lucide-react): `Link2Icon` (다른 탭 아이콘과 겹치지 않는 링크 형태)
- `src/App.tsx`의 `TAB_COMPONENTS` 맵에 컴포넌트 등록

## 데이터 모델

`src/lib/types.ts`에 추가:

```ts
/** 사용자가 UTM 만들기 모달로 직접 생성한 링크. */
export interface UtmLink {
  id: string;
  tagTitle: string;   // 내부 참조용 이름
  landingUrl: string;
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  generatedUrl: string; // 생성 시점에 조합해서 저장 (목록/복사는 재조합 없이 이 값을 그대로 사용)
  createdAt: string;    // ISO datetime
}

/** 성과 분석 섹션(4번)용 목업 성과 데이터 — 1번 섹션에서 만든 UtmLink와는 별개 데이터셋. */
export interface UtmPerformanceRow {
  id: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  clicks: number;
  orders: number;
  revenue: number;
}
```

`UtmPerformanceRow`에는 `cvr` 필드를 두지 않는다 — `CampaignPerformanceTable`의
`deriveCampaignStats`와 동일하게, 렌더링/집계 시점에 `orders / clicks`로 계산해서 쓴다
(저장된 값과 어긋날 일이 없도록).

## 1. 탭 헤더

`src/components/utm/UtmAnalysisTab.tsx` 최상단:

- 좌측: `<h1 className="text-[20px] font-extrabold text-ink">UTM 분석</h1>` + 바로 옆
  아웃라인 버튼 "UTM 만들기" (`Link2Icon` 또는 `PlusIcon`), 스타일은 `SettingsTab`의 초기화
  버튼과 동일한 형태이되 critical 대신 primary 토큰: `border border-primary/40 text-primary
  hover:bg-primary/10`
- 우측: 보조 라벨 `<span className="text-[12.5px] text-ink-muted">누적 기준 · Mock 데이터</span>`
  (날짜 범위 선택기와 연동 안 됨을 명시 — 이 탭에는 `DateRangePicker`를 두지 않는다)

## 2. UTM 만들기 모달

`src/components/utm/UtmBuilderModal.tsx` — `EventModal.tsx`와 동일한 모달 셸 재사용:
`fixed inset-0 bg-black/60` 백드롭, `rounded-2xl bg-surface shadow-2xl` 컨텐츠 박스,
mousedown 기반 배경 클릭 닫힘 + Esc 닫힘(동일한 `backdropMouseDown` ref 패턴).

폼 필드(전부 `SettingsTab`의 `inputClass` 재사용, 라벨은 `EventModal`의 라벨 스타일
`text-[12px] font-semibold text-ink-secondary`):

- 태그 제목, 랜딩 URL — 텍스트 입력
- 생성된 URL — `readOnly` input + 복사 아이콘 버튼. `useMemo`로 랜딩 URL/파라미터가 바뀔 때마다
  실시간 재계산
- UTM 파라미터 5개(source/medium/campaign/term/content) — 전부 자유 텍스트 입력 (드롭다운 아님)

하단: "링크 목록에 추가" 버튼 (`bg-primary text-page` 필드 채움 스타일, `EventModal`의 저장
버튼과 동일) — 랜딩 URL이 빈 문자열이면 `disabled`. 클릭 시:

1. `useUtmLinksStore().addLink(draft)` 호출 (아래 저장 방식 참고)
2. 태그 제목/랜딩 URL/파라미터 5개를 전부 빈 문자열로 리셋 (모달은 닫지 않음 — 연속 생성)

### URL 조합 로직

`src/lib/utm.ts`, 순수 함수:

```ts
export function buildUtmUrl(landingUrl: string, params: Record<UtmParamKey, string>): string {
  const pairs = Object.entries(params)
    .filter(([, v]) => v.trim() !== '')
    .map(([k, v]) => `utm_${k}=${encodeURIComponent(v.trim())}`);
  if (pairs.length === 0) return landingUrl;
  const separator = landingUrl.includes('?') ? '&' : '?';
  return `${landingUrl}${separator}${pairs.join('&')}`;
}
```

`landingUrl`이 빈 문자열이면 빈 문자열을 그대로 반환(모달에서는 이 상태일 때 "링크 목록에 추가"가
비활성화되므로 문제 없음).

## 3. 만든 UTM 링크 목록

`src/components/utm/UtmLinkTable.tsx` — `ChartCard` 안에 `CampaignPerformanceTable`과 동일한
테이블 구조. 탭 맨 아래 배치.

- 컬럼: 태그 제목(2줄 — 위 제목 `text-card-text font-medium`, 아래
  `text-[11px] text-white/40 truncate`로 `generatedUrl` 전체 표시) / source / medium / campaign /
  term / content / 생성일(`createdAt` → `formatDate` 재사용, "M.D" 포맷) / 액션(복사·삭제 아이콘)
- 정렬: `createdAt` 내림차순(최신순)
- 빈 상태: 목록이 비었을 때 테이블 대신 `<p className="py-8 text-center text-[13px]
  text-white/40">아직 만든 UTM 링크가 없어요</p>`
- 액션 아이콘: `CopyIcon`(→ 클릭 시 `navigator.clipboard.writeText(generatedUrl)`, 1.5초간
  `CheckIcon`으로 스왑해 피드백) / `Trash2Icon`(클릭 시 확인창 없이 즉시
  `useUtmLinksStore().deleteLink(id)`) — 둘 다 `text-white/40 hover:text-white/80`,
  삭제만 hover 시 `hover:text-card-critical`

### 저장 방식

`src/hooks/useUtmLinksStore.ts` — `usePersonalCalendarStore.ts`와 동일한 패턴이되 백엔드 동기화는
하지 않는다(이 데이터는 Apps Script 공유 블롭에 필드가 없고, 스펙상 로컬 저장이면 충분):

- `localStorage` 키: `modibodi_utm_links_v1`
- `useState(loadStoredLinks)` 초기화 + `useEffect`로 변경 시마다 `localStorage.setItem`
- `addLink(input)`: `buildUtmUrl`로 `generatedUrl` 계산, `id`/`createdAt` 채워서 배열 앞에 추가
- `deleteLink(id)`: 필터링

`SettingsContext`(앱 설정 blob)에는 넣지 않는다 — "임시값으로 초기화" 버튼을 눌러도 사용자가
만든 링크 목록은 사라지면 안 되기 때문 (사용자 확인 완료).

## 4. 성과 분석 섹션

모달과 목록 사이, `UtmAnalysisTab.tsx`에서 순서대로 렌더링.

### 요약 카드 4개

`StatTile` 4개 재사용 (트렌드 비교 대상이 없으므로 CRM 탭의 "휴면 고객"/"평균 재구매 주기"와
동일하게 `changePct={0}`, `sparkline={[]}`):

- UTM 유입 — `sum(clicks)`, `formatNumber`
- UTM 전환 — `sum(orders)`, `formatNumber`
- UTM 기여 매출 — `sum(revenue)`, `formatKRW`
- 평균 CVR — `sum(orders) / sum(clicks) * 100` (clicks 합계 0이면 0), `formatPercent`

### 소스별 기여 매출 비중 카드

`src/components/utm/UtmSourceShareCard.tsx` — `GradeDistributionCard`(색점 리스트)와
`PurchaseFunnelCard`(비율 막대)를 합친 신규 카드. source별로 `revenue`를 집계해 매출 기준
내림차순 정렬 후, 각 행에 색점(`--card-series-1~6` 순환) + source명 + 매출액 + 비율 막대
(`h-2 rounded-full bg-white/10` 트랙 위에 `bg-[var(--card-series-N)]` 채움, width는 최댓값 대비
비율).

### UTM 링크별 성과 테이블

`src/components/utm/UtmPerformanceTable.tsx` — `CampaignPerformanceTable`과 동일한 테이블 셸.
컬럼: source/medium/campaign/content, 유입(clicks), 전환(orders), CVR(파생 —
`orders/clicks*100`, clicks 0이면 0), 매출(revenue). 매출 내림차순 정렬.

### Mock 데이터

`src/data/mockUtmPerformance.ts` — `UtmPerformanceRow[]` 8~10개를 직접 작성(난수 생성 아님,
`clicks`/`orders`/`revenue`를 기준값으로 고정 — CVR만 렌더 시 역산). source는 다양하게:
인스타그램, 카카오, 블로그, 인플루언서, 문자, 이메일, 커뮤니티 등에서 8~10개 조합. 실제 서비스
느낌이 나도록 채널별 규모감 차등(인스타그램/인플루언서는 유입 크게, 문자/이메일은 유입 작지만
CVR 높게 등)을 수치에 반영한다.

## 범위 밖 (명시)

- 실제 GA4/Apps Script 클릭·전환 추적 연동 — 4번 섹션은 계속 Mock으로 유지, 나중에 실데이터
  연동 시 `mockUtmPerformance.ts`를 실제 fetch로 교체하는 정도로 갈아끼울 수 있게 컴포넌트는
  `rows: UtmPerformanceRow[]` prop을 받는 순수 표시 컴포넌트로 만든다.
- 만든 UTM 링크(1번 섹션)와 성과 데이터(4번 섹션)를 연결하는 기능 (예: 방금 만든 링크가 자동으로
  성과 테이블에 뜨는 것) — 스펙상 명시적으로 별개 데이터
- UTM 링크 목록의 백엔드(Apps Script) 동기화, 기기 간 공유
- 링크 수정 기능 (스펙에 없음 — 삭제 후 재생성만 가능)
- 날짜 범위 필터 연동

## 테스트 / 검증

- `npm run dev`로 신규 탭을 사이드바에서 클릭해 확인
- 모달: 파라미터 입력 시 생성된 URL 실시간 갱신, 랜딩 URL에 `?`가 이미 있는 경우 `&`로 이어붙는지,
  값 URL 인코딩 확인, 랜딩 URL 비었을 때 "링크 목록에 추가" 비활성화 확인
- 링크 추가 후 폼이 리셋되고 모달이 안 닫히는지, 목록에 최신순으로 쌓이는지
- 새로고침 후 만든 링크 목록이 유지되는지(`localStorage`)
- 복사 버튼 클릭 시 클립보드에 값이 들어가는지(아이콘 피드백), 삭제 버튼이 확인창 없이 즉시
  지워지는지
- 성과 분석 섹션: 요약 카드 4개/소스별 비중/성과 테이블이 Mock 데이터 기준으로 합이 맞는지
  (CVR = orders/clicks 재계산 값과 일치하는지)
- 라이트/다크 모드 전환 시 깨지지 않는지
