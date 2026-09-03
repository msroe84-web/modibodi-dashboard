export function formatKRW(value: number): string {
  return `₩${Math.round(value).toLocaleString('ko-KR')}`;
}

export function formatCompactKRW(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_0000_0000) return `₩${(value / 1_0000_0000).toFixed(1)}억`;
  if (abs >= 1_0000) return `₩${(value / 1_0000).toFixed(0)}만`;
  return formatKRW(value);
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('ko-KR');
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatSignedPercent(value: number, digits = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

/** ROAS expressed as a multiple, e.g. 3.4 -> "340%". */
export function formatRoas(roas: number): string {
  return formatPercent(roas * 100, 0);
}
