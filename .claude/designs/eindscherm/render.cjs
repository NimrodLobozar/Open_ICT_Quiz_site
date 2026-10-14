// Zet de design-canvas bestanden in src/ (*.dc.html) om naar gewone HTML-previews in previews/,
// plus een index.html die alle ontwerpen naast elkaar laat zien.
// Draaien vanuit de root van de repo: node .claude/designs/eindscherm/render.cjs
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const srcDir = path.join(dir, 'src');
const outDir = path.join(dir, 'previews');
fs.mkdirSync(outDir, { recursive: true });

class DCLogic {
  constructor(props) { this.props = props; }
}

const get = (scope, expr) => expr.trim().split('.').reduce((v, k) => (v == null ? v : v[k]), scope);
const interpolate = (text, scope) => text.replace(/{{([^}]*)}}/g, (_, e) => {
  const v = get(scope, e);
  return v == null ? '' : String(v);
});

// Zoekt de sluit-tag die bij de open-tag op `start` hoort; geneste tags met dezelfde naam tellen mee.
function findClose(html, tag, start) {
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  re.lastIndex = start;
  let depth = 0;
  for (let m; (m = re.exec(html)); ) {
    depth += m[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return m.index;
  }
  throw new Error(`No closing </${tag}>`);
}

function render(html, scope) {
  const m = /<(sc-for|sc-if)\b([^>]*)>/.exec(html);
  if (!m) return interpolate(html, scope);
  const [open, tag, attrs] = m;
  const close = findClose(html, tag, m.index);
  const inner = html.slice(m.index + open.length, close);
  const attr = (name) => (new RegExp(`${name}="([^"]*)"`).exec(attrs) || [])[1];
  const value = get(scope, attr(tag === 'sc-for' ? 'list' : 'value').replace(/^{{|}}$/g, ''));
  let out = '';
  if (tag === 'sc-for') {
    const as = attr('as');
    for (const item of value || []) out += render(inner, { ...scope, [as]: item });
  } else if (value) {
    out = render(inner, scope);
  }
  return interpolate(html.slice(0, m.index), scope) + out + render(html.slice(close + tag.length + 3), scope);
}

function renderFile(file) {
  const src = fs.readFileSync(path.join(srcDir, file), 'utf8');
  const title = (/<title>([\s\S]*?)<\/title>/.exec(src) || [])[1] || file;
  const body = /<x-dc>([\s\S]*?)<\/x-dc>/.exec(src)[1];
  const helmet = (/<helmet>([\s\S]*?)<\/helmet>/.exec(body) || [])[1] || '';
  const template = body.replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  const script = /<script type="text\/x-dc"[^>]*data-props='([^']*)'[^>]*>([\s\S]*?)<\/script>/.exec(src);
  const props = {};
  for (const [k, v] of Object.entries(JSON.parse(script[1]))) if (!k.startsWith('$')) props[k] = v.default;
  const Component = new Function('DCLogic', `${script[2]}\nreturn Component;`)(DCLogic);
  const vals = new Component(props).renderVals();
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${helmet.trim()}
</head>
<body>
${render(template, vals).trim()}
</body>
</html>
`;
}

const canvas = JSON.parse(fs.readFileSync(path.join(srcDir, 'canvas.json'), 'utf8'));
const rows = Object.values(canvas.notes)
  .sort((a, b) => a.y - b.y)
  .map((note) => ({
    title: note.text,
    boards: canvas.order
      .filter((f) => canvas.boards[f].y === note.y + 260)
      .sort((a, b) => canvas.boards[a].x - canvas.boards[b].x),
  }));

for (const file of canvas.order) {
  fs.writeFileSync(path.join(outDir, file.replace('.dc.html', '.html')), renderFile(file));
}

const card = (file) => {
  const b = canvas.boards[file];
  const href = `previews/${file.replace('.dc.html', '.html')}`;
  const scale = b.w > 1000 ? 0.4 : 0.6;
  return `<figure class="card">
<figcaption><a href="${href}" target="_blank">${b.title.replace(/^\d+ · /, '')}</a></figcaption>
<div class="frame" style="width:${b.w * scale}px;height:${b.h * scale}px">
<iframe src="${href}" title="${b.title}" loading="lazy" style="width:${b.w}px;height:${b.h}px;transform:scale(${scale})"></iframe>
</div>
</figure>`;
};

fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Eindscherm ontwerpen</title>
<style>
:root { color-scheme: light dark; --bg: #f4f4f2; --fg: #1a1a1a; --muted: #666; --line: #d6d6d2; }
@media (prefers-color-scheme: dark) { :root { --bg: #17181b; --fg: #eee; --muted: #999; --line: #33353a; } }
body { margin: 0; padding: 32px 16px 64px; background: var(--bg); color: var(--fg); font: 16px/1.5 system-ui, sans-serif; }
h1 { margin: 0 0 4px; font-size: 28px; }
p { margin: 0 0 32px; color: var(--muted); }
section { border-top: 1px solid var(--line); padding: 24px 0; }
h2 { margin: 0 0 16px; font-size: 20px; }
.row { display: flex; gap: 24px; overflow-x: auto; align-items: flex-start; padding-bottom: 8px; }
.card { margin: 0; flex: none; }
figcaption { margin-bottom: 8px; font-size: 14px; }
a { color: inherit; }
.frame { overflow: hidden; border: 1px solid var(--line); border-radius: 6px; background: #fff; }
iframe { border: 0; transform-origin: 0 0; display: block; }
</style>
</head>
<body>
<h1>Eindscherm ontwerpen</h1>
<p>Per stijl: host op groot scherm, student op desktop en student op telefoon. Klik op een titel om het scherm op ware grootte te openen.</p>
${rows.map((r) => `<section>\n<h2>${r.title}</h2>\n<div class="row">\n${r.boards.map(card).join('\n')}\n</div>\n</section>`).join('\n')}
</body>
</html>
`);

console.log(`Rendered ${canvas.order.length} previews in ${rows.length} rows`);
