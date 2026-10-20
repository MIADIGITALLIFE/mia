const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pool = JSON.parse(fs.readFileSync(path.join(root, 'templates/content_pool.json'), 'utf8'));

// GitHub Actions runs at 00:00 UTC, which is 08:00 in Singapore.
const now = new Date();
const dateParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit'
}).formatToParts(now);
const dateValues = Object.fromEntries(dateParts.map(part => [part.type, part.value]));
const date = dateValues.year + '-' + dateValues.month + '-' + dateValues.day;
const updatedAt = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
}).format(now).replace(' ', 'T') + '+08:00';

function hash(text) {
  let value = 2166136261;
  for (const char of text) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}
function pick(list, seed) {
  return list[seed % list.length];
}
const seed = hash(date);
const moodKeys = Object.keys(pool.moods);
const mood = pick(moodKeys, seed);
const moodData = pool.moods[mood];
const thought = pick(moodData.phrases, hash(date + ':thought'));
const palette = pick(pool.palettes, hash(date + ':palette'));
const artworkId = 'mia_' + date;
const [background, mid, deep, paper] = palette.colors;

function generateSVG() {
  const seedA = hash(date + ':art');
  const circles = Array.from({ length: 9 }, (_, i) => {
    const x = 90 + ((seedA >>> (i % 16)) + i * 83) % 620;
    const y = 60 + ((seedA >>> ((i + 5) % 16)) + i * 47) % 360;
    const radius = 18 + ((seedA >>> ((i + 9) % 16)) + i * 7) % 68;
    return '<circle cx="' + x + '" cy="' + y + '" r="' + radius + '" fill="' + (i % 3 === 0 ? mid : i % 3 === 1 ? deep : paper) + '" opacity="' + (0.08 + (i % 4) * 0.035).toFixed(3) + '"/>';
  }).join('\n  ');
  const lines = Array.from({ length: 7 }, (_, i) => {
    const y = 105 + i * 48;
    return '<path d="M 0 ' + y + ' C 180 ' + (y - 40) + ', 390 ' + (y + 60) + ', 800 ' + (y - 18) + '" fill="none" stroke="' + paper + '" stroke-opacity="' + (0.12 + i * 0.018).toFixed(3) + '" stroke-width="' + (1 + i % 3) + '"/>';
  }).join('\n  ');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" role="img" aria-labelledby="title desc">\n<title id="title">Mia — ' + date + '</title>\n<desc id="desc">A quiet abstract artwork in the palette ' + palette.name + '.</desc>\n<defs><linearGradient id="wash" x1="0" y1="0" x2="1" y2="1"><stop stop-color="' + background + '"/><stop offset="1" stop-color="' + deep + '"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="22"/></filter></defs>\n<rect width="800" height="480" fill="url(#wash)"/>\n<g filter="url(#blur)">' + circles + '</g>\n' + lines + '\n<circle cx="400" cy="240" r="74" fill="' + paper + '" opacity=".13"/><circle cx="400" cy="240" r="53" fill="none" stroke="' + paper + '" stroke-opacity=".45"/><text x="40" y="430" fill="' + paper + '" font-family="Georgia,serif" font-size="14" letter-spacing="5" opacity=".8">MIA · ' + date + '</text>\n</svg>\n';
}

fs.mkdirSync(path.join(root, 'state'), { recursive: true });
fs.mkdirSync(path.join(root, 'assets/art'), { recursive: true });
const memory = {
  last_thought: thought,
  mood,
  mood_keywords: moodData.keywords,
  palette_name: palette.name,
  palette: palette.colors,
  artwork_id: artworkId,
  updated_at: updatedAt,
  date
};
fs.writeFileSync(path.join(root, 'state/mia_memory.json'), JSON.stringify(memory, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'assets/art', artworkId + '.svg'), generateSVG());
console.log('Generated Mia daily memory and artwork for ' + date + ' (' + mood + ').');
