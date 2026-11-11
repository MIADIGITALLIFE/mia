import fs from "node:fs";
import path from "node:path";

const roots = ["music", "."];
const files = [];
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const name of fs.readdirSync(root)) {
    if (!name.toLowerCase().endsWith(".mp3")) continue;
    if (root === "." && (name.startsWith(".") || name === "node_modules")) continue;
    files.push(root === "." ? name : path.posix.join(root, name));
  }
}
const uniqueFiles = [...new Set(files)].sort((a, b) => a.localeCompare(b));
const tracks = uniqueFiles.map((relative, index) => {
  const file = path.basename(relative);
  const title = path.basename(file, path.extname(file)).replace(/[_-]+/g, " ").trim();
  const encodedPath = relative.split("/").map(encodeURIComponent).join("/");
  return {
    id: file.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `track-${index + 1}`,
    title,
    artist: "MIA",
    album: "MIA · ORIGINAL RECORDINGS",
    file: relative,
    url: `https://raw.githubusercontent.com/MIADIGITALLIFE/mia/main/${encodedPath}`,
    description: "MIA ORIGINAL RECORDING"
  };
});
fs.mkdirSync("music", { recursive: true });
const output = { schemaVersion: 1, updatedAt: new Date().toISOString(), tracks };
fs.writeFileSync("music/catalog.json", JSON.stringify(output, null, 2) + "\n");
console.log(`Catalog generated: ${tracks.length} MP3 track(s)`);
