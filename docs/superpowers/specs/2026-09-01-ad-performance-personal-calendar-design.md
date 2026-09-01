# 광고 성과 분석 탭 + 개인 일정관리 탭 설계

## 배경 및 범위

`modibodi-dashboard/.worktrees/dashboard-v2/web` (React 재구축 버전, localhost:5184)에 신규 탭
2개를 추가한다.

1. **광고 성과 분석** — 마케팅 탭 바로 아래. Meta 소재(크리에이티브) 단위 성과를 한눈에 보고,
   효율 좋은 소재/교체 권장 소재를 빠르게 파악하기 위한 탭. 내부 마케팅 총괄이 메타 비즈니스
   관리자를 열어보기 전에 1차로 훑어보는 용도.
2. **일정관리** — 재고 탭과 설정 탭 사이. 사용자의 개인/팀 업무 스케줄(회의, 연차, 캠페인 세팅,
   정산 등)을 관리하는 캘린더. 기존 순수 HTML 버전(`modibodi-dashboard/index.html`)의
   "일정관리" 탭 로직을 포팅한다.

두 기능 모두 이번 스펙에서는 **목업 데이터**로 UI/인터랙션을 완성하는 것까지만 다룬다.
Meta 소재 단위 API 연동(Apps Script 확장, 액세스 토큰)은 범위 밖이며 별도 작업으로 진행한다.

기존 탭(마케팅, 캠페인 캘린더, 재고, 설정 등)의 로직은 수정하지 않는다. 특히
`modibodi-dashboard/index.html`(순수 HTML, 라이브 서비스 중)의 "일정관리" 탭 코드는
루트 CLAUDE.md 지침에 따라 **절대 수정하지 않고 참고만 한다**.

## 탭 구성 변경

`src/data/tabs.ts`의 `TABS` 배열을 아래 순서로 갱신한다 (사용자 확인 완료):

```
overview → marketing → ad-performance(신규) → calendar(캠페인 캘린더, 기존) →
pnl → crm → md → inventory → personal-calendar(신규) → settings
```

- 신규 탭 id: `ad-performance` (라벨 "광고 성과 분석"), `personal-calendar` (라벨 "일정관리")
- 기존 `calendar` 탭(캠페인 캘린더, 프로모/광고/입고 리스트)은 그대로 유지 — 이번 작업으로
  건드리지 않는다. "일정관리"라는 이름은 신규 개인 캘린더 탭이 사용한다 (기존 캠페인 캘린더는
  계속 "캠페인 캘린더"라는 라벨 유지).
- 아이콘(lucide-react): `ad-performance` → `ImagesIcon`, `personal-calendar` → `CalendarRangeIcon`
  (기존 `CalendarDaysIcon`과 시각적으로 구분되는 아이콘 사용)
- `src/App.tsx`의 `TAB_COMPONENTS` 맵에 두 컴포넌트 등록

## 1. 광고 성과 분석 탭

### 컴포넌트 구조

- `src/components/marketing/AdPerformanceTab.tsx` — 최상위 탭 컴포넌트. 기존 `MarketingTab.tsx`와
  동일한 패턴(헤더 + `DateRangePicker` + `StatTile` 3개 + 소재 카드 그리드)
  - StatTile 3개: 총 소재 수 / 평균 CTR·CPA(전체 소재 평균) / 교체 권장 소재 수
  - 그 아래 소재 카드 그리드 (반응형 grid, `CreativeCard` 반복 렌더링)
  - 정렬/필터: 채널(현재는 Meta만이지만 확장 가능하게), 판정 등급(전체/베스트/양호/교체권장)
    드롭다운 정도만 (복잡한 필터 UI는 만들지 않음 — YAGNI)
- `src/components/marketing/CreativeCard.tsx` — 소재 1개 카드
  - 썸네일 영역(플레이스홀더 — 실제 이미지 URL이 없는 상태이므로 회색 박스 + 포맷 아이콘
    (이미지/영상/캐러셀)로 대체), 소재명, 채널 배지, 지출/노출/클릭/전환/CTR/CPA/ROAS,
    우측 상단에 판정 배지(베스트·양호·교체권장)
- `src/lib/creativeScoring.ts` — 순수 함수 `rankCreatives(creatives, {topPct, bottomPct})`.
  CPA는 낮을수록·CTR은 높을수록 좋은 방향으로 정규화해 백분위 산출 후, 상위
  `topPct`(기본 20%) → `best`, 하위 `bottomPct`(기본 20%) → `replace`, 나머지 → `good`.
  임계값은 함수 인자 기본값으로 상수화해 나중에 쉽게 조정 가능하게 한다.
- `src/data/mockAdCreatives.ts` — Meta 소재 목업 12~16개 정도. 필드:
  `{ id, name, format: 'image'|'video'|'carousel', channel: 'Meta', status: 'active'|'paused',
  spend, impressions, clicks, conversions, startDate }`. CTR/CPA/ROAS는 파생값으로 계산
  (저장하지 않음 — 다른 탭의 기존 관례와 동일).

### 데이터/판정 로직

- CTR = clicks/impressions, CPA = spend/conversions, ROAS는 이번 단계에선 매출 연결 데이터가
  없으므로 생략하거나 대략적 추정치로 표시하지 않는다 (없는 데이터를 지어내지 않음 — CTR/CPA
  중심으로 판정).
- 판정 배지는 `rankCreatives`가 반환한 등급을 그대로 표시. 색상: 베스트=`card-good`,
  양호=중립 그레이, 교체권장=`card-critical`.

### 범위 밖 (명시)

- 실제 Meta Marketing API 소재/이미지 조회 연동 (Apps Script 확장, `ads_read` 권한 토큰 필요)
- 소재 자동 교체/일시정지 실행 기능 (판정은 참고용 표시만, 실제 액션은 사용자가 메타 비즈니스
  관리자에서 직접 수행)

## 2. 일정관리(개인 캘린더) 탭

### 포팅 원칙

기존 스펙(`2026-08-27-dashboard-rebuild-overview-design.md`)에서 캠페인 캘린더에 적용했던
원칙을 동일하게 따른다: **로직/인터랙션만 재사용, 비주얼은 100% 새로 만든다.**

- 원본(`modibodi-dashboard/index.html`, 약 944~1496번째 줄, "일정관리" 관련 두 번째
  `<script>` 블록)에서 아래 기능을 그대로 포팅:
  - 월간/주간 뷰 전환
  - 날짜 셀 드래그로 기간 선택 → 이벤트 추가 모달 오픈
  - 이벤트 모달: 제목, 시작~종료 날짜, 시작~종료 시간(드롭다운), 색상 스와치, 메모(세로
    리사이즈 가능한 textarea), 저장/삭제/취소
  - 주간 뷰에서 같은 주에 겹치는 이벤트를 lane(줄)에 배치하는 알고리즘
  - 리마인드 스트립(다가오는 일정 중 강조 표시할 항목)
- 원본 파일은 읽기 전용 참고 자료로만 사용. 수정하지 않는다.
- 비주얼은 dashboard-v2 디자인 토큰 적용 (라이트/다크 모드, `GradientCard`/`ChartCard`,
  Primary 오렌지 헤드라인 등) — 원본의 검정 배경 글래스모피즘 CSS는 가져오지 않는다.

### 컴포넌트 구조

- `src/components/calendar/PersonalCalendarTab.tsx` — 최상위 탭. 헤더(월/주 토글, 이전/다음
  네비게이션) + 캘린더 그리드 + 리마인드 스트립 + 이벤트 모달
- `src/components/calendar/personalCalendarLogic.ts` — 원본의 순수 로직 함수들을 DOM 조작
  없는 TypeScript 함수로 재작성: `dnum`, `daysInMonth`, `firstWeekday`, 주간 lane 배치 알고리즘
  등. 컴포넌트는 이 함수들의 결과로 렌더링한다 (원본처럼 `innerHTML` 문자열 조립 방식이 아니라
  React가 상태를 소유하는 방식으로 전환).
- `src/components/calendar/EventModal.tsx` — 이벤트 추가/수정 모달 (제목/날짜/시간/색상/메모)
- `src/data/mockPersonalEvents.ts` — 원본과 같은 결의 시드 데이터(회의/연차/캠페인 세팅/정산
  등), `mockOverview.ts`의 `TODAY` 기준으로 날짜 재배치

### 저장 방식 (원본 대비 개선)

- 원본은 이벤트가 메모리 상태로만 존재해 새로고침하면 초기화된다. 여기서는 `localStorage`
  키 `modibodi_personal_calendar_v1`에 이벤트 배열을 저장해 새로고침 후에도 유지되도록 한다
  (Settings 탭이 `SettingsContext` + `localStorage`로 값을 유지하는 것과 동일한 패턴). 별도
  React Context를 새로 만들지 않고, 이 탭 전용의 작은 커스텀 훅(`usePersonalCalendarStore`)으로
  로컬 상태 + `localStorage` 동기화를 처리한다 (전역 상태로 승격할 이유가 없음 — 이 데이터를
  쓰는 곳은 이 탭뿐).

### 범위 밖 (명시)

- 구글 캘린더/시트 등 외부 연동 (원본도 아직 브라우저 로컬 상태 단계)
- 다른 탭(Overview 등)에서 개인 일정을 읽어와 표시하는 연동 — 이번 스펙 범위 아님

## 테스트 / 검증

- `npm run dev`로 두 신규 탭을 사이드바에서 직접 클릭해 확인
- 라이트/다크 모드 전환 시 두 탭 모두 깨지지 않는지 확인
- 광고 성과 분석: 정렬/필터 동작, 목업 데이터 분포에서 베스트/교체권장 배지가 그럴듯하게
  나오는지 확인
- 일정관리: 날짜 드래그로 새 일정 추가, 메모 textarea 세로 리사이즈, 월/주 뷰 전환, 새로고침
  후 추가한 일정이 유지되는지(`localStorage`) 확인

## 범위 밖 (전체 공통)

- Meta Marketing API 소재/이미지 연동, Apps Script 백엔드 확장
- 기존 `modibodi-dashboard/index.html`(순수 HTML 버전) 수정
- 기존 "캠페인 캘린더" 탭 로직 변경
- GitHub Pages 배포 전환
