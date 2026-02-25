const { PACK_OUTPUT_DIR } = require("./config");
const fs = require("fs").promises;
const path = require("path");

async function writePack(state, pack) {
  const dir = path.join(process.cwd(), PACK_OUTPUT_DIR);
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${state}.json`);
  await fs.writeFile(file, JSON.stringify(pack, null, 2));
}

async function writeManifest(manifest) {
  const dir = path.join(process.cwd(), PACK_OUTPUT_DIR);
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, "manifest.json");
  await fs.writeFile(file, JSON.stringify(manifest, null, 2));
}

module.exports = { writePack, writeManifest };
