import type { StatePack } from '@/services/packStore';

import { akPack } from './ak';
import { alPack } from './al';
import { arPack } from './ar';
import { azPack } from './az';
import { caPack } from './ca';
import { coPack } from './co';
import { ctPack } from './ct';
import { dePack } from './de';
import { flPack } from './fl';
import { gaPack } from './ga';
import { hiPack } from './hi';
import { iaPack } from './ia';
import { idPack } from './id';
import { ilPack } from './il';
import { inPack } from './in';
import { ksPack } from './ks';
import { kyPack } from './ky';
import { laPack } from './la';
import { maPack } from './ma';
import { mdPack } from './md';
import { mePack } from './me';
import { miPack } from './mi';
import { mnPack } from './mn';
import { moPack } from './mo';
import { msPack } from './ms';
import { mtPack } from './mt';
import { ncPack } from './nc';
import { ndPack } from './nd';
import { nePack } from './ne';
import { nhPack } from './nh';
import { njPack } from './nj';
import { nmPack } from './nm';
import { nvPack } from './nv';
import { nyPack } from './ny';
import { ohPack } from './oh';
import { okPack } from './ok';
import { orPack } from './or';
import { paPack } from './pa';
import { riPack } from './ri';
import { scPack } from './sc';
import { sdPack } from './sd';
import { tnPack } from './tn';
import { txPack } from './tx';
import { vaPack } from './va';
import { vtPack } from './vt';
import { waPack } from './wa';
import { wiPack } from './wi';
import { wvPack } from './wv';
import { wyPack } from './wy';

export const statePacks: Record<string, StatePack> = {
  AK: akPack,
  AL: alPack,
  AR: arPack,
  AZ: azPack,
  CA: caPack,
  CO: coPack,
  CT: ctPack,
  DE: dePack,
  FL: flPack,
  GA: gaPack,
  HI: hiPack,
  IA: iaPack,
  ID: idPack,
  IL: ilPack,
  IN: inPack,
  KS: ksPack,
  KY: kyPack,
  LA: laPack,
  MA: maPack,
  MD: mdPack,
  ME: mePack,
  MI: miPack,
  MN: mnPack,
  MO: moPack,
  MS: msPack,
  MT: mtPack,
  NC: ncPack,
  ND: ndPack,
  NE: nePack,
  NH: nhPack,
  NJ: njPack,
  NM: nmPack,
  NV: nvPack,
  NY: nyPack,
  OH: ohPack,
  OK: okPack,
  OR: orPack,
  PA: paPack,
  RI: riPack,
  SC: scPack,
  SD: sdPack,
  TN: tnPack,
  TX: txPack,
  VA: vaPack,
  VT: vtPack,
  WA: waPack,
  WI: wiPack,
  WV: wvPack,
  WY: wyPack,
};

export function getStatePack(state: string): StatePack | null {
  if (!state) return null;
  const key = state.trim().toUpperCase();
  return statePacks[key] ?? null;
}

export default statePacks;
