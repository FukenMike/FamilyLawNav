# Architecture Audit Report

## Build Guards (repo scripts)
- npx tsc --noEmit
- npm run check:routes
- npm run check:packs
- npm run check:env
- npm run check:todos
- npm run audit:arch

## A. App Entry + Navigation

**Route tree under `app/`:**

- (tabs)/
  - _layout.tsx
  - navigator.tsx
  - saved.tsx
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
- imports: @/core/navigator/types, @/services/authorityIdHelpers, @/services/navigatorService, @/services/packStore, expo-router, react, react-native
- hooks: useState, useEffect, useRouter, usePack
- call-like invocations: Date, NavigatorScreen, async, catch, create, encodeAuthorityId, filter, find, flatMap, floor, getItem, if, isArray, isNaN, join, map, now, parse, push, refresh, return, round, runNavigatorWithPack, setAnswers, setDomainId, setGap, setItem, setLoading, setOutput, setQuestions, setRefreshBusy, setState, timeSince, toLocaleDateString, useEffect, usePack, useRouter, useState
- store hooks: 
- navigation uses: router.push

### Screen: app/(tabs)/saved.tsx
- imports: @/services/packStore, @/services/savedStore, expo-router, react, react-native
- hooks: useState, useEffect, useRouter, usePack
- call-like invocations: SavedRoute, create, getSavedIds, if, push, return, setIds, setLoading, setPackState, split, then, useEffect, usePack, useRouter, useState
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
- imports: @/services/aiService, @/services/authorityIdHelpers, @/services/packStore, @/services/savedStore, expo-router, react, react-native
- hooks: useState, useEffect, usePack
- call-like invocations: ResourceRoute, async, catch, create, decodeAuthorityId, entries, for, if, includes, isSaved, map, open, push, return, setAuthority, setDecodedCitation, setError, setLoading, setReferencedBy, setSaved, setSummarizing, setSummary, setSummaryError, summarizeAuthority, then, toggleSaved, useEffect, usePack, useState
- store hooks: 
- navigation uses: 

## B. Data Pipelines (call graphs)

### Pack loading
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:364 -> export async function getPack(
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:507 -> const res = await getPack(state, { forceRemote });
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:530 -> const res = await getPack(state)

### Manifest fetch
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:236 -> async function getManifest(opts?: {
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:300 -> const { manifest } = await getManifest().catch(() => ({ manifest: null }))
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:372 -> let { manifest } = await getManifest().catch(() => ({ manifest: null }))
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:384 -> const manresp = await getManifest({ force: true })
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:525 -> const res = await getManifest()

### Adapt to V1
- /home/michael/Desktop/FamilyLawNav/services/adaptPackToV1.ts:16 -> export function adaptPackToV1(input: any): StatePackV1 {
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:314 -> payload.pack = adaptPackToV1(payload.pack)
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:392 -> pack = adaptPackToV1(pack)
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:436 -> cached.pack = adaptPackToV1(cached.pack)
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:463 -> const adapted = adaptPackToV1(seedPack)

### Validation calls
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:151 -> function validateManifest(x: any): { ok: boolean; error?: string } {
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:168 -> function validateStatePack(p: any): { ok: boolean; error?: string } {
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:264 -> const v = validateManifest(candidate)
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:315 -> const v = validateStatePack(payload.pack)
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:393 -> const v = validateStatePack(pack)
- /home/michael/Desktop/FamilyLawNav/services/packStore.ts:464 -> const v2 = validateStatePack(adapted)
- /home/michael/Desktop/FamilyLawNav/tools/pack-builder/buildPack.js:226 -> function validatePack(p) {
- /home/michael/Desktop/FamilyLawNav/tools/pack-builder/index.js:15 -> const validation = validatePack(pack);

### Seed pack fallback

### Navigator run calls
- /home/michael/Desktop/FamilyLawNav/app/(tabs)/navigator.tsx:86 -> const result = await runNavigatorWithPack({ pack, domainId, answers: intakeAnswers });
- /home/michael/Desktop/FamilyLawNav/services/navigatorService.ts:10 -> export async function runNavigatorWithPack({ pack, domainId, answers }: RunNavigatorWithPackParams): Promise<NavigatorOutput> {

### Search flow references
- /home/michael/Desktop/FamilyLawNav/app/(tabs)/search.tsx:3 -> import { searchResources } from '@/services/searchProvider';

### Resource details usage
- /home/michael/Desktop/FamilyLawNav/app/resource/[id].tsx:5 -> import { decodeAuthorityId } from '@/services/authorityIdHelpers'
- /home/michael/Desktop/FamilyLawNav/app/resource/[id].tsx:32 -> const citation = decodeAuthorityId(id);
- /home/michael/Desktop/FamilyLawNav/services/authorityIdHelpers.ts:5 -> export function decodeAuthorityId(id: string): string {

### Saved flow
- /home/michael/Desktop/FamilyLawNav/app/resource/[id].tsx:85 -> const newState = await toggleSaved(id);
- /home/michael/Desktop/FamilyLawNav/services/savedStore.ts:57 -> export async function save(id: string): Promise<void> {
- /home/michael/Desktop/FamilyLawNav/services/savedStore.ts:65 -> export async function unsave(id: string): Promise<void> {
- /home/michael/Desktop/FamilyLawNav/services/savedStore.ts:77 -> await unsave(id);
- /home/michael/Desktop/FamilyLawNav/services/savedStore.ts:80 -> await save(id);

### AI summary
- /home/michael/Desktop/FamilyLawNav/app/resource/[id].tsx:8 -> import { summarizeAuthority } from '@/services/aiService'
- /home/michael/Desktop/FamilyLawNav/app/resource/[id].tsx:119 -> const res = await summarizeAuthority(text || '');
- /home/michael/Desktop/FamilyLawNav/services/aiService.ts:3 -> export async function summarizeAuthority(authorityText: string): Promise<string> {

### Crawler/ingest (status)
- In-app crawling not implemented.
- Current ingestion path is Pack Builder: `npm run build:packs` → tools/pack-builder → public/packs + manifest.json
- Seed/discovery sources are intended to live in `pack.jurisdiction_sources` (statutes index, judiciary rules/forms, opinions search).
- External crawler can be added later without changing UI/engine contracts.

## Pack Builder Pipeline

- package.json contains script "build:packs"
- /home/michael/Desktop/FamilyLawNav/tools/pack-builder/index.js exists
- /home/michael/Desktop/FamilyLawNav/tools/pack-builder/config.js exists
- public/packs exists
- manifest.json exists
  - schemaVersion: 1
  - pack entries: 2
  - state GA: file exists
    - shape ok? true
    - manifest packVersion: 2026-02-25T01:52:17.975Z
  - state AL: file exists
    - shape ok? true
    - manifest packVersion: 2026-02-25T01:52:17.994Z
- pack file reconciliation: missing none, extra AK,AR,AZ,CA,CO,CT,DC,DE,FL,HI,IA,ID,IL,IN,KS,KY,LA,MA,MD,ME,MI,MN,MO,MS,MT,NC,ND,NE,NH,NJ,NM,NV,NY,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VA,VT,WA,WI,WV,WY
- could not load pack-builder config for source coverage

## Redundancy Counts
- getPack in app/: 0
- getPack in services/: 3
- usePack in app/: 3
- getManifest in app/: 0

## Duplicate Imports

## TODO/FIXME Report
- total TODO: 0
- total FIXME: 0

## Reachability Map
- total files scanned: 85
- total reachable files: 69
- reachable service files (8):
  - services/SeedSearchProvider.ts
  - services/adaptPackToV1.ts
  - services/aiService.ts
  - services/authorityIdHelpers.ts
  - services/navigatorService.ts
  - services/packStore.ts
  - services/savedStore.ts
  - services/searchProvider.ts
- unreachable service files (0):

## Network Endpoints
- fetch call site at /home/michael/Desktop/FamilyLawNav/services/packStore.ts:261: const resp = await fetch(MANIFEST_URL)
- fetch call site at /home/michael/Desktop/FamilyLawNav/services/packStore.ts:387: const resp = await fetch(url)
- fetch call site at /home/michael/Desktop/FamilyLawNav/services/searchProvider.ts:16: const res = await fetch(url.toString());

## Resolved Endpoints (best effort)
- new URL(/search, baseUrl) (/home/michael/Desktop/FamilyLawNav/services/searchProvider.ts:16)
## C. Implemented vs Not Implemented Matrix

| Feature | Implemented? | Evidence | Notes |
|---|---|---|---|
| Pack loading | Implemented | services/packStore.ts:364; services/packStore.ts:507; services/packStore.ts:530 | |
| Manifest fetch | Implemented | services/packStore.ts:236; services/packStore.ts:300; services/packStore.ts:372 | |
| Adapt to V1 | Implemented | services/adaptPackToV1.ts:16; services/packStore.ts:314; services/packStore.ts:392 | |
| Validation | Implemented | services/packStore.ts:151; services/packStore.ts:168; services/packStore.ts:264 | |
| Navigator engine | Implemented | app/(tabs)/navigator.tsx:86 | |
| Search UI | Implemented | app/(tabs)/search.tsx:20; services/searchProvider.ts:6; app/(tabs)/search.tsx:24 | |
| Resource details | Implemented | app/resource/[id].tsx:32; services/authorityIdHelpers.ts:5 | |
| Saved items | Implemented | services/savedStore.ts:65; services/savedStore.ts:77 | |
| AI summaries | Implemented | app/resource/[id].tsx:8; app/resource/[id].tsx:119; services/aiService.ts:3 | |

## D. Redundancy + Conflict Report


## E. Recommended “Single Source of Truth” Flow

1. Use StatePackV1 at runtime exclusively.
2. Adapt and validate inside services/packStore after any fetch or cache read.
3. Cache packs only once (adapted) and share via getPack (exposed via the usePack hook for React UI).
4. UI consumers should use the usePack hook and operate on the pack object, avoiding direct calls to getPack.
5. Manifest fetch should only occur within packStore.
6. Remove legacy imports/dependencies.
