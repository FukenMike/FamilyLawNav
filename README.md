
# Family Law Navigator

Family Law Navigator is a jurisdiction-aware legal issue navigator focused on family law.

It helps users understand the controlling law in their case — statutes, court rules, case law, legal standards, required findings, burdens of proof, and procedural requirements — while also guiding them toward appropriate support resources when needed.

This project is designed to reduce procedural blind spots in family court and increase clarity around what the law actually requires.

## Scope: Family Law

Current and planned domains include:

- Custody (initial determinations, modification, emergency)
- Child support
- Dependency
- Termination of parental rights
- Domestic violence protective orders
- Jurisdiction and venue
- Service and notice requirements
- Required judicial findings
- Burdens of proof and evidentiary standards

The system focuses specifically on family law processes and court structure.

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

## Architecture

### Unified National Schema

All states share a single structured schema:

- Issues
- Legal tests and elements
- Authority records (citation-centric identity)
- Issue → authority mappings
- Verification metadata
- Gap tracking

Each state provides a data pack conforming to this schema.

### State Packs

Current implementation:

- Georgia (GA) seeded
- Additional states scaffolded for expansion

Each state pack includes:

- schemaVersion
- packVersion
- authorities keyed by citation
- issue mappings
- legal tests
- procedural risks
- verification metadata

Future state packs will be loaded dynamically to keep the app lightweight.

### Citation-Centric Authority Model

Authorities are identified by citation rather than URL.

Each authority may include:

- kind (statute, rule, case)
- title
- rank (binding, persuasive)
- court scope
- source references
- verification status

Citations are canonical identifiers.
Sources provide transparency.

## Current Features

### Navigator Tab

**Location:**

app/(tabs)/navigator.tsx

Provides:

- Family-law-focused intake
- Issue detection
- Issue → authority mapping
- Legal test display
- Procedural risk listing

### Authority Details Screen

**Location:**

app/resource/[id].tsx

Displays:

- Citation metadata
- Authority type
- Reverse linkage to related family law issues
- Safe handling for unknown authorities

### Authority ID Encoding

**Location:**

services/authorityIdHelpers.ts

Encodes and decodes citations for safe navigation.

### State Pack Data

**Location:**

#### PackStatus & refresh behavior

- The pack loader returns a `PackStatus` alongside the `StatePack` (via `getPack(state)`):
  - `{ state, source, schemaVersion?, packVersion?, lastFetchedAt?, lastTriedAt?, error?, isStale?, cacheKey? }`.
- `source` values: `remote | cache | seed | none` — indicates where the pack came from.
- Cache rules: `PACK_CACHE_TTL_MS = 7 days`. Cache payloads include `{ cachedAt, state, schemaVersion, packVersion, pack }`.
  - A cached pack is considered *stale* when older than TTL or when the manifest indicates a newer `packVersion`.
- Navigator behavior:
  - Shows a compact status line (source, version, staleness, age) under the State selector.
  - **Refresh Pack** forces a remote fetch (`getPack(state, { forceRemote: true })`); on success the cache and UI are updated, on failure the previous pack (if any) is preserved and `status.error` is shown.
  - `Run Navigator` is disabled when `status.source === 'none'` (no usable pack).
- Available pack APIs (for UI/maintenance): `getPack`, `getCachedPack`, `clearCachedPack` — all surface `PackStatus` so the UI can make correct decisions and show health.


Defines:

- Family law domains
- Issues
- Authorities
- Legal tests
- Procedural risks
- Issue mappings

## Design Principles

- Family-law-specific
- Jurisdiction-aware
- Transparent about gaps
- Citation-first identity
- Expandable to all 50 states
- Versioned authority data
- Designed to integrate legal aid pathways

## Vision

To give families clarity in complex legal processes.

To ensure users understand:

- What must be proven
- What standards apply
- What findings courts must enter
- What procedural risks exist
- What support pathways are available

Before critical decisions are made.

## Routing conventions (do not break)

- The app shell is the Tabs layout in `app/(tabs)/_layout.tsx`.
- Canonical screens live only in `app/(tabs)`:
  - `app/(tabs)/search.tsx`
  - `app/(tabs)/navigator.tsx`
- Do not create root-level `app/search.tsx` or `app/navigator.tsx` (they shadow tabs and remove the tab bar).
- Root `app/_layout.tsx` must render `<Slot />`.
- Root `app/index.tsx` should only redirect to `/search`.

To verify routing integrity:
- `npm run check:routes`
