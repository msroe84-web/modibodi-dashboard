# 모디보디 코리아 Business Dashboard

리브위드(모디보디 코리아 총판)의 내부 경영 대시보드. 본부장님/대표님께 보고할 때
사용하는 용도라 완성도 높게 유지할 것. 데이터 자동화 + 시각화 두 가지 목적을 가짐.

## 파일 구조

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
- 폰트: Space Grotesk(제목), Inter(본문), IBM Plex Mono(숫자)
- 대행사가 클라이언트에 배포하는 리포트 같은 "수준급" 톤을 지향함 (임원 보고용)

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

## 코드 스타일 규칙

- 외부 프레임워크/빌드 도구 없이 순수 HTML/CSS/JS 유지 (더블클릭으로 바로 열리는
  단일 파일이어야 함)
- 차트는 전부 직접 그린 SVG (recharts 등 라이브러리 미사용) — sparklineSVG, trendChartSVG,
  gaugeSVG, funnelSVG, comboChartSVG 함수 재사용
- 데이터는 localStorage에도 캐싱하되(오프라인 대비), 원본은 항상 구글시트
- 새 입력 필드 추가 시 `data-action` 속성 기반 이벤트 위임 패턴을 따를 것
  (click은 `document.addEventListener("click", ...)`, change는 `"change"` 핸들러에 분기 추가)

## 작업 시 주의사항

- `index.html` 수정 후에는 반드시 git add / commit / push까지 완료해야 GitHub Pages에 반영됨
  (사용자가 "다 됐어?"라고만 물으면 push까지 확인할 것)
- `APPS_SCRIPT_URL`, `SECRET_TOKEN` 값은 절대 임의로 초기화/삭제하지 말 것 (실제 운영 값임)
- 저장소는 Public이므로, API 키나 토큰 등 민감 정보를 코드에 직접 넣지 말 것
  (Apps Script의 Script Properties에만 저장)
