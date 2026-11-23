// Turns content/posts/*.json into a static site in /dist (no dependencies needed)
import fs from "node:fs";
import path from "node:path";
const SITE = "https://findfunaround.me", NAME = "Find Fun Around";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const posts = fs.existsSync("content/posts") ? fs.readdirSync("content/posts").filter(f => f.endsWith(".json"))
  .map(f => JSON.parse(fs.readFileSync(path.join("content/posts", f), "utf8"))).sort((a, b) => b.date.localeCompare(a.date)) : [];
fs.rmSync("dist", { recursive: true, force: true });
fs.mkdirSync("dist/posts", { recursive: true });
if (fs.existsSync("content/images")) fs.cpSync("content/images", "dist/images", { recursive: true });

const css = `:root{--bg:#f3f6f5;--ink:#10231f;--mute:#52665f;--line:#d6e0dc;--accent:#0b6e63;--pop:#ffd23f;--card:#fff;color-scheme:light}
@media(prefers-color-scheme:dark){:root{--bg:#0e1b18;--ink:#e8f1ee;--mute:#9bb2aa;--line:#254039;--accent:#4fd1bd;--card:#152722;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:18px/1.7 "Source Serif 4",Georgia,serif}
h1,h2,h3,.brand{font-family:"Bricolage Grotesque",system-ui,sans-serif;line-height:1.15;letter-spacing:-.01em}
a{color:var(--accent)}a:focus-visible{outline:3px solid var(--pop);outline-offset:2px}
header,main,footer{max-width:1040px;margin:0 auto;padding:0 20px}
header{display:flex;justify-content:space-between;align-items:center;padding-top:22px;padding-bottom:22px;flex-wrap:wrap;gap:10px}
.brand{font-size:1.6rem;font-weight:800;text-decoration:none;color:var(--ink)}.brand span{background:var(--pop);color:#10231f;padding:0 .3em;border-radius:6px}
nav a{margin-left:16px;color:var(--mute);text-decoration:none;font:600 .95rem system-ui,sans-serif}
.lead{display:grid;grid-template-columns:1.3fr 1fr;gap:28px;align-items:center;margin:10px 0 36px;padding-bottom:36px;border-bottom:2px solid var(--ink)}
.lead h2{font-size:2.5rem;margin:.2em 0}.lead img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:26px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}
.card img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}.card div{padding:14px 18px 20px}
.card h3{font-size:1.25rem;margin:.3em 0}.card a,.lead a{text-decoration:none;color:inherit}.card a:hover h3,.lead a:hover h2{text-decoration:underline}
.meta{font:500 .85rem system-ui,sans-serif;color:var(--mute)}p.ex{color:var(--mute);margin:.3em 0 0;font-size:1rem}
article{max-width:700px;margin:0 auto}article h1{font-size:2.6rem;margin:.3em 0}article h2{font-size:1.6rem;margin-top:1.6em}
article figure{margin:20px 0}article figure img{width:100%;border-radius:10px}figcaption{font:.8rem system-ui,sans-serif;color:var(--mute)}
.video{aspect-ratio:16/9;margin:26px 0}.video iframe{width:100%;height:100%;border:0;border-radius:10px}
.refs{border-top:1px solid var(--line);margin-top:34px;padding-top:12px;font-size:.95rem}
footer{padding-top:40px;padding-bottom:40px;color:var(--mute);font:.9rem system-ui,sans-serif}
@media(max-width:720px){.lead{grid-template-columns:1fr}.lead h2{font-size:1.9rem}article h1{font-size:2rem}}`;
fs.writeFileSync("dist/style.css", css);

const page = (title, desc, body, url, extra = "") => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}"><link rel="canonical" href="${SITE}${url}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">${extra}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Source+Serif+4:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css"></head><body>
<header><a class="brand" href="/">Find<span>Fun</span>Around</a><nav><a href="/">Latest</a><a href="/about.html">About</a></nav></header>
<main>${body}</main>
<footer>© ${new Date().getFullYear()} ${NAME}. Articles are AI-assisted write-ups of reported stories, with sources linked on every post.</footer></body></html>`;

const d = p => new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const img = p => p.image ? `<img src="${esc(p.image.url)}" alt="${esc(p.image.alt)}" loading="lazy">` : "";
const card = p => `<div class="card"><a href="/posts/${p.slug}.html">${img(p)}<div><span class="meta">${esc(p.category)}, ${d(p)}</span><h3>${esc(p.title)}</h3><p class="ex">${esc(p.excerpt)}</p></div></a></div>`;
const render = body => body.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
  .map(b => b.startsWith("## ") ? `<h2>${esc(b.slice(3))}</h2>` : `<p>${esc(b)}</p>`).join("\n");

let home = posts.length ? "" : `<p>No posts yet. The first ones will appear after the next scheduled run.</p>`;
if (posts.length) {
  const [f, ...rest] = posts;
  home = `<div class="lead"><a href="/posts/${f.slug}.html"><span class="meta">${esc(f.category)}, ${d(f)}</span><h2>${esc(f.title)}</h2><p class="ex">${esc(f.excerpt)}</p></a>${img(f)}</div><div class="grid">${rest.map(card).join("")}</div>`;
}
fs.writeFileSync("dist/index.html", page(`${NAME}: trending stories, explained`, "Trending news, culture, tech and fun stories explained simply, with sources.", home, "/"));

for (const p of posts) {
  const refs = p.sources.map(s => `<li><a href="${esc(s.url)}" rel="noopener nofollow" target="_blank">${esc(s.title)}</a></li>`).join("");
  const fig = p.image ? `<figure>${img(p)}<figcaption>Photo by <a href="${esc(p.image.creditUrl)}" target="_blank" rel="noopener">${esc(p.image.credit)}</a> via ${esc(p.image.source || "the web")}</figcaption></figure>` : "";
  const vid = p.video ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${esc(p.video.id)}" title="${esc(p.video.title)}" loading="lazy" allowfullscreen></iframe></div>` : "";
  const ld = `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "NewsArticle", headline: p.title, datePublished: p.date, image: p.image?.url })}</script>`;
  fs.writeFileSync(`dist/posts/${p.slug}.html`, page(`${p.title} | ${NAME}`, p.excerpt,
    `<article><span class="meta">${esc(p.category)}, ${d(p)}</span><h1>${esc(p.title)}</h1>${fig}${render(p.body)}${vid}<div class="refs"><strong>Sources</strong><ul>${refs}</ul></div></article>`,
    `/posts/${p.slug}.html`, ld));
}
fs.writeFileSync("dist/about.html", page(`About | ${NAME}`, "About Find Fun Around",
  `<article><h1>About</h1><p>Find Fun Around collects what people are talking about and explains it in plain language. Posts are written with the help of AI from publicly reported stories, and every post links to the original sources. If you spot a mistake, tell us and we will fix it.</p></article>`, "/about.html"));
fs.writeFileSync("dist/robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync("dist/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}/</loc></url>${posts.map(p => `<url><loc>${SITE}/posts/${p.slug}.html</loc><lastmod>${p.date.slice(0, 10)}</lastmod></url>`).join("")}</urlset>`);
console.log(`Built ${posts.length} post(s) into dist/`);
