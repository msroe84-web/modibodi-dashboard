# 모디보디 대시보드 리뉴얼 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `index.html`의 정보구조를 6탭에서 5탭(전체 매출 현황/마케팅/CRM/분석/일정관리)으로 재편하고,
새 디자인 톤(뉴트럴 컬러 + 숫자용 모노스페이스 + 얇은 구분선 테이블)을 적용한다.

**Architecture:** 프레임워크 없는 단일 `index.html` 파일에 대한 순차적 편집. 새 컴포넌트는 기존
`.glass` 카드 패턴(반투명 배경 + blur + border)을 그대로 재사용하고, 차트는 기존 파일에 이미 있는
인라인 SVG 패턴(막대/도넛/게이지)을 복제해서 만든다. 캘린더 탭(두 번째 `<script>` 블록 전체)은
어떤 태스크에서도 수정하지 않는다.

**Tech Stack:** HTML/CSS/JS (바닐라, 빌드 도구 없음), Google Fonts(Noto Sans KR + 신규 IBM Plex
Mono), `localStorage`(재고 수기 입력 위젯 전용, 이 프로젝트 최초의 localStorage 사용).

**테스트 방식에 대한 메모:** 이 저장소에는 테스트 프레임워크가 없다(순수 정적 HTML 파일, npm/빌드
도구 없음). 따라서 각 태스크의 "검증" 단계는 자동화 테스트가 아니라 **브라우저에서 직접 열어 육안
확인**하는 절차로 대체한다(Windows에서는 `index.html`을 더블클릭하거나 `start index.html`).

**참고 문서:**
- 스펙: [docs/superpowers/specs/2026-08-26-dashboard-renewal-design.md](../specs/2026-08-26-dashboard-renewal-design.md)
- 브랜드 레퍼런스: [BRAND.md](../../../BRAND.md)

---

## 사전 조사 메모 (실행자가 알아야 할 것)

- `index.html`은 1540줄이지만 **273~282번째 줄에 로고 base64 이미지가 통째로 들어 있어 한 줄이
  5만 자를 넘는다.** 이 범위는 Read 도구로 읽지 말 것(토큰 초과 에러 발생). 절대 건드릴 필요도 없다.
- 파일 대부분이 인라인 스타일(`style="..."`)로 작성되어 있어 CSS 클래스보다 **고유한 텍스트 조각을
  앵커로 삼아 Edit 도구로 치환**하는 방식이 안전하다. 아래 각 스텝의 "Find"는 그 앵커 문자열이다.
  다른 태스크를 먼저 적용하면 이후 태스크의 줄 번호가 달라지므로, **줄 번호는 참고용이고 실제 매칭은
  텍스트 앵커로 한다.**
- 캘린더 관련 코드는 `index.html:1109` `<script>`부터 `renderReminders` 함수(약 1495번째 줄)까지다.
  이 범위 안의 함수/CSS 클래스는 스펙 §2-1에 나열된 것과 동일 — 절대 수정 금지.
- 대시보드 탭 전환은 `switchTab(id)` 하나로 처리된다(`.tab-panel`의 `display` 토글 +
  `.nav-item`의 `active` 클래스 토글, `data-tab` 속성 매칭). 새 탭을 추가/삭제해도 이 함수 자체는
  손댈 필요 없다 — `.tab-panel` div와 `.nav-item` div의 짝만 맞추면 된다.
- 각 태스크의 "Find" 블록은 실제 파일을 옮겨 적은 것이라 공백 하나까지 완전히 일치하지 않으면
  Edit이 실패할 수 있다. Edit 실패 시 `grep -n "<특징적인 부분 문자열>" index.html`로 실제 텍스트를
  먼저 확인하고, 공백/따옴표 차이만 실제 파일 기준으로 맞춰서 재시도할 것 — 구조와 의도는 그대로
  유지한다.
- `panel-overview`(기존 "종합 현황")에는 이미 광고비·매출 KPI, 광고비/매출/ROAS 콤보차트, 요일별
  매출 도넛, **런칭 준비 진행률 게이지**, **"다가오는 마일스톤" 카드**(부제 "일정관리 탭과 자동
  연동")가 들어있다. 즉 로드맵 흡수(스펙 §5-1-6)는 이미 절반 이상 되어 있는 상태 — 이 카드를
  확장하고 `panel-roadmap`을 삭제하는 것이 핵심 작업이다.
- `panel-sales`(기존 "매출")에는 이미 채널별 매출 순위, 수수료율, **"월별 결제금액 입력" 아코디언
  (클릭하면 펼쳐지는 입력 테이블)**이 있다. 이 아코디언 패턴을 지출 내역 위젯(Task 6)과 재고 입력
  위젯(Task 8)에서 그대로 재사용한다.

---

## File Structure

| 파일 | 역할 |
|---|---|
| `index.html` | 유일한 수정 대상. 아래 모든 태스크가 여기 적용됨. |
| `CLAUDE.md` | Task 14에서 새 탭 구조/폰트/데이터 흐름 반영 |

새로 만드는 파일 없음(단일 파일 원칙 유지).

---

## Task 1: 디자인 토큰 — IBM Plex Mono 폰트 + 숫자/테이블 스타일

**Files:**
- Modify: `index.html` (head의 Google Fonts 링크, `<style>` 블록 내 `.glass` 근처)

- [ ] **Step 1: Google Fonts 링크에 IBM Plex Mono 추가**

Find:
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

Replace:
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: 숫자 전용 클래스 + 얇은 구분선 테이블 클래스 추가**

Find:
```css
  .glass {
    background:rgba(255,255,255,.055);
    -webkit-backdrop-filter:blur(22px); backdrop-filter:blur(22px);
    border:1px solid rgba(255,255,255,.14);
  }
```

Replace:
```css
  .glass {
    background:rgba(255,255,255,.055);
    -webkit-backdrop-filter:blur(22px); backdrop-filter:blur(22px);
    border:1px solid rgba(255,255,255,.14);
  }
  .num-mono { font-family:'IBM Plex Mono','Noto Sans KR',monospace; font-variant-numeric:tabular-nums; }
  .thin-table { width:100%; border-collapse:collapse; }
  .thin-table td, .thin-table th { padding:10px 6px; border-bottom:1px solid rgba(255,255,255,.08); font-size:12.5px; text-align:left; }
  .thin-table th { color:#888; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
  .thin-table tr:last-child td { border-bottom:none; }
  .up-pos { color:#4ADE80; }
  .up-neg { color:#F87171; }
  .accordion-toggle { cursor:pointer; user-select:none; }
  .accordion-body { display:none; }
  .accordion-body.open { display:block; }
```

- [ ] **Step 3: 브라우저에서 확인**

`index.html`을 브라우저로 열어 개발자도구 콘솔에 에러가 없는지, 캘린더 탭이 정상 렌더링되는지 확인.
`document.fonts.check("12px 'IBM Plex Mono'")`를 콘솔에 입력해 `true`가 나오면 폰트 로드 확인.

- [ ] **Step 4: 커밋**

```bash
git add index.html
git commit -m "Add IBM Plex Mono font and shared design tokens (mono numbers, thin-table, accordion)"
```

---

## Task 2: CSS 중복 블록 정리

`<style>` 블록 안에 `.nav-item.active`/`.topnav-scroll`/`.chart-tooltip2`/`.topbar-glass`/미디어쿼리
묶음이 총 7번 반복되어 있다(약 126~267번째 줄). 마지막(가장 완전한) 버전 하나만 남기고 나머지를
삭제한다.

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 반복 블록 확인**

```bash
grep -c "topbar-glass" index.html
```
Expected: `7` (수정 전). 이 숫자가 1로 줄면 성공.

- [ ] **Step 2: 첫 번째 등장(126~130번째 줄 부근)만 남기고 나머지 6개 삭제**

126번째 줄 부근의 첫 블록:
```css
  .nav-item.active { background:rgba(255,255,255,.16) !important; color:#fff !important; font-weight:700 !important; }
  .nav-item:hover { background:rgba(255,255,255,.08); }
  .topnav-scroll { display:flex; gap:4px; overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .page-pad { max-width:1600px; margin:0 auto; padding:28px; position:relative; z-index:1; }
  .chart-tooltip2 { position:fixed; background:rgba(20,20,20,.92); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,.18); color:#fff; font-size:12px; font-weight:600; padding:7px 12px; border-radius:9px; white-space:nowrap; opacity:0; pointer-events:none; transition:opacity .1s; transform:translate(-50%,-135%); z-index:100; }
```
이건 유지. 이후 반복되는 6개 블록(`.chart-tooltip2` 재선언부터 각 미디어쿼리까지)을 전부 삭제하고,
마지막 반복(파일에서 가장 넓은 선택자를 쓰는 버전, `.kpi4, .kpi3, .kpi5`와 `.grid2, .grid3`를 함께
묶은 버전)의 미디어쿼리 2개만 살려서 첫 블록 뒤에 붙인다. 최종적으로 `<style>` 블록에는 아래 내용이
**한 번씩만** 남아야 한다:

```css
  .nav-item.active { background:rgba(255,255,255,.16) !important; color:#fff !important; font-weight:700 !important; }
  .nav-item:hover { background:rgba(255,255,255,.08); }
  .topnav-scroll { display:flex; gap:4px; overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .page-pad { max-width:1600px; margin:0 auto; padding:28px; position:relative; z-index:1; }
  .chart-tooltip2 { position:fixed; background:rgba(20,20,20,.92); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,.18); color:#fff; font-size:12px; font-weight:600; padding:7px 12px; border-radius:9px; white-space:nowrap; opacity:0; pointer-events:none; transition:opacity .1s; transform:translate(-50%,-135%); z-index:100; }
  .donut-hover-wrap svg:first-child { transition:transform .22s ease; transform-origin:center; }
  .donut-hover-wrap:hover svg:first-child { transform:scale(1.12); }
  .donut-hover-wrap:hover .donut-legend-panel { opacity:1; }
  .topbar-glass { position:sticky; top:0; z-index:20; background:rgba(10,10,10,.55); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); border-bottom:1px solid rgba(255,255,255,.12); }
  @media (max-width:900px) {
    .kpi4, .kpi3, .kpi5 { grid-template-columns:repeat(2,1fr) !important; }
    .grid2, .grid3 { grid-template-columns:1fr !important; }
    .trend-split { grid-template-columns:1fr !important; }
  }
  @media (max-width:520px) {
    .kpi4, .kpi3, .kpi5 { grid-template-columns:repeat(2,1fr) !important; gap:8px !important; }
    .kpi-card { padding:14px 12px !important; }
    .kpi-value { font-size:19px !important; }
    .kpi-icon { width:34px !important; height:34px !important; font-size:15px !important; margin-bottom:10px !important; }
  }
```

- [ ] **Step 3: 확인**

```bash
grep -c "topbar-glass" index.html
```
Expected: `1`

브라우저에서 모든 탭(종합 현황/매출/마케팅/CRM/분석/로드맵/일정관리)을 클릭해 레이아웃이 이전과
동일하게 보이는지 확인(순수 정리라 시각적 변화가 없어야 함). 특히 900px 이하로 창을 좁혀서 반응형
그리드가 여전히 2열로 바뀌는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add index.html
git commit -m "Deduplicate repeated CSS block in style tag (7x -> 1x)"
```

---

## Task 3: 상단 탭 내비게이션 재구성

"매출"과 "로드맵" nav-item을 제거하고, "종합 현황" 라벨을 "전체 매출 현황"으로 바꾼다.
`switchTab()` 함수 자체는 수정하지 않는다 — nav-item과 tab-panel div만 조정한다.

**Files:**
- Modify: `index.html` (약 284번째 줄, `topnav-scroll` div)

- [ ] **Step 1: nav-item 목록 수정**

Find (해당 줄 안에서 아래 두 조각을 각각 찾아 처리):
```html
<div class="nav-item active" data-tab="overview" onclick="switchTab('overview')" style="padding:9px 16px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;color:#bbb;white-space:nowrap;">종합 현황</div><div class="nav-item" data-tab="sales" onclick="switchTab('sales')" style="padding:9px 16px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;color:#bbb;white-space:nowrap;">매출</div>
```

Replace:
```html
<div class="nav-item active" data-tab="overview" onclick="switchTab('overview')" style="padding:9px 16px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;color:#bbb;white-space:nowrap;">전체 매출 현황</div>
```

Find:
```html
<div class="nav-item" data-tab="roadmap" onclick="switchTab('roadmap')" style="padding:9px 16px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;color:#bbb;white-space:nowrap;">로드맵</div>
```

Replace: (빈 문자열 — 해당 div 전체 삭제)

- [ ] **Step 2: 확인**

브라우저에서 상단 탭이 "전체 매출 현황 / 마케팅 / CRM / 분석 / 일정관리" 5개만 보이는지 확인. 각
탭을 클릭해 전환이 정상 동작하는지 확인(아직 `panel-sales`/`panel-roadmap` div 자체는 남아있어도
됨 — Task 9~10에서 삭제).

- [ ] **Step 3: 커밋**

```bash
git add index.html
git commit -m "Restructure tab nav: merge overview+sales into one tab, remove roadmap tab"
```

---

## Task 4: 전체 매출 현황 — 이번 달 목표 매출 진행률 위젯

`panel-overview`의 상단 필터 바로 아래, 기존 KPI 그리드 앞에 새 위젯을 삽입한다.

**Files:**
- Modify: `index.html` (`panel-overview` 시작 부분)

- [ ] **Step 1: 위젯 삽입**

Find:
```html
    </div></div><div class="kpi3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:12px;">
```
(이 문자열은 `panel-overview`의 필터 바 `</div></div>` 바로 다음, 기존 3열 KPI 그리드 시작 지점 —
파일 안에서 유일하게 이 조합으로 나타난다.)

Replace:
```html
    </div></div><div class="glass" style="border-radius:20px;padding:26px 28px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <div>
          <div style="font-size:11px;font-weight:700;color:#999;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px;">2026년 8월 목표 매출 진행률</div>
          <div class="num-mono" style="font-size:44px;font-weight:800;color:#F5F5F5;line-height:1;">0%</div>
          <div style="margin-top:10px;font-size:13px;color:#F87171;font-weight:600;">목표 매출이 아직 설정되지 않은 달입니다 (2026-08 목표: 0원)</div>
        </div>
        <div style="flex:1;min-width:220px;max-width:420px;">
          <div style="height:14px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;">
            <div class="num-mono" style="width:0%;height:100%;background:#F65934;border-radius:999px;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11.5px;color:#999;">
            <span class="num-mono">실적 0원</span>
            <span class="num-mono">목표 0원</span>
          </div>
        </div>
      </div>
    </div><div class="kpi3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:12px;">
```

이 위젯은 2026-08 목표가 0원(스펙 §5-1-1 표 참고)이라는 실제 데이터를 그대로 반영한 것 — 9월부터는
`0%` 대신 실제 진행률로, 목표 금액도 593,250,000원 등으로 바뀌어야 하므로 실데이터 연동 시 교체할
자리라는 걸 알 수 있게 문구를 남겨둔다.

- [ ] **Step 2: 확인**

브라우저에서 "전체 매출 현황" 탭 최상단에 새 위젯이 보이는지, 글래스 카드 톤이 다른 카드들과
일치하는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add index.html
git commit -m "Add monthly revenue goal progress widget to overview tab"
```

---

## Task 5: 전체 매출 현황 — 채널별 매출 구성 (자사몰/외부몰/공구 구분)

기존 "채널별 매출 순위" 카드(현재 CAFE24/SMARTSTORE/29CM 나열) 위에, 자사몰·외부몰·인플루언서
공구 3개 그룹 요약 바를 추가한다.

**Files:**
- Modify: `index.html` (`panel-overview`의 "채널별 매출 순위" 카드)

- [ ] **Step 1: 그룹 요약 바 삽입**

Find:
```html
        <div><div style="font-size:16px;font-weight:700;color:#F5F5F5;">채널별 매출 순위</div><div style="font-size:12px;color:#aaa;margin-top:2px;">2026-08</div></div>
        
      </div>
      <div style="padding:20px 24px;flex:1;display:flex;flex-direction:column;justify-content:center;"><div><div style="display:flex;align-items:center;gap:10px;padding:8px 0;font-size:12.5px;">
          <span style="width:16px;color:#888;font-size:11px;">1</span>
          <span style="width:120px;flex-shrink:0;color:#eee;">CAFE24</span>
```

Replace:
```html
        <div><div style="font-size:16px;font-weight:700;color:#F5F5F5;">채널별 매출 구성</div><div style="font-size:12px;color:#aaa;margin-top:2px;">2026-08 · 자사몰/외부몰/공구는 마진 구조가 달라 구분 표시</div></div>
        
      </div>
      <div style="padding:16px 24px 4px;flex-shrink:0;display:flex;gap:8px;flex-wrap:wrap;">
        <div style="flex:1;min-width:110px;background:rgba(255,255,255,.05);border-radius:12px;padding:12px 14px;">
          <div style="font-size:10.5px;color:#999;margin-bottom:4px;">자사몰 (카페24)</div>
          <div class="num-mono" style="font-size:17px;font-weight:800;color:#F5F5F5;">90%</div>
        </div>
        <div style="flex:1;min-width:110px;background:rgba(255,255,255,.05);border-radius:12px;padding:12px 14px;">
          <div style="font-size:10.5px;color:#999;margin-bottom:4px;">외부몰 (29CM 등)</div>
          <div class="num-mono" style="font-size:17px;font-weight:800;color:#F5F5F5;">10%</div>
        </div>
        <div style="flex:1;min-width:150px;background:rgba(255,255,255,.05);border-radius:12px;padding:12px 14px;">
          <div style="font-size:10.5px;color:#999;margin-bottom:4px;">인플루언서 공구 (별도 트랙)</div>
          <div class="num-mono" style="font-size:17px;font-weight:800;color:#F5F5F5;">0원</div>
          <div style="font-size:10px;color:#777;margin-top:2px;">인플루언서 40% : 리브위드 60% 배분 — 총매출과 별도 집계</div>
        </div>
      </div>
      <div style="padding:12px 24px 20px;flex:1;display:flex;flex-direction:column;justify-content:center;"><div><div style="display:flex;align-items:center;gap:10px;padding:8px 0;font-size:12.5px;">
          <span style="width:16px;color:#888;font-size:11px;">1</span>
          <span style="width:120px;flex-shrink:0;color:#eee;">CAFE24</span>
```

- [ ] **Step 2: 확인**

브라우저에서 "채널별 매출 구성" 카드에 자사몰 90% / 외부몰 10% / 공구 0원 요약 바가 순위 리스트
위쪽에 나타나는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add index.html
git commit -m "Add channel group breakdown (own-mall/external/group-buy) to revenue tab"
```

---

## Task 6: 전체 매출 현황 — 지출 내역 통합 아코디언

새 글래스 카드를 하나 추가해 광고비/매입가/수수료/물류비/기타고정비를 카테고리별로 접었다 펼 수
있게 만든다. `panel-sales`의 기존 "월별 결제금액 입력" 아코디언과 동일한 상호작용 패턴(클릭 시
`.open` 클래스 토글)을 사용한다.

**Files:**
- Modify: `index.html` (`panel-overview` 안, 재무 위젯들이 모여있는 `grid2` 섹션 뒤)

- [ ] **Step 1: 아코디언 토글 스크립트 추가**

Find:
```html
function switchTab(id) {
```

Replace:
```html
function toggleAccordion(btn) {
  const body = btn.nextElementSibling;
  body.classList.toggle('open');
  const caret = btn.querySelector('.acc-caret');
  if (caret) caret.textContent = body.classList.contains('open') ? '▾' : '▸';
}
function switchTab(id) {
```

- [ ] **Step 2: 지출 내역 카드 삽입**

"다가오는 마일스톤" 카드 바로 앞(Find 아래 조각은 그 카드가 시작되는 지점)에 지출/손익 카드를
삽입한다.

Find:
```html
    </div></div><div style="background:rgba(255,255,255,.055);-webkit-backdrop-filter:blur(22px);backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,.14);border-radius:20px;overflow:hidden;margin-bottom:20px;display:flex;flex-direction:column;height:100%;">
      <div style="display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.1);flex-wrap:wrap;flex-shrink:0;">
        <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;">🚩</div>
        <div><div style="font-size:16px;font-weight:700;color:#F5F5F5;">다가오는 마일스톤</div>
```

Replace:
```html
    </div></div><div class="glass" style="border-radius:20px;overflow:hidden;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.1);">
        <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;">💸</div>
        <div><div style="font-size:16px;font-weight:700;color:#F5F5F5;">지출 내역</div><div style="font-size:12px;color:#aaa;margin-top:2px;">2026-08 · 카테고리 클릭 시 세부 항목 펼침</div></div>
        <span class="num-mono" style="margin-left:auto;font-size:18px;font-weight:800;color:#F5F5F5;">6,455,000원</span>
      </div>
      <div style="padding:8px 12px 16px;">
        <div class="accordion-toggle" onclick="toggleAccordion(this)" style="display:flex;align-items:center;gap:10px;padding:12px 12px;">
          <span class="acc-caret" style="width:14px;color:#888;">▸</span>
          <span style="flex:1;color:#eee;font-size:13px;">광고비</span>
          <span class="num-mono" style="color:#ddd;font-size:13px;">1,000,000원</span>
        </div>
        <div class="accordion-body" style="padding:0 12px 8px 36px;">
          <table class="thin-table"><tbody>
            <tr><td>META</td><td class="num-mono" style="text-align:right;">520,000원</td></tr>
            <tr><td>NAVER SA</td><td class="num-mono" style="text-align:right;">210,000원</td></tr>
            <tr><td>NAVER DA</td><td class="num-mono" style="text-align:right;">80,000원</td></tr>
            <tr><td>KAKAO</td><td class="num-mono" style="text-align:right;">60,000원</td></tr>
            <tr><td>GOOGLE</td><td class="num-mono" style="text-align:right;">70,000원</td></tr>
            <tr><td>TIKTOK</td><td class="num-mono" style="text-align:right;">40,000원</td></tr>
            <tr><td>리타겟팅</td><td class="num-mono" style="text-align:right;">20,000원</td></tr>
          </tbody></table>
        </div>
        <div class="accordion-toggle" onclick="toggleAccordion(this)" style="display:flex;align-items:center;gap:10px;padding:12px 12px;">
          <span class="acc-caret" style="width:14px;color:#888;">▸</span>
          <span style="flex:1;color:#eee;font-size:13px;">매입가(COGS)</span>
          <span class="num-mono" style="color:#ddd;font-size:13px;">3,200,000원</span>
        </div>
        <div class="accordion-body" style="padding:0 12px 8px 36px;">
          <table class="thin-table"><tbody>
            <tr><td>생리팬티</td><td class="num-mono" style="text-align:right;">2,400,000원</td></tr>
            <tr><td>수영복</td><td class="num-mono" style="text-align:right;">500,000원</td></tr>
            <tr><td>틴에이지</td><td class="num-mono" style="text-align:right;">300,000원</td></tr>
          </tbody></table>
        </div>
        <div class="accordion-toggle" onclick="toggleAccordion(this)" style="display:flex;align-items:center;gap:10px;padding:12px 12px;">
          <span class="acc-caret" style="width:14px;color:#888;">▸</span>
          <span style="flex:1;color:#eee;font-size:13px;">수수료 (PG·외부몰·인플루언서 R/S)</span>
          <span class="num-mono" style="color:#ddd;font-size:13px;">655,000원</span>
        </div>
        <div class="accordion-body" style="padding:0 12px 8px 36px;">
          <table class="thin-table"><tbody>
            <tr><td>자사몰 PG사 (3.5%)</td><td class="num-mono" style="text-align:right;">375,000원</td></tr>
            <tr><td>외부몰 수수료 (20%)</td><td class="num-mono" style="text-align:right;">240,000원</td></tr>
            <tr><td>인플루언서 R/S (35%)</td><td class="num-mono" style="text-align:right;">40,000원</td></tr>
          </tbody></table>
        </div>
        <div class="accordion-toggle" onclick="toggleAccordion(this)" style="display:flex;align-items:center;gap:10px;padding:12px 12px;">
          <span class="acc-caret" style="width:14px;color:#888;">▸</span>
          <span style="flex:1;color:#eee;font-size:13px;">물류비</span>
          <span class="num-mono" style="color:#ddd;font-size:13px;">900,000원</span>
        </div>
        <div class="accordion-body" style="padding:0 12px 8px 36px;">
          <table class="thin-table"><tbody>
            <tr><td>CJ택배 대행비</td><td class="num-mono" style="text-align:right;">800,000원</td></tr>
            <tr><td>반품 처리 (2%)</td><td class="num-mono" style="text-align:right;">100,000원</td></tr>
          </tbody></table>
        </div>
        <div class="accordion-toggle" onclick="toggleAccordion(this)" style="display:flex;align-items:center;gap:10px;padding:12px 12px;">
          <span class="acc-caret" style="width:14px;color:#888;">▸</span>
          <span style="flex:1;color:#eee;font-size:13px;">기타 고정비</span>
          <span class="num-mono" style="color:#ddd;font-size:13px;">700,000원</span>
        </div>
        <div class="accordion-body" style="padding:0 12px 8px 36px;">
          <table class="thin-table"><tbody>
            <tr><td>사이트 구축/관리</td><td class="num-mono" style="text-align:right;">300,000원</td></tr>
            <tr><td>부자재</td><td class="num-mono" style="text-align:right;">150,000원</td></tr>
            <tr><td>GWP 제작</td><td class="num-mono" style="text-align:right;">150,000원</td></tr>
            <tr><td>CS 대행</td><td class="num-mono" style="text-align:right;">50,000원</td></tr>
            <tr><td>촬영</td><td class="num-mono" style="text-align:right;">50,000원</td></tr>
          </tbody></table>
        </div>
      </div>
    </div><div style="background:rgba(255,255,255,.055);-webkit-backdrop-filter:blur(22px);backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,.14);border-radius:20px;overflow:hidden;margin-bottom:20px;display:flex;flex-direction:column;height:100%;">
      <div style="display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.1);flex-wrap:wrap;flex-shrink:0;">
        <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;">🚩</div>
        <div><div style="font-size:16px;font-weight:700;color:#F5F5F5;">다가오는 마일스톤</div>
```

지출 합계(6,455,000원 = 1,000,000+3,200,000+655,000+900,000+700,000)는 카테고리 소계를 그대로
더한 값 — 실데이터 연동 시 이 합계 계산은 JS로 자동화한다(지금은 레이아웃 검증 단계라 하드코딩).

- [ ] **Step 3: 확인**

브라우저에서 "지출 내역" 카드의 카테고리 행을 클릭하면 세부 항목이 펼쳐지고, 캐럿(▸/▾)이 바뀌는지
확인.

- [ ] **Step 4: 커밋**

```bash
git add index.html
git commit -m "Add collapsible expense breakdown widget to revenue tab"
```

---

## Task 7: 전체 매출 현황 — 영업손익 요약 카드

Task 6에서 추가한 지출 카드 바로 뒤에 손익 요약 카드를 추가한다.

**Files:**
- Modify: `index.html` (Task 6에서 만든 지출 카드 닫는 태그 직후)

- [ ] **Step 1: 손익 카드 삽입**

Find (Task 6 이후 파일에 이렇게 존재):
```html
      </div>
    </div><div style="background:rgba(255,255,255,.055);-webkit-backdrop-filter:blur(22px);backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,.14);border-radius:20px;overflow:hidden;margin-bottom:20px;display:flex;flex-direction:column;height:100%;">
      <div style="display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.1);flex-wrap:wrap;flex-shrink:0;">
        <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;">🚩</div>
        <div><div style="font-size:16px;font-weight:700;color:#F5F5F5;">다가오는 마일스톤</div>
```
(마지막 `</div>` 하나만 매칭되도록, Task 6 결과물에서 지출 카드의 닫는 `</div>` 다음 줄부터 시작하는
이 조합을 앵커로 쓴다.)

Replace:
```html
      </div>
    </div><div class="glass" style="border-radius:20px;padding:22px 24px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;">📊</div>
        <div style="font-size:16px;font-weight:700;color:#F5F5F5;">영업손익 요약</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">
        <div>
          <div style="font-size:10.5px;color:#999;margin-bottom:6px;">매출 합계</div>
          <div class="num-mono" style="font-size:20px;font-weight:800;color:#F5F5F5;">642,800원</div>
        </div>
        <div>
          <div style="font-size:10.5px;color:#999;margin-bottom:6px;">지출 합계</div>
          <div class="num-mono" style="font-size:20px;font-weight:800;color:#F5F5F5;">6,455,000원</div>
        </div>
        <div>
          <div style="font-size:10.5px;color:#999;margin-bottom:6px;">영업손익 / ROI</div>
          <div class="num-mono up-neg" style="font-size:20px;font-weight:800;">-5,812,200원 · -90.1%</div>
        </div>
      </div>
    </div><div style="background:rgba(255,255,255,.055);-webkit-backdrop-filter:blur(22px);backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,.14);border-radius:20px;overflow:hidden;margin-bottom:20px;display:flex;flex-direction:column;height:100%;">
      <div style="display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.1);flex-wrap:wrap;flex-shrink:0;">
        <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;">🚩</div>
        <div><div style="font-size:16px;font-weight:700;color:#F5F5F5;">다가오는 마일스톤</div>
```

숫자는 이 탭 안의 다른 카드(매출 642,800원은 Task 5의 채널별 순위 카드, 지출 6,455,000원은 Task 6
합계)와 일관되게 맞춘 값 — 8월은 런칭 준비 기간이라 적자인 것을 그대로 보여준다. 실데이터 연동 시
이 계산은 JS로 자동화한다.

- [ ] **Step 2: 확인**

브라우저에서 "영업손익 요약" 카드가 지출 카드와 마일스톤 카드 사이에 보이는지, 마이너스 값이
빨간색(`up-neg`)으로 표시되는지 확인.

- [ ] **Step 3: 커밋**

```bash
git add index.html
git commit -m "Add operating profit/ROI summary card to revenue tab"
```

---

## Task 8: 전체 매출 현황 — 재고 현황 수기 입력 위젯

카페24 API 연동이 안 되어 있으므로, 품목별 재고 수량을 입력하면 `localStorage`에 저장되는 폼을
만든다. 나중에 API 연동 시 이 위젯의 렌더링 부분만 실데이터로 교체할 수 있도록 값을 읽어오는 함수를
분리해 둔다.

**Files:**
- Modify: `index.html` (영업손익 카드 뒤, 마일스톤 카드 앞에 삽입 / `<script>` 블록에 함수 추가)

- [ ] **Step 1: 재고 카드 HTML 삽입**

Find (Task 7 결과물에서):
```html
    </div><div style="background:rgba(255,255,255,.055);-webkit-backdrop-filter:blur(22px);backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,.14);border-radius:20px;overflow:hidden;margin-bottom:20px;display:flex;flex-direction:column;height:100%;">
      <div style="display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.1);flex-wrap:wrap;flex-shrink:0;">
        <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;">🚩</div>
        <div><div style="font-size:16px;font-weight:700;color:#F5F5F5;">다가오는 마일스톤</div>
```

Replace:
```html
    </div><div class="glass" style="border-radius:20px;padding:22px 24px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">
        <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;">📦</div>
        <div><div style="font-size:16px;font-weight:700;color:#F5F5F5;">재고 현황</div><div style="font-size:12px;color:#aaa;margin-top:2px;">수기 입력 (카페24 API 연동 전) · 이 브라우저에만 저장됨</div></div>
      </div>
      <div id="stockWidget" style="margin-top:14px;"></div>
    </div><div style="background:rgba(255,255,255,.055);-webkit-backdrop-filter:blur(22px);backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,.14);border-radius:20px;overflow:hidden;margin-bottom:20px;display:flex;flex-direction:column;height:100%;">
      <div style="display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.1);flex-wrap:wrap;flex-shrink:0;">
        <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;">🚩</div>
        <div><div style="font-size:16px;font-weight:700;color:#F5F5F5;">다가오는 마일스톤</div>
```

- [ ] **Step 2: 재고 위젯 렌더링/저장 JS 추가**

Find:
```html
function toggleAccordion(btn) {
```

Replace:
```html
const STOCK_KEY = 'modibodi_stock_v1';
const STOCK_ITEMS = ['Classic', 'Seamfree', 'Swim', 'Teen'];
const STOCK_LOW_THRESHOLD = 20;

function loadStock() {
  try {
    const raw = localStorage.getItem(STOCK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function saveStockValue(item, qty) {
  const data = loadStock();
  data[item] = Math.max(0, parseInt(qty, 10) || 0);
  localStorage.setItem(STOCK_KEY, JSON.stringify(data));
  renderStockWidget();
}

function renderStockWidget() {
  const el = document.getElementById('stockWidget');
  if (!el) return;
  const data = loadStock();
  el.innerHTML = STOCK_ITEMS.map(item => {
    const qty = data[item] ?? '';
    const low = (data[item] ?? 0) > 0 && data[item] < STOCK_LOW_THRESHOLD;
    return `<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08);">
      <span style="flex:1;font-size:13px;color:#eee;">${item}${low ? ' <span style="color:#F87171;font-size:11px;font-weight:700;">품절임박</span>' : ''}</span>
      <input type="number" min="0" value="${qty}" placeholder="수량 입력" class="num-mono"
        style="width:110px;background:#0a0a0a;border:1px solid #333;border-radius:8px;padding:7px 10px;font-size:12.5px;color:#fff;"
        onchange="saveStockValue('${item}', this.value)">
    </div>`;
  }).join('');
}
function toggleAccordion(btn) {
```

- [ ] **Step 3: 페이지 로드시 위젯 렌더링 호출 추가**

Find:
```html
const tip = document.getElementById('globalTip');
```

Replace:
```html
renderStockWidget();
const tip = document.getElementById('globalTip');
```

- [ ] **Step 4: 확인**

브라우저에서 "재고 현황" 카드에 Classic/Seamfree/Swim/Teen 4개 입력란이 보이는지 확인. 아무 값이나
입력하고 포커스를 빼면(`onchange`), 새로고침 후에도 값이 유지되는지 확인(localStorage 저장 확인).
19 이하 값을 넣으면 "품절임박" 배지가 뜨는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add index.html
git commit -m "Add manual stock-entry widget backed by localStorage"
```

---

## Task 9: 전체 매출 현황 — 로드맵 마일스톤 카드 확장 + panel-roadmap 삭제

기존 "다가오는 마일스톤" 카드(현재 4개 항목만 표시)를 `panel-roadmap`에 있던 전체 6개 마일스톤 +
진행률 게이지로 확장하고, `panel-roadmap` div 전체를 삭제한다.

**Files:**
- Modify: `index.html` (`panel-overview`의 "다가오는 마일스톤" 카드, `panel-roadmap` div 삭제)

- [ ] **Step 1: 마일스톤 카드에 진행률 게이지 + 전체 6개 항목 반영**

Find:
```html
    </div><div style="background:rgba(255,255,255,.055);-webkit-backdrop-filter:blur(22px);backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,.14);border-radius:20px;overflow:hidden;margin-bottom:20px;display:flex;flex-direction:column;height:100%;">
      <div style="display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.1);flex-wrap:wrap;flex-shrink:0;">
        <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;">🚩</div>
        <div><div style="font-size:16px;font-weight:700;color:#F5F5F5;">다가오는 마일스톤</div><div style="font-size:12px;color:#aaa;margin-top:2px;">일정관리 탭과 자동 연동</div></div>
        
      </div>
      <div style="padding:20px 24px;flex:1;display:flex;flex-direction:column;justify-content:center;"><div style="display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:12.5px;flex-wrap:wrap;">
          <span style="width:8px;height:8px;border-radius:50%;background:#eee;flex-shrink:0;"></span>
          <span style="flex:1;min-width:160px;color:#eee;">modibodi.kr SSL/도메인 이슈 해결</span>
          <span style="width:80px;color:#888;font-size:11px;">인프라</span>
          <span style="width:70px;color:#999;font-variant-numeric:tabular-nums;font-size:11px;">2026-09</span>
          <span style="width:50px;text-align:right;color:#eee;font-weight:600;font-size:11px;">진행중</span>
        </div><div style="display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:12.5px;flex-wrap:wrap;">
          <span style="width:8px;height:8px;border-radius:50%;background:#eee;flex-shrink:0;"></span>
          <span style="flex:1;min-width:160px;color:#eee;">본부장님 회의</span>
          <span style="width:80px;color:#888;font-size:11px;">일정</span>
          <span style="width:70px;color:#999;font-variant-numeric:tabular-nums;font-size:11px;">2026-08</span>
          <span style="width:50px;text-align:right;color:#eee;font-weight:600;font-size:11px;">진행중</span>
        </div><div style="display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:12.5px;flex-wrap:wrap;">
          <span style="width:8px;height:8px;border-radius:50%;background:#eee;flex-shrink:0;"></span>
          <span style="flex:1;min-width:160px;color:#eee;">T1런 부스 참가</span>
          <span style="width:80px;color:#888;font-size:11px;">오프라인</span>
          <span style="width:70px;color:#999;font-variant-numeric:tabular-nums;font-size:11px;">2026-09</span>
          <span style="width:50px;text-align:right;color:#eee;font-weight:600;font-size:11px;">진행중</span>
        </div><div style="display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:12.5px;flex-wrap:wrap;">
          <span style="width:8px;height:8px;border-radius:50%;background:#eee;flex-shrink:0;"></span>
          <span style="flex:1;min-width:160px;color:#eee;">카카오톡 1,000명 확보</span>
          <span style="width:80px;color:#888;font-size:11px;">CRM</span>
          <span style="width:70px;color:#999;font-variant-numeric:tabular-nums;font-size:11px;">2026-09</span>
          <span style="width:50px;text-align:right;color:#eee;font-weight:600;font-size:11px;">진행중</span>
        </div></div>
```

Replace:
```html
    </div><div class="glass" style="border-radius:20px;overflow:hidden;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.1);flex-wrap:wrap;">
        <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;">🚩</div>
        <div><div style="font-size:16px;font-weight:700;color:#F5F5F5;">런칭 준비 마일스톤</div><div style="font-size:12px;color:#aaa;margin-top:2px;">일정관리 탭과 자동 연동</div></div>
        <span class="num-mono" style="margin-left:auto;font-size:13px;font-weight:800;color:#F5F5F5;">4 / 6 완료</span>
      </div>
      <div style="padding:20px 24px;">
        <div style="height:8px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;margin-bottom:18px;">
          <div style="width:67%;height:100%;background:#F65934;border-radius:999px;"></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:12.5px;flex-wrap:wrap;">
          <span style="width:8px;height:8px;border-radius:50%;background:#4ADE80;flex-shrink:0;"></span>
          <span style="flex:1;min-width:160px;color:#eee;">GTM Readiness Questionnaire 제출</span>
          <span style="width:80px;color:#888;font-size:11px;">런칭준비</span>
          <span class="num-mono" style="width:70px;color:#999;font-size:11px;">2026-08</span>
          <span style="width:50px;text-align:right;color:#4ADE80;font-weight:600;font-size:11px;">완료</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:12.5px;flex-wrap:wrap;">
          <span style="width:8px;height:8px;border-radius:50%;background:#4ADE80;flex-shrink:0;"></span>
          <span style="flex:1;min-width:160px;color:#eee;">Cafe24 다국어 스토어 정리</span>
          <span style="width:80px;color:#888;font-size:11px;">인프라</span>
          <span class="num-mono" style="width:70px;color:#999;font-size:11px;">2026-09</span>
          <span style="width:50px;text-align:right;color:#4ADE80;font-weight:600;font-size:11px;">완료</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:12.5px;flex-wrap:wrap;">
          <span style="width:8px;height:8px;border-radius:50%;background:#eee;flex-shrink:0;"></span>
          <span style="flex:1;min-width:160px;color:#eee;">modibodi.kr SSL/도메인 이슈 해결</span>
          <span style="width:80px;color:#888;font-size:11px;">인프라</span>
          <span class="num-mono" style="width:70px;color:#999;font-size:11px;">2026-09</span>
          <span style="width:50px;text-align:right;color:#eee;font-weight:600;font-size:11px;">진행중</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:12.5px;flex-wrap:wrap;">
          <span style="width:8px;height:8px;border-radius:50%;background:#eee;flex-shrink:0;"></span>
          <span style="flex:1;min-width:160px;color:#eee;">T1런 부스 참가</span>
          <span style="width:80px;color:#888;font-size:11px;">오프라인</span>
          <span class="num-mono" style="width:70px;color:#999;font-size:11px;">2026-09</span>
          <span style="width:50px;text-align:right;color:#eee;font-weight:600;font-size:11px;">진행중</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:12.5px;flex-wrap:wrap;">
          <span style="width:8px;height:8px;border-radius:50%;background:#eee;flex-shrink:0;"></span>
          <span style="flex:1;min-width:160px;color:#eee;">카카오톡 1,000명 확보</span>
          <span style="width:80px;color:#888;font-size:11px;">CRM</span>
          <span class="num-mono" style="width:70px;color:#999;font-size:11px;">2026-09</span>
          <span style="width:50px;text-align:right;color:#eee;font-weight:600;font-size:11px;">진행중</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;font-size:12.5px;flex-wrap:wrap;">
          <span style="width:8px;height:8px;border-radius:50%;background:#888;flex-shrink:0;"></span>
          <span style="flex:1;min-width:160px;color:#eee;">학교 아웃리치 (소이현)</span>
          <span style="width:80px;color:#888;font-size:11px;">인플루언서</span>
          <span class="num-mono" style="width:70px;color:#999;font-size:11px;">2026-10</span>
          <span style="width:50px;text-align:right;color:#888;font-weight:600;font-size:11px;">예정</span>
        </div>
      </div>
```

(6개 항목 모두 노출 — 스펙 §5-1-6은 "다음 2~3개만 노출 + 더보기"를 제안했지만, 실제 항목이 6개뿐이라
전부 펼쳐도 카드가 과도하게 길어지지 않는다. 항목 수가 늘어나면 이 구조에 `.accordion-body` 패턴을
적용해 "더보기" 토글을 추가하면 된다 — YAGNI로 지금은 생략.)

- [ ] **Step 2: `panel-roadmap` div 전체 삭제**

`panel-roadmap`은 `<div class="tab-panel" id="panel-roadmap" style="display:none;">`로 시작해서
바로 다음 `<div class="tab-panel" id="panel-calendar"`(사실은 그 사이에 스크립트 태그 시작이 있음
— 실제로는 `panel-roadmap`이 파일의 마지막 tab-panel이고 그 다음이 `</div></div><script>`) 앞까지다.
정확한 경계는 아래처럼 확인한다:

```bash
grep -n 'id="panel-roadmap"\|id="panel-calendar"' index.html
```

`panel-roadmap`의 시작 지점부터 `panel-calendar`가 시작되기 직전(`</div></div><div class="tab-panel" id="panel-calendar"` 조각의 앞부분)까지를 통째로 삭제한다. 삭제 후 `panel-calendar`의 여는 태그와
그 이전 구조는 그대로 남아야 한다.

- [ ] **Step 3: 확인**

```bash
grep -c "panel-roadmap" index.html
```
Expected: `0`

브라우저에서 "전체 매출 현황" 탭의 마일스톤 카드에 6개 항목과 진행률 바(67%)가 보이는지, 상단
네비게이션에 로드맵 탭 버튼이 없는지(Task 3에서 이미 제거) 확인. 일정관리 탭이 여전히 정상 동작하는지
반드시 확인.

- [ ] **Step 4: 커밋**

```bash
git add index.html
git commit -m "Expand milestone card to full 6-item list, remove standalone roadmap panel"
```

---

## Task 10: panel-sales 삭제

Task 4~9에서 매출 현황에 필요한 내용을 모두 `panel-overview`로 흡수했으므로, 이제 `panel-sales` div
전체를 삭제한다.

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 경계 확인 후 삭제**

```bash
grep -n 'id="panel-sales"\|id="panel-marketing"' index.html
```

`panel-sales`의 여는 태그부터 `panel-marketing`이 시작되기 직전까지 통째로 삭제한다.

- [ ] **Step 2: 확인**

```bash
grep -c "panel-sales" index.html
```
Expected: `0`

브라우저에서 탭 전환이 모두 정상 동작하는지(특히 "전체 매출 현황" → "마케팅" 전환) 확인.

- [ ] **Step 3: 커밋**

```bash
git add index.html
git commit -m "Remove standalone sales panel (content merged into revenue overview tab)"
```

---

## Task 11: 마케팅 탭 — 소재 분석 서브탭

`panel-marketing` 상단에 "핵심지표 / 소재분석" 토글을 추가하고, 소재분석 뷰(기간 필터 + 목업 소재
랭킹 표)를 새로 만든다. 기존 핵심지표 콘텐츠는 그대로 유지한다.

**Files:**
- Modify: `index.html` (`panel-marketing` 시작 부분, `<script>`에 서브탭 전환 함수 추가)

- [ ] **Step 1: 서브탭 토글 + 소재분석 뷰 HTML 삽입**

Find (마케팅 탭의 필터 바로 다음, 기존 KPI 그리드가 시작되는 지점 — `panel-marketing`에서 유일):
```html
      📅 2026-08-12 ~ 2026-08-25 <span style="color:#777;font-size:10px;">▾</span>
    </div></div>
```

Replace:
```html
      📅 2026-08-12 ~ 2026-08-25 <span style="color:#777;font-size:10px;">▾</span>
    </div></div>
    <div style="display:flex;gap:6px;margin-bottom:16px;">
      <button class="mkt-subtab active" data-sub="core" onclick="switchMarketingSub('core')" style="padding:8px 16px;border-radius:999px;font-size:12.5px;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,.16);background:#fff;color:#111;">핵심지표</button>
      <button class="mkt-subtab" data-sub="creative" onclick="switchMarketingSub('creative')" style="padding:8px 16px;border-radius:999px;font-size:12.5px;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#bbb;">소재분석</button>
    </div>
    <div id="mkt-core">
```

- [ ] **Step 2: 핵심지표 블록 닫고 소재분석 뷰 삽입**

`panel-marketing`의 마지막 콘텐츠 바로 앞(다음 tab-panel인 `panel-crm`이 시작되기 직전)을 찾는다:

```bash
grep -n 'id="panel-marketing"\|id="panel-crm"' index.html
```

`panel-crm`이 시작되는 지점 바로 앞(즉 `panel-marketing`의 마지막 `</div>` 다음)에 아래를 삽입:

```html
    </div>
    <div id="mkt-creative" style="display:none;">
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
        <button class="creative-period active" onclick="setCreativePeriod(this)" style="padding:7px 14px;border-radius:999px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,.16);background:#fff;color:#111;">최근 7일</button>
        <button class="creative-period" onclick="setCreativePeriod(this)" style="padding:7px 14px;border-radius:999px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#bbb;">최근 30일</button>
        <button class="creative-period" onclick="setCreativePeriod(this)" style="padding:7px 14px;border-radius:999px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#bbb;">커스텀</button>
      </div>
      <div class="glass" style="border-radius:20px;overflow:hidden;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.1);">
          <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;">🏅</div>
          <div><div style="font-size:16px;font-weight:700;color:#F5F5F5;">베스트 소재</div><div style="font-size:12px;color:#aaa;margin-top:2px;">목업 데이터 · Meta 크리에이티브 API 연동은 별도 작업</div></div>
        </div>
        <div style="padding:8px 24px 16px;overflow-x:auto;">
          <table class="thin-table">
            <thead><tr><th>소재</th><th>노출</th><th>클릭</th><th>CTR</th><th>CPA</th><th>ROAS</th></tr></thead>
            <tbody>
              <tr><td>🖼️ classic_summer_v3</td><td class="num-mono">42,100</td><td class="num-mono">1,890</td><td class="num-mono">4.5%</td><td class="num-mono">38,200원</td><td class="num-mono up-pos">265%</td></tr>
              <tr><td>🖼️ swim_puma_collab</td><td class="num-mono">31,400</td><td class="num-mono">1,320</td><td class="num-mono">4.2%</td><td class="num-mono">41,500원</td><td class="num-mono up-pos">241%</td></tr>
              <tr><td>🖼️ teen_soihyun_ugc</td><td class="num-mono">28,900</td><td class="num-mono">1,050</td><td class="num-mono">3.6%</td><td class="num-mono">45,900원</td><td class="num-mono up-pos">208%</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="glass" style="border-radius:20px;overflow:hidden;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,.1);">
          <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;">📉</div>
          <div><div style="font-size:16px;font-weight:700;color:#F5F5F5;">워스트 소재</div></div>
        </div>
        <div style="padding:8px 24px 16px;overflow-x:auto;">
          <table class="thin-table">
            <thead><tr><th>소재</th><th>노출</th><th>클릭</th><th>CTR</th><th>CPA</th><th>ROAS</th></tr></thead>
            <tbody>
              <tr><td>🖼️ retarget_static_02</td><td class="num-mono">18,200</td><td class="num-mono">210</td><td class="num-mono">1.2%</td><td class="num-mono">92,000원</td><td class="num-mono up-neg">61%</td></tr>
              <tr><td>🖼️ gwp_promo_banner</td><td class="num-mono">15,600</td><td class="num-mono">180</td><td class="num-mono">1.1%</td><td class="num-mono">88,500원</td><td class="num-mono up-neg">70%</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
```

- [ ] **Step 3: 서브탭 전환 JS 추가**

Find:
```html
function toggleAccordion(btn) {
```

Replace:
```html
function switchMarketingSub(sub) {
  document.getElementById('mkt-core').style.display = sub === 'core' ? 'block' : 'none';
  document.getElementById('mkt-creative').style.display = sub === 'creative' ? 'block' : 'none';
  document.querySelectorAll('.mkt-subtab').forEach(b => {
    const active = b.dataset.sub === sub;
    b.classList.toggle('active', active);
    b.style.background = active ? '#fff' : 'rgba(255,255,255,.06)';
    b.style.color = active ? '#111' : '#bbb';
  });
}
function setCreativePeriod(btn) {
  document.querySelectorAll('.creative-period').forEach(b => {
    b.classList.remove('active');
    b.style.background = 'rgba(255,255,255,.06)';
    b.style.color = '#bbb';
  });
  btn.classList.add('active');
  btn.style.background = '#fff';
  btn.style.color = '#111';
}
function toggleAccordion(btn) {
```

- [ ] **Step 4: 확인**

브라우저에서 마케팅 탭 상단에 "핵심지표/소재분석" 토글이 보이는지, 소재분석 클릭 시 베스트/워스트
소재 표가 보이는지, 기간 버튼(최근 7일/30일/커스텀) 클릭 시 선택 상태가 바뀌는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add index.html
git commit -m "Add creative analysis sub-tab (mock data) to marketing tab"
```

---

## Task 12: CRM/분석 탭 — 숫자 위젯에 모노스페이스 적용

CRM/분석 탭은 콘텐츠 구조를 유지하되, `.kpi-value`와 표의 숫자 셀에 `num-mono` 클래스를 추가해
디자인 톤을 통일한다.

**Files:**
- Modify: `index.html` (`panel-crm`, `panel-analytics` 안의 `.kpi-value` 클래스 사용처)

- [ ] **Step 1: 일괄 확인**

```bash
grep -c 'class="kpi-value"' index.html
```

이 값(현재 CRM+분석+전체매출현황 탭에 있는 kpi-value 총 개수)을 기록해 둔다.

- [ ] **Step 2: `.kpi-value` 클래스에 `num-mono` 추가**

파일 전체에서 아래 치환을 적용한다(재사용되는 카드 마크업 패턴이라 `replace_all`로 처리):

Find (전체 치환):
```
class="kpi-value" style="font-size:24px;font-weight:800;color:#F5F5F5;letter-spacing:-0.01em;font-variant-numeric:tabular-nums;"
```

Replace (전체 치환):
```
class="kpi-value num-mono" style="font-size:24px;font-weight:800;color:#F5F5F5;letter-spacing:-0.01em;"
```

(`font-variant-numeric:tabular-nums`는 `.num-mono` 클래스가 이미 포함하고 있으므로 인라인
중복 선언을 제거한다.)

- [ ] **Step 3: 확인**

```bash
grep -c 'class="kpi-value num-mono"' index.html
```

Step 1에서 기록한 값과 동일해야 한다. 브라우저에서 CRM/분석/전체 매출 현황 탭의 KPI 숫자들이 모두
모노스페이스 폰트로 렌더링되는지(자릿수가 고르게 정렬되는지) 확인.

- [ ] **Step 4: 커밋**

```bash
git add index.html
git commit -m "Apply monospace number styling across all KPI cards"
```

---

## Task 13: 캘린더 탭 회귀 확인

지금까지 태스크에서 캘린더 관련 코드를 건드리지 않았는지 최종 확인한다.

**Files:** 없음 (검증 전용 태스크)

- [ ] **Step 1: 캘린더 코드 무결성 확인**

```bash
grep -c "function renderMonth\|function bindDayCells\|function saveEvent\|function renderWeek" index.html
```
Expected: `4` (스펙 §2-1에 나열된 함수들이 여전히 정확히 존재).

- [ ] **Step 2: 브라우저 수동 체크리스트**

`index.html`을 열고 "일정관리" 탭에서 아래를 확인한다:
1. 월간 뷰에서 날짜 셀 클릭 → 이벤트 추가 모달이 뜨는가
2. 이벤트 저장 후 캘린더에 반영되는가
3. "주간" 토글 클릭 → 주간 뷰로 정상 전환되는가
4. 이전/다음 달 이동 버튼이 정상 동작하는가
5. 주말이 월간 뷰에서 숨겨져 있는가(최근 커밋 `6461b97`에서 적용된 사양 유지 확인)

- [ ] **Step 3: git diff로 캘린더 스크립트 영역 미변경 확인**

```bash
git diff origin/main -- index.html | grep -A2 -B2 "REAL_YEAR\|renderMonth\|bindDayCells"
```
캘린더 관련 라인에 diff(`+`/`-`)가 없어야 한다 — 있다면 실수로 수정된 것이므로 원복해야 한다.

이 태스크는 커밋할 변경사항이 없다(검증 전용). 문제가 발견되면 해당 태스크로 돌아가 수정 후 이
Step을 다시 실행한다.

---

## Task 14: CLAUDE.md 갱신

새 탭 구조, 폰트 체계, 로드맵 흡수 사실을 반영한다.

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 탭 구성 섹션 갱신**

Find:
```
## 탭 구성 (사이드바 순서대로)

1. **종합 현황** — 전체 요약 첫 화면. 4개 탭 핵심 지표 압축 + 로드맵 진행률 게이지
2. **매출** — 카페24/스마트스토어/29CM/무신사/카카오선물/W컨셉 채널별 결제금액,
   수수료율 자동 계산 (카페24 3.5% 등)
3. **마케팅** — Meta/네이버/구글/틱톡/리타겟팅 채널별 광고비, ROAS/CPA 자동계산,
   Meta는 API로 자동 동기화됨
4. **CRM** — 카카오톡 친구수(런칭 전 목표 1,000명), 멤버십 등급(Seed→Root→Bloom→
   Canopy→Keeper) 분포
5. **분석** — 세션수, 전환율, 이탈률, 디바이스/유입채널별 비중
6. **로드맵** — 런칭 준비 마일스톤 체크리스트 (SSL/도메인 이슈, T1런 부스, 카카오 목표 등)
```

Replace:
```
## 탭 구성 (사이드바 순서대로)

1. **전체 매출 현황** — 총괄이 매일 아침 보는 첫 화면. 목표 매출 진행률, 채널별 매출 구성
   (자사몰/외부몰/인플루언서 공구 구분), 지출 내역 아코디언, 영업손익 요약, 재고 현황(수기 입력,
   `localStorage` 키 `modibodi_stock_v1`), 런칭 준비 마일스톤(구 로드맵 탭 콘텐츠 흡수)까지
   한 화면에서 확인
2. **마케팅** — 핵심지표(Meta/네이버/구글/틱톡/리타겟팅 채널별 광고비·ROAS·CPA, Meta는 API로
   자동 동기화됨) + 소재분석 서브탭(베스트/워스트 소재 랭킹, 현재는 목업 데이터 — Meta 크리에이티브
   레벨 API 연동은 별도 작업)
3. **CRM** — 카카오톡 친구수(런칭 전 목표 1,000명), 멤버십 등급(Seed→Root→Bloom→
   Canopy→Keeper) 분포
4. **분석** — 세션수, 전환율, 이탈률, 디바이스/유입채널별 비중
5. **일정관리** — 캘린더. 이 탭의 HTML/CSS/JS는 절대 수정하지 말 것(아래 "작업 시 주의사항" 참고)

(구 "매출"/"로드맵" 탭은 2026-08-26 리뉴얼로 "전체 매출 현황" 탭에 흡수·통합됨 —
docs/superpowers/plans/2026-08-26-dashboard-renewal.md 참고)
```

- [ ] **Step 2: 디자인 톤 섹션에 폰트 갱신**

Find:
```
- 폰트: Space Grotesk(제목), Inter(본문), IBM Plex Mono(숫자)
```

Replace:
```
- 폰트: Noto Sans KR(한글 본문/제목), IBM Plex Mono(`.num-mono` 클래스 — 숫자 전용, 자릿수 정렬용)
```

- [ ] **Step 3: 캘린더 동결 안내를 "작업 시 주의사항"에 추가**

Find:
```
## 작업 시 주의사항

- `index.html` 수정 후에는 반드시 git add / commit / push까지 완료해야 GitHub Pages에 반영됨
```

Replace:
```
## 작업 시 주의사항

- **일정관리(캘린더) 탭 코드는 절대 수정하지 말 것.** 두 번째 `<script>` 블록(`const REAL_YEAR = 2026`
  부터 시작)의 모든 함수와 `.month-grid`/`.week-grid`/`.day-cell`/`.modal` 등 캘린더 전용 CSS
  클래스가 대상. 다른 탭에서 캘린더 데이터를 *읽어오는* 연동은 허용되지만 캘린더 자체 로직은 불가.
- `index.html` 수정 후에는 반드시 git add / commit / push까지 완료해야 GitHub Pages에 반영됨
```

- [ ] **Step 4: 확인**

`CLAUDE.md`를 다시 읽어 새 탭 구성이 실제 `index.html` 상태와 일치하는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add CLAUDE.md
git commit -m "Update CLAUDE.md to reflect renewed tab structure and font system"
```

---

## Task 15: 최종 검증 및 푸시

**Files:** 없음

- [ ] **Step 1: 전체 diff 리뷰**

```bash
git log --oneline origin/main..HEAD
git diff origin/main --stat
```

Task 1~14의 커밋이 모두 리스트에 보이는지 확인.

- [ ] **Step 2: 브라우저 최종 점검**

`index.html`을 새로 열어 아래를 순서대로 확인한다:
1. 상단 탭이 "전체 매출 현황 / 마케팅 / CRM / 분석 / 일정관리" 5개인가
2. "전체 매출 현황" 탭에 목표 진행률 → KPI → 트렌드 차트 → 채널 구성 → 지출 아코디언 →
   영업손익 → 재고 입력 → 마일스톤이 순서대로 보이는가
3. 마케팅 탭의 소재분석 서브탭이 정상 동작하는가
4. CRM/분석 탭 숫자가 모노스페이스로 보이는가
5. 일정관리 탭이 기존과 동일하게 동작하는가(Task 13 체크리스트 재확인)
6. 900px 이하 너비에서 반응형 레이아웃이 깨지지 않는가

- [ ] **Step 3: 푸시**

```bash
git push
```

- [ ] **Step 4: GitHub Pages 반영 확인**

몇 분 기다린 뒤 `https://msroe84-web.github.io/modibodi-dashboard/` (또는 저장소 Pages 설정에
등록된 URL)를 열어 실제 배포본에 변경사항이 반영됐는지 확인.
