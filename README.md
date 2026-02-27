# Family Law Navigator

Family Law Navigator is a jurisdiction-aware legal issue navigator focused exclusively on family law, with state-specific packs and a simplified, maintainable architecture.

It helps users understand the controlling law in their case — statutes, court rules, case law, legal standards, required findings, burdens of proof and evidentiary standards — while guiding them toward appropriate support pathways when needed.

The system is designed to reduce procedural blind spots in family court and increase clarity around what the law actually requires.

## Scope: Family Law

Domains include:

- Custody (initial determinations, modification, emergency)
- Child support
- Dependency
- Termination of parental rights
- Domestic violence protective orders
- Jurisdiction and venue
- Service and notice requirements
- Required judicial findings
- Burdens of proof and evidentiary standards

The Navigator focuses specifically on court process, legal standards, and authority structure within family law.

## Core Flow

Users select:

- State
- Family law domain
- Structured intake questions

The system provides:

- Detected legal issues
- Controlling statutes
- Applicable court rules
- Key case anchors
- Legal standards and burdens
- Required judicial findings
- Procedural risk factors
- Clear support pathways when appropriate

**Flow:**

state → domain → intake → issue detection → authority list → authority details → support pathways

## Architecture

### Unified National Schema & Baseline Packs

The application relies on a canonical **StatePackV1** structure that groups issues under domains and embeds authority metadata directly. All 50 states plus DC are scaffolded as baseline packs in `data/statePacks/*.ts`, each with the correct state code and minimal shell content. Curated content (e.g., GA, AL) is maintained in `tools/pack-builder/sources`.

At runtime, the loader directly imports the relevant baseline pack for the selected state, adapts it to the V1 schema using `services/adaptPackToV1.ts`, and surfaces clear errors if the pack is missing or malformed. Consumers only see the canonical V1 shape.

A V1 pack includes at minimum:

- `schemaVersion: "1"`, `packVersion`, `state`
- `jurisdiction_sources` (empty defaults for backwards compatibility)
- `domains`: each with `id`,`label`,`status` and nested `issues`
- `issues`: lists of `authorities`, `legal_tests`, `procedural_traps`, etc.
- `authorities` dictionary keyed by citation with rich metadata

Optional fields such as `needs_verification` are normalized. The loader returns every pack already adapted to this schema.

This architecture enables consistent issue detection, UI rendering, and future migration to new pack formats without touching app code. The baseline packs are easy to update and maintain.

### State Pack System

**Baseline Pack Workflow**

- All 50 states + DC are scaffolded as baseline packs in `data/statePacks/*.ts`, with the correct state code auto-updated.
- Curated content for select states (e.g., GA, AL) is maintained in `tools/pack-builder/sources`.
- The pack builder (`tools/pack-builder/buildPack.js`) uses ts-node to load baseline packs from `data/statePacks/*.ts` and generates normalized JSON packs in `public/packs/`.
- Packs are served statically from `/packs/*` in production; an optional `EXPO_PUBLIC_PACKS_BASE_URL` can point to a remote CDN.

**Pack Loading & Adaptation**


Pack loading is now direct and single-state focused:

1. Direct import of baseline pack from `data/statePacks/*.ts` for the selected state
2. Adaptation to V1 schema via `adaptPackToV1()`
3. Clear error surfaced if pack is missing or malformed

Consumers (navigator, resource screen, etc.) work exclusively against the V1 shape. The loader is simplified, no longer uses cache/manifest logic, and surfaces errors reliably.

The loader returns a `PackStatus` object with these fields:

```ts
interface PackStatus {
  state: string;
  source: "remote" | "cache" | "seed" | "none";
  schemaVersion?: string;
  packVersion?: string;
  lastFetchedAt?: string;
  lastTriedAt?: string;
  error?: string;
  isStale?: boolean;
  cacheKey?: string;
}
```

**Cache Rules**

- Pack TTL: 7 days
- Manifest TTL: 6 hours
- Cached payload includes:
  - `cachedAt`
  - `state`
  - `schemaVersion`
  - `packVersion`
  - `pack` (already adapted)
- A cached pack is stale when older than TTL or if the manifest indicates a
  newer `packVersion`.
- The UI handles missing or malformed packs gracefully and surfaces status
  errors instead of crashing.

**Pack Generator**


The pack-building tooling lives under `tools/pack-builder`. Every execution iterates over a static list of 50 states plus DC defined in `config.js`, loads the corresponding baseline pack from `data/statePacks/<STATE>.ts` (via ts-node), and emits a normalized JSON pack in `public/packs` along with an updated manifest.

Curated content is merged from `tools/pack-builder/sources` where available. Missing baseline packs are tolerated; the builder writes an empty but valid shell pack for the state.

Builds are deterministic except for the `packVersion` timestamp, and the validation step runs automatically during generation.

To build packs:

```bash
npm run build:packs
```

**Pack Validation**

Script: `scripts/check-packs.sh`

Checks:

- `manifest.json` presence and shape
- `schemaVersion === "1"` for each pack
- All required state files exist when `REQUIRE_PACK_FILES=1`
- No invalid JSON or unexpected fields


Run the validator with:

```bash
npm run check:packs
# or with strict file requirement
REQUIRE_PACK_FILES=1 npm run check:packs
```

**Environment Safety**


- Defaults to `/packs/manifest.json` and `/packs/{STATE}.json` when `EXPO_PUBLIC_PACKS_BASE_URL` is unset.
- A guard script prevents accidental localhost references in environment files.

Run:

```bash
npm run check:env
```
(The routing checks remain unchanged.)
### Citation-Centric Authority Model

Authorities remain identified by citation rather than URL, consistent with
the V1 schema.

Each authority entry may include:

- `kind` (statute, rule, case, court_rule, form, guide)
- `title`
- `rank` (binding, persuasive)
- `courtScope`
- `source_url` and `retrieved_at`
- `effective_date`, `notes`, `needs_verification`

The authority dictionary lives at the root of each StatePackV1 object.  Issues
refer to authorities by citation in their `authorities` arrays.

This structure enables reverse lookups and efficient UI rendering without
performing network requests.

## UI Structure


### Pack Access
Components should obtain authority packs via the `usePack` hook exported from `services/packStore`. The hook wraps the direct loader, maintains state/status, and ensures packs are adapted to the canonical `StatePackV1` shape. UI code no longer calls `getPack` directly.


### Navigator Tab

Location:

`app/(tabs)/navigator.tsx`

Provides:

- State selection
- Pack status display
- Refresh pack action
- Structured intake
- Issue detection
- Legal test display
- Procedural risk listing
- Gap warnings
- Authority mapping

Run Navigator is disabled when no usable pack exists.

### Authority Details Screen

Location:

`app/resource/[id].tsx`

Displays:

- Citation metadata
- Authority type
- Reverse linkage to issues
- Safe fallback for unknown authorities

## Routing Conventions (Do Not Break)

- App shell: `app/(tabs)/_layout.tsx`
- Canonical screens live in `app/(tabs)`
- Do not create root-level `app/search.tsx` or `app/navigator.tsx`
- Root `app/_layout.tsx` must render `<Slot />`
- Root `app/index.tsx` redirects to `/search`

To verify routing:

```bash
npm run check:routes
```

## Design Principles

- Family-law-specific
- Jurisdiction-aware
- Transparent about data gaps and verification status
- Citation-first authority identity
- Versioned, adapted state packs
- Deterministic loading with resilient cache
- Production-safe defaults
- Expandable to all 50 states
- Designed for legal aid integration

## Vision

To give families clarity in complex legal processes.

To ensure users understand:

- What must be proven
- What standards apply
- What findings courts must enter
- What procedural risks exist
- What support pathways are available

Before critical decisions are made.

## Core Flow

Users select:

- State
- Family law domain
- Structured intake questions

The system provides:

- Detected legal issues
- Controlling statutes
- Applicable court rules
- Key case anchors
- Legal standards and burdens
- Required findings
- Procedural risk factors
- Clear pathways toward legal aid or assistance resources where relevant

**Flow:**

state → family law domain → intake → issue detection → authority → authority details → support pathways

