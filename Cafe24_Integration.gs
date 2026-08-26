/**
 * 카페24 API 연동 — Apps Script 프로젝트에 "새 파일"로 추가하세요.
 * (기존 Code.gs는 건드리지 않고, 이 파일만 새로 추가하면 됩니다)
 *
 * 사용 전 준비:
 * 1. Apps Script 편집기 좌측 톱니바퀴(프로젝트 설정) > 스크립트 속성에서 아래 3개 추가:
 *    - CAFE24_MALL_ID       : modibodi
 *    - CAFE24_CLIENT_ID     : (카페24 개발자센터에서 발급받은 Client ID)
 *    - CAFE24_CLIENT_SECRET : (카페24 개발자센터에서 발급받은 Client Secret Key)
 * 2. 기존 Code.gs의 doGet(e) 맨 위에 아래 한 줄만 추가:
 *    if (e.parameter.code) { return handleCafe24Callback(e); }
 * 3. 배포 > 새 배포(또는 기존 배포 업데이트)로 반영
 * 4. 그 다음 카페24 인증 URL을 방문해서 최초 1회 인증
 */

function cafe24Props_() {
  const p = PropertiesService.getScriptProperties();
  return {
    mallId: p.getProperty('CAFE24_MALL_ID'),
    clientId: p.getProperty('CAFE24_CLIENT_ID'),
    clientSecret: p.getProperty('CAFE24_CLIENT_SECRET'),
  };
}

/** 카페24가 인증 후 code를 실어 돌아왔을 때 처리 (doGet에서 호출) */
function handleCafe24Callback(e) {
  const code = e.parameter.code;
  const { mallId, clientId, clientSecret } = cafe24Props_();

  const tokenUrl = 'https://' + mallId + '.cafe24.com/api/v2/oauth/token';
  const redirectUri = ScriptApp.getService().getUrl();

  const basicAuth = Utilities.base64Encode(clientId + ':' + clientSecret);

  const res = UrlFetchApp.fetch(tokenUrl, {
    method: 'post',
    headers: {
      Authorization: 'Basic ' + basicAuth,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    payload: {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    },
    muteHttpExceptions: true,
  });

  const body = JSON.parse(res.getContentText());

  if (body.error) {
    return ContentService.createTextOutput('인증 실패: ' + JSON.stringify(body)).setMimeType(ContentService.MimeType.TEXT);
  }

  // refresh_token을 저장해두면, 이후엔 이걸로 access_token을 계속 자동 재발급받을 수 있음
  PropertiesService.getScriptProperties().setProperty('CAFE24_REFRESH_TOKEN', body.refresh_token);
  PropertiesService.getScriptProperties().setProperty('CAFE24_ACCESS_TOKEN', body.access_token);

  return ContentService.createTextOutput('카페24 인증 완료! 이 창은 닫으셔도 됩니다.').setMimeType(ContentService.MimeType.TEXT);
}

/** access_token 자동 갱신 (만료되면 refresh_token으로 재발급) */
function getCafe24AccessToken_() {
  const { mallId, clientId, clientSecret } = cafe24Props_();
  const props = PropertiesService.getScriptProperties();
  const refreshToken = props.getProperty('CAFE24_REFRESH_TOKEN');
  if (!refreshToken) throw new Error('카페24 최초 인증이 아직 안 됐습니다. 인증 URL을 먼저 방문하세요.');

  const tokenUrl = 'https://' + mallId + '.cafe24.com/api/v2/oauth/token';
  const basicAuth = Utilities.base64Encode(clientId + ':' + clientSecret);

  const res = UrlFetchApp.fetch(tokenUrl, {
    method: 'post',
    headers: {
      Authorization: 'Basic ' + basicAuth,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    payload: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    },
    muteHttpExceptions: true,
  });

  const body = JSON.parse(res.getContentText());
  if (body.error) throw new Error('토큰 갱신 실패: ' + JSON.stringify(body));

  props.setProperty('CAFE24_ACCESS_TOKEN', body.access_token);
  props.setProperty('CAFE24_REFRESH_TOKEN', body.refresh_token); // 카페24는 refresh_token도 매번 갱신됨
  return body.access_token;
}

/**
 * 카페24 주문 데이터를 가져와서 "채널_매출" 시트에 기록
 * (시트 이름/컬럼 구조는 기존 시트에 맞춰 조정 필요)
 * 매일 오전 7시 트리거로 syncMetaData처럼 등록하면 자동화됨
 */
function syncCafe24Data() {
  const { mallId } = cafe24Props_();
  const accessToken = getCafe24AccessToken_();

  // 오전 7시 트리거 기준 "어제 하루 전체"가 마감된 데이터를 동기화
  const target = new Date(Date.now() - 86400000);
  const dateStr = Utilities.formatDate(target, 'Asia/Seoul', 'yyyy-MM-dd');

  const url = 'https://' + mallId + '.cafe24api.com/api/v2/admin/orders'
    + '?start_date=' + dateStr
    + '&end_date=' + dateStr
    + '&limit=500';

  const res = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
      'X-Cafe24-Api-Version': '2026-06-01',
    },
    muteHttpExceptions: true,
  });

  const data = JSON.parse(res.getContentText());
  if (data.error) {
    Logger.log('카페24 API 에러: ' + JSON.stringify(data));
    return;
  }

  const orders = data.orders || [];
  let totalAmount = 0;
  orders.forEach(o => { totalAmount += Number(o.payment_amount || 0); });

  writeChannelSales_(dateStr, '카페24', totalAmount);
  Logger.log('카페24 ' + dateStr + ' 주문 ' + orders.length + '건, 합계 ' + totalAmount + '원 → 시트 기록 완료');
}

/**
 * "채널_매출" 시트에서 [일자, 채널]이 일치하는 행을 찾아 C열(매출)에 기록.
 * 해당 날짜+채널 행이 아직 없으면 새 행을 추가함.
 * (이 Apps Script가 스프레드시트에 바인딩되어 있지 않고 독립 프로젝트라면,
 *  아래 getActiveSpreadsheet() 대신 SpreadsheetApp.openById('시트ID')로 바꿔야 함)
 */
function writeChannelSales_(dateStr, channelName, amount) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('채널_매출');
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) { // 0번째 행은 헤더라서 건너뜀
    const rowDateRaw = values[i][0];
    const rowDateStr = (rowDateRaw instanceof Date)
      ? Utilities.formatDate(rowDateRaw, 'Asia/Seoul', 'yyyy-MM-dd')
      : String(rowDateRaw);
    const rowChannel = values[i][1];
    if (rowDateStr === dateStr && rowChannel === channelName) {
      sheet.getRange(i + 1, 3).setValue(amount); // 3 = C열(매출)
      return;
    }
  }
  // 해당 날짜+채널 행을 못 찾으면 새로 추가
  sheet.appendRow([dateStr, channelName, amount]);
}
