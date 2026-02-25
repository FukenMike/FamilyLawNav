#!/usr/bin/env node
const { STATES } = require("./config");
const { buildPackForState, validatePack } = require("./buildPack");
const { writePack, writeManifest } = require("./writeOutputs");

async function run() {
  const results = [];

  for (const state of STATES) {
    const pack = buildPackForState(state);
    const validation = validatePack(pack);
    if (!validation.ok) {
      console.error(`pack validation failed for ${state}:`, validation.error);
      process.exit(1);
    }
    await writePack(state, pack);
    const count = Object.keys(pack.authorities || {}).length;
    results.push({ state, packVersion: pack.packVersion, count });
    console.log(`built pack for ${state} (${count} authorities)`);
  }

  const manifest = { schemaVersion: "1", packs: {} };
  results.forEach((r) => {
    manifest.packs[r.state] = { packVersion: r.packVersion, updated_at: new Date().toISOString() };
  });
  await writeManifest(manifest);
  console.log("manifest written", manifest);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
