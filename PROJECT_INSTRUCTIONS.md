# Project Instructions (Authoritative)

## Objective Right Now
- Keep the repo buildable and ship an MVP that functions end-to-end using production-grade structure.
- No “mock” language. Use: baseline, seed data, placeholder provider, staging implementation, or local-only provider.

## One-Thread Rule
- Work on ONE issue at a time (single objective per message).
- No refactors, “while we’re here” changes, or dependency churn unless required to complete the current objective.
- Every change must directly support the current objective.

## Output Rules
- Prefer the fastest safe path for the issue:
  - If Copilot is faster: provide a Copilot prompt.
  - If terminal is faster: provide exact terminal commands.
  - If both help: provide both.
- Always include the expected output/result so we can confirm success quickly.

## MVP Slice (in order)
1) Build health: TypeScript passes and app boots.
2) Search flow: user can enter a query and receive results via a baseline provider (seed data or staging endpoint).
3) Results list: render results with ResultCard + loading/empty states.
4) Result details: open a details screen from a result tap and render full info.
5) Saved: save/unsave works and Saved tab reflects state reliably.
6) AI summary: aiService uses EXPO_PUBLIC_LLM_ENDPOINT (or a local staging endpoint) with a stable typed contract.

## Baseline Provider Policy (No “Mock”)
- If the production endpoint is not ready, implement a placeholder provider in a production-safe way:
  - `SearchProvider` interface (typed)
  - `SeedSearchProvider` (seed data from local JSON/TS constant)
  - `HttpSearchProvider` (staging endpoint)
- Routing between providers must be config-based (env flag) and must not require code edits per environment.

## Change Rules
- Minimal diffs only.
- No dependency upgrades/downgrades unless required to run.
- Keep Expo Router structure stable.
- Keep NativeWind usage intact.
- Keep Zustand store API stable.

## Definition of Done for Every Step
- `npx tsc --noEmit` passes.
- `npm run start` boots with no red screen related to the current step.
- The current step’s user action works end-to-end.

## Commands We Use
- Type check: `npx tsc --noEmit`
- Start app: `npm run start`
- TODO guard: `npm run check:todos`

## Communication Contract
- Assistant must propose ONE next action set at a time.
- Assistant must ask for the smallest possible output (error snippet or “pass”) to proceed.
