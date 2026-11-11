import fs from "node:fs";
import path from "node:path";

const dir = "music";
fs.mkdirSync(dir, { recursive: true });
const files = fs.readdirSync(dir).filter((name) => name.toLowerCase().endsWith(".mp3")).sort();
const tracks = files.map((file, index) => ({
  id: file.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `track-${index + 1}`,
  title: path.basename(file, path.extname(file)).replace(/[_-]+/g, " ").trim(),
  artist: "MIA",
  album: "MIA · ORIGINAL RECORDINGS",
  file: `music/${file}`,
  url: `https://raw.githubusercontent.com/MIADIGITALLIFE/mia/main/music/${encodeURIComponent(file).replace(/%2F/g, "/")}`,
  addedAt: new Date().toISOString()
}));
const output = { schemaVersion: 1, updatedAt: new Date().toISOString(), tracks };
fs.writeFileSync(path.join(dir, "catalog.json"), JSON.stringify(output, null, 2) + "\n");
console.log(`Catalog generated: ${tracks.length} MP3 track(s)`);
