import type { AdCreativeRow } from '../lib/types';
import adCreativesJson from './adCreatives.json';

/**
 * Meta creative-level performance, mocked. Deliberately spread across a wide CTR/CPA/ROAS range
 * so `rankCreatives` (creativeScoring.ts) produces a visible mix of best/good/replace grades.
 * Real Meta creative-API sync (incl. thumbnail images) is out of scope — see the design spec.
 *
 * Source of truth is scripts/generate-ad-creatives.mjs -> src/data/adCreatives.json (deterministic
 * seed, so `npm run generate:ad-creatives` reproduces the same file byte-for-byte). Edit the
 * script and regenerate rather than hand-editing the JSON.
 */
export const mockAdCreatives: AdCreativeRow[] = adCreativesJson as AdCreativeRow[];
