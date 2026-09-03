/** Korean color-name -> hex, for small swatch dots next to a variant name. Add here (not per
 *  component) whenever a new variant color shows up in mock or real inventory data. */
export const COLOR_HEX: Record<string, string> = {
  블랙: '#1a1a1a',
  화이트: '#f5f5f0',
  아이보리: '#ede4d3',
  그레이: '#9ca3af',
  차콜: '#3f3f46',
  누드: '#d9b99b',
  베이지: '#e0d0b4',
  네이비: '#1e3a5f',
  카키: '#7c8455',
  핑크: '#f4b8c4',
  라벤더: '#c7b8e8',
};

const FALLBACK_HEX = '#8a8a8a';

export function getColorHex(colorName: string): string {
  return COLOR_HEX[colorName] ?? FALLBACK_HEX;
}
