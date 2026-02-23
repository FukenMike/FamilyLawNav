# Architecture Audit Report

## A. App Entry + Navigation

**Route tree under `app/`:**

- (tabs)/
  - _layout.tsx
  - navigator.tsx
  - search.tsx
- _layout.tsx
- index.tsx
- resource/
  - [id].tsx

### Screen: app/(tabs)/_layout.tsx
- imports: @expo/vector-icons, expo-router
- hooks: 
- call-like invocations: TabLayout, return
- store hooks: 
- navigation uses: 

### Screen: app/(tabs)/navigator.tsx
- imports: @/core/navigator/types, @/services/authorityIdHelpers, @/services/navigatorService, @/services/packStore, @/services/packStore, expo-router, react, react-native
- hooks: useState, useEffect, useRouter
- call-like invocations: Date, NavigatorScreen, String, async, catch, create, encodeAuthorityId, filter, find, flatMap, floor, getItem, getManifest, getPack, if, isArray, isNaN, join, map, now, parse, push, return, runNavigator, setAnswers, setDomainId, setGap, setItem, setLoading, setManifest, setOutput, setPack, setPackStatus, setQuestions, setRefreshBusy, setState, timeSince, toLocaleDateString, useEffect, useRouter, useState
- store hooks: 
- navigation uses: router.push

### Screen: app/(tabs)/search.tsx
- imports: @/services/SeedSearchProvider, @/services/searchProvider, react, react-native
- hooks: useState
- call-like invocations: Query, SeedSearchProvider, State, TabSearchRoute, async, catch, create, if, return, search, searchResources, setError, setLoading, setResults, useState
- store hooks: 
- navigation uses: 

### Screen: app/_layout.tsx
- imports: expo-router
- hooks: 
- call-like invocations: RootLayout, groups, the
- store hooks: 
- navigation uses: 

### Screen: app/index.tsx
- imports: expo-router
- hooks: 
- call-like invocations: Index
- store hooks: 
- navigation uses: 

### Screen: app/resource/[id].tsx
- imports: @/services/authorityIdHelpers, @/services/packStore, expo-router, react, react-native
- hooks: useState, useEffect
- call-like invocations: ResourceRoute, catch, create, decodeAuthorityId, entries, for, getPack, if, includes, map, open, push, return, setAuthority, setDecodedCitation, setError, setLoading, setReferencedBy, then, useEffect, useState
- store hooks: 
- navigation uses: 

## B. Data Pipelines (call graphs)

### Pack loading
- /home/michael/Desktop/FamilyLawNav/app/(tabs)/navigator.tsx:66 -> const packRes = await getPack(state);
- /home/michael/Desktop/FamilyLawNav/app/(tabs)/navigator.tsx:197 -> const res = await getPack(state, { forceRemote: true });
- /home/michael/Desktop/FamilyLawNav/app/resource/[id].tsx:26 -> getPack(state).then(res => {
- /home/michael/Desktop/FamilyLawNav/services/navigatorService.ts:12 -> const { pack, status } = await getPack(state);
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:361 -> export async function getPack(
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:502 -> const res = await getPack(state)

### Manifest fetch
- /home/michael/Desktop/FamilyLawNav/app/(tabs)/navigator.tsx:64 -> const mRes = await getManifest();
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:236 -> export async function getManifest(opts?: {
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:300 -> const { manifest } = await getManifest().catch(() => ({ manifest: null }))
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:369 -> let { manifest } = await getManifest().catch(() => ({ manifest: null }))
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:381 -> const manresp = await getManifest({ force: true })
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:497 -> const res = await getManifest()

### Adapt to V1
- /home/michael/Desktop/FamilyLawNav/services/adaptPackToV1.ts:16 -> export function adaptPackToV1(input: any): StatePackV1 {
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:391 -> pack = adaptPackToV1(pack)
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:433 -> cached.pack = adaptPackToV1(cached.pack)
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:464 -> const adapted = adaptPackToV1(seedPack)

### Validation calls
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:151 -> function validateManifest(x: any): { ok: boolean; error?: string } {
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:168 -> function validateStatePack(p: any): { ok: boolean; error?: string } {
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:264 -> const v = validateManifest(candidate)
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:313 -> const v = validateStatePack(payload.pack)
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:388 -> const v = validateStatePack(pack)
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:459 -> const v2 = validateStatePack(seedPack)

### Seed pack fallback
- /home/michael/Desktop/FamilyLawNav/scripts/audit-architecture.mjs:227 -> const seedCalls = search('SeedAuthorityPackProvider');

### Navigator run calls
- /home/michael/Desktop/FamilyLawNav/app/(tabs)/navigator.tsx:105 -> const result = await runNavigator({ state, domainId, answers: intakeAnswers });
- /home/michael/Desktop/FamilyLawNav/services/navigatorService.ts:11 -> export async function runNavigator({ state, domainId, answers }: RunNavigatorParams): Promise<NavigatorOutput> {

### Search flow references
- /home/michael/Desktop/FamilyLawNav/app/(tabs)/search.tsx:3 -> import { searchResources } from '@/services/searchProvider';
- /home/michael/Desktop/FamilyLawNav/scripts/audit-architecture.mjs:235 -> const searchCalls = search('searchProvider');
- /home/michael/Desktop/FamilyLawNav/scripts/audit-architecture.mjs:291 -> {name:'Search UI',pattern:'searchProvider',file:'services/searchProvider.ts'},

### Resource details usage
- /home/michael/Desktop/FamilyLawNav/app/resource/[id].tsx:5 -> import { decodeAuthorityId } from '@/services/authorityIdHelpers'
- /home/michael/Desktop/FamilyLawNav/app/resource/[id].tsx:24 -> const citation = decodeAuthorityId(id);
- /home/michael/Desktop/FamilyLawNav/scripts/audit-architecture.mjs:142 -> const tracked = ['getPack','getManifest','adaptPackToV1','runNavigator','decodeAuthorityId','encodeAuthorityId','validateStatePack','validateStatePackV1','fetch','AsyncStorage','localStorage','aiService','crawlerService'];
- /home/michael/Desktop/FamilyLawNav/scripts/audit-architecture.mjs:239 -> const resCalls = search('decodeAuthorityId');
- /home/michael/Desktop/FamilyLawNav/scripts/audit-architecture.mjs:292 -> {name:'Resource details',pattern:'decodeAuthorityId',file:'app/resource/[id].tsx'},
- /home/michael/Desktop/FamilyLawNav/services/authorityIdHelpers.ts:5 -> export function decodeAuthorityId(id: string): string {

### Saved flow

### AI summary
- /home/michael/Desktop/FamilyLawNav/scripts/audit-architecture.mjs:142 -> const tracked = ['getPack','getManifest','adaptPackToV1','runNavigator','decodeAuthorityId','encodeAuthorityId','validateStatePack','validateStatePackV1','fetch','AsyncStorage','localStorage','aiService','crawlerService'];
- /home/michael/Desktop/FamilyLawNav/scripts/audit-architecture.mjs:247 -> const aiCalls = search(/aiService|openai/);
- /home/michael/Desktop/FamilyLawNav/scripts/audit-architecture.mjs:294 -> {name:'AI summaries',pattern:/aiService|openai/,file:'services/aiService.ts'}

### Crawler/ingest
- /home/michael/Desktop/FamilyLawNav/scripts/audit-architecture.mjs:142 -> const tracked = ['getPack','getManifest','adaptPackToV1','runNavigator','decodeAuthorityId','encodeAuthorityId','validateStatePack','validateStatePackV1','fetch','AsyncStorage','localStorage','aiService','crawlerService'];
- /home/michael/Desktop/FamilyLawNav/scripts/audit-architecture.mjs:250 -> // 7) crawler
- /home/michael/Desktop/FamilyLawNav/scripts/audit-architecture.mjs:251 -> const crawlCalls = search(/crawl|ingest/);
- /home/michael/Desktop/FamilyLawNav/scripts/audit-architecture.mjs:252 -> makeCallGraph('Crawler/ingest', crawlCalls);


## Redundancy Counts
- getPack in app/: 3
- getPack in services/: 3
- getManifest in app/: 1

## Reachability Map
- total reachable files: 13
- reachable service files (7):
  - services/SeedSearchProvider.ts
  - services/adaptPackToV1.ts
  - services/authorityIdHelpers.ts
  - services/navigatorService.ts
  - services/normalizePack.ts
  - services/packStore.ts
  - services/searchProvider.ts
- unreachable service files (0):

## Network Endpoints
## C. Implemented vs Not Implemented Matrix

| Feature | Implemented? | Evidence | Notes |
|---|---|---|---|
| Pack loading | Yes | app/(tabs)/navigator.tsx:66; app/(tabs)/navigator.tsx:197; app/resource/[id].tsx:26 | reachable |
| Manifest fetch | Yes | app/(tabs)/navigator.tsx:64; services/packStore.ts:236; services/packStore.ts:300 | reachable |
| Adapt to V1 | Yes | services/adaptPackToV1.ts:16; services/packStore.ts:391; services/packStore.ts:433 | reachable |
| Validation | Yes | services/packStore.ts:151; services/packStore.ts:168; services/packStore.ts:264 | reachable |
| Navigator engine | Yes | app/(tabs)/navigator.tsx:105; services/navigatorService.ts:11 | reachable |
| Search UI | Yes | app/(tabs)/search.tsx:3 | reachable |
| Resource details | Yes | app/resource/[id].tsx:5; app/resource/[id].tsx:24; services/authorityIdHelpers.ts:5 | reachable |
| Saved items | No |  |  |
| AI summaries | Partial | scripts/audit-architecture.mjs:142; scripts/audit-architecture.mjs:247; scripts/audit-architecture.mjs:294 | referenced only |

## D. Redundancy + Conflict Report

- multiple pack loading points (UI and services both call getPack)
- duplicate schema fields (tests vs testItems, traps vs proceduralTraps)
- validation before adaptation in packStore (validateStatePack)
- provider abstraction now unused

## E. Recommended “Single Source of Truth” Flow

1. Use StatePackV1 at runtime exclusively.
2. Adapt and validate inside services/packStore after any fetch or cache read.
3. Cache packs only once (adapted) and share via getPack.
4. UI consumers (navigator, resource) should receive pack object passed from getPack rather than calling again.
5. Manifest fetch should only occur within packStore.
6. Remove legacy imports/dependencies.
