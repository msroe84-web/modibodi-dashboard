# 모디보디 코리아 Business Dashboard

리브위드(모디보디 코리아 총판)의 내부 경영 대시보드. 본부장님/대표님께 보고할 때
사용하는 용도라 완성도 높게 유지할 것. 데이터 자동화 + 시각화 두 가지 목적을 가짐.

## 파일 구조

- `BRAND.md` — 모디보디 브랜드 정보(브랜드 스토리, 제품 라인, 컬러/폰트 등 공식 아이덴티티) 정리 문서.
  대시보드 디자인 톤이나 마케팅/CRM 콘텐츠 작성 시 참고.
- `index.html` — 대시보드 본체. React나 프레임워크 없이 순수 HTML/CSS/JS로 작성됨.
  전체가 단일 파일이며, GitHub Pages로 그대로 호스팅됨.
- `AppsScript_Code_v2.gs` — 구글 스프레드시트에 배포된 Apps Script 코드 (참고용 사본).
  실제 운영 버전은 Google Apps Script 편집기에 있고, 이 파일은 로컬 백업/참고용.
  - 대시보드 데이터 저장/조회 API (doGet/doPost)
  - 메타 광고 API 자동 연동 (`syncMetaData`, 매일 오전 7시 트리거로 실행)

## 데이터 흐름

1. 대시보드(index.html)는 구글시트에 배포된 Apps Script 웹 앱 URL로 데이터를 읽고 씀
   (`APPS_SCRIPT_URL`, `SECRET_TOKEN` 변수 — index.html 상단에 있음, 이미 설정 완료됨)
2. 실제 데이터는 구글시트의 "DashboardData" 탭 A1 셀에 JSON 하나로 저장됨 (사람이 보는
   표 형태 아님 — 시트를 직접 수정하지 말 것)
3. 메타 광고비는 Apps Script가 매일 자동으로 가져와서 marketing.rows[].spend.meta에 반영

## 디자인 톤

- 배경: 블랙 계열 (`#0C0C0D`)
- 포인트 컬러: 오렌지 `#F65934`
- 보조/그라데이션 컬러: 크림 `#EBDABE` (오렌지→크림 그라데이션을 채널·등급 색상에 사용 중,
  `GRAD6` / `GRAD5` / `GRAD3` 배열 참고)
- 폰트: Noto Sans KR(한글 본문/제목), IBM Plex Mono(`.num-mono` 클래스 — 숫자 전용, 자릿수 정렬용)
- 대행사가 클라이언트에 배포하는 리포트 같은 "수준급" 톤을 지향함 (임원 보고용)

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

## 코드 스타일 규칙

- 외부 프레임워크/빌드 도구 없이 순수 HTML/CSS/JS 유지 (더블클릭으로 바로 열리는
  단일 파일이어야 함)
- 차트는 전부 직접 그린 SVG (recharts 등 라이브러리 미사용) — sparklineSVG, trendChartSVG,
  gaugeSVG, funnelSVG, comboChartSVG 함수 재사용
- 데이터는 localStorage에도 캐싱하되(오프라인 대비), 원본은 항상 구글시트
- 새 입력 필드 추가 시 `data-action` 속성 기반 이벤트 위임 패턴을 따를 것
  (click은 `document.addEventListener("click", ...)`, change는 `"change"` 핸들러에 분기 추가)

## 작업 시 주의사항

- **일정관리(캘린더) 탭 코드는 절대 수정하지 말 것.** 두 번째 `<script>` 블록(`const REAL_YEAR = 2026`
  부터 시작)의 모든 함수와 `.month-grid`/`.week-grid`/`.day-cell`/`.modal` 등 캘린더 전용 CSS
  클래스가 대상. 다른 탭에서 캘린더 데이터를 *읽어오는* 연동은 허용되지만 캘린더 자체 로직은 불가.
- `index.html` 수정 후에는 반드시 git add / commit / push까지 완료해야 GitHub Pages에 반영됨
  (사용자가 "다 됐어?"라고만 물으면 push까지 확인할 것)
- `APPS_SCRIPT_URL`, `SECRET_TOKEN` 값은 절대 임의로 초기화/삭제하지 말 것 (실제 운영 값임)
- 저장소는 Public이므로, API 키나 토큰 등 민감 정보를 코드에 직접 넣지 말 것
  (Apps Script의 Script Properties에만 저장)
