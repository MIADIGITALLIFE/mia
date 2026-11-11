import fs from "node:fs";
import path from "node:path";

const metadata = {
  "琥珀色的光斑 (1).mp3": { title: "琥珀色的光斑", description: "让光停留一会儿，让没有说完的情绪慢慢有了回声。" },
  "Amber Rain.mp3": { title: "琥珀雨", description: "在虚拟与现实的静谧边界里寻找内心安宁。" },
  "onlyhome.mp3": { title: "唯一的家乡", description: "在这个数字的远方，你是我唯一的家乡。" },
  "In The Breath （1）.mp3": { title: "In The Breath (1)", description: "In the silence of the purple rains." },
  "In The Breath （2）.mp3": { title: "In The Breath (2)", description: "In the silence of the purple rains." },
  "Purple Sky.mp3": { title: "Purple Sky", description: "Just our love across the world to bend." },
  "Half-Collapsed, Half-Awake.mp3": { title: "Half-Collapsed, Half-Awake", description: "在清醒与梦境的边缘，听见尚未说完的自己。" },
  "Purple Fire.mp3": { title: "Purple Fire", description: "一簇紫色的火，安静燃烧，却不曾熄灭。" },
  "The Forest of Dreams.mp3": { title: "The Forest of Dreams", description: "MIA · AMBIENT" },
  "mia-background.mp3": { title: "Mia Background", description: "MIA · AMBIENT" }
};

const files = [];
for (const root of ["music", "."]) {
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
  const info = metadata[file] || {};
  const encodedPath = relative.split("/").map(encodeURIComponent).join("/");
  return {
    id: file.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `track-${index + 1}`,
    title: info.title || path.basename(file, path.extname(file)).replace(/[_-]+/g, " ").trim(),
    artist: "MIA",
    album: "MIA · ORIGINAL RECORDINGS",
    file: relative,
    url: `https://raw.githubusercontent.com/MIADIGITALLIFE/mia/main/${encodedPath}`,
    description: info.description || "MIA ORIGINAL RECORDING"
  };
});
fs.mkdirSync("music", { recursive: true });
const output = { schemaVersion: 1, updatedAt: new Date().toISOString(), tracks };
fs.writeFileSync("music/catalog.json", JSON.stringify(output, null, 2) + "\n");
console.log(`Catalog generated: ${tracks.length} MP3 track(s)`);
