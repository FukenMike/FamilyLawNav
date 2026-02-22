# Family Law Navigator

Family Law Navigator is a jurisdiction-aware legal issue navigator focused exclusively on family law.

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

### Unified National Schema

The application relies on a canonical **StatePackV1** structure that groups
issues under domains and embeds authority metadata directly.  To support
existing "legacy" baseline packs and curated seed files, an adapter service
(`services/adaptPackToV1.ts`) transforms any incoming object or array into the
v1 schema at runtime.  Consumers never see the legacy shape.

A V1 pack includes at minimum:

- `schemaVersion: "1"`, `packVersion`, `state`
- `jurisdiction_sources` (empty defaults for backwards compatibility)
- `domains`: each with `id`,`label`,`status` and nested `issues`
- `issues`: lists of `authorities`, `legal_tests`, `procedural_traps`, etc.
- `authorities` dictionary keyed by citation with rich metadata

Optional fields such as `needs_verification` are normalized.  The loader
returns every pack already adapted to this schema.

This architecture enables consistent issue detection, UI rendering, and
future migration to new pack formats without touching app code.

### State Pack System

**Baseline Production Setup**

- All 50 states + DC are scaffolded; GA is also provided as a curated pack with
  expanded content.
- Baseline packs live under `public/packs/` alongside any curated packs.  The
generator script now skips files marked with `quality: "curated"`.
- A `manifest.json` records `packVersion` per state and is validated by the
  pack checker.
- Packs are served statically from `/packs/*` in production; an optional
  `EXPO_PUBLIC_PACKS_BASE_URL` can point to a remote CDN.

**Pack Loading & Adaptation**

Pack loading follows a deterministic, resilient order:

1. Fresh cache
2. Remote fetch (if base URL configured)
3. Stale cache fallback
4. Seed fallback (if available)
5. none (no usable pack)

After acquiring a pack from any source, the loader invokes
`adaptPackToV1()` to guarantee the canonical V1 schema.  Consumers (navigator,
resource screen, etc.) work exclusively against the V1 shape and no longer use
the former provider abstraction (`config/runtime` and provider classes are now
unused at runtime).

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

Location:

`scripts/generate-baseline-packs.js`

Features:

- Uses local New York date for `packVersion` (YYYY.MM.DD)
- Prevents future-dated versions
- Skips curated packs (`quality !== "baseline"`)
- Prints summary (created / updated / skipped)
- Automatically runs strict pack validation
- Deterministic reruns

To generate packs:

```bash
npm run gen:packs
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

