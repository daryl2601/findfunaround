// Picks trending stories from RSS feeds, writes original articles with Gemini (free tier),
// adds a Pexels photo + optional YouTube video, and saves each as content/posts/<slug>.json
import fs from "node:fs";
import path from "node:path";

const { GEMINI_API_KEY, PIXABAY_API_KEY, YOUTUBE_API_KEY } = process.env;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const PER_RUN = Number(process.env.POSTS_PER_RUN || 2);
const dir = "content/posts";
const sources = JSON.parse(fs.readFileSync("sources.json", "utf8"));
if (!GEMINI_API_KEY) { console.error("Missing GEMINI_API_KEY"); process.exit(1); }

const UA = { "User-Agent": "Mozilla/5.0 (compatible; findfunaround-bot/1.0)" };
const decode = (s = "") => s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&#8217;|&#39;|&apos;/g, "'").replace(/&#?\w+;/g, " ").replace(/\s+/g, " ").trim();
const tag = (x, t) => (x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, "i")) || [])[1] || "";

async function readFeed(url) {
  try {
    const xml = await (await fetch(url, { headers: UA })).text();
    return [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].slice(0, 12).map(m => ({
      title: decode(tag(m[0], "title")), url: decode(tag(m[0], "link")),
      summary: decode(tag(m[0], "description")).slice(0, 600),
    })).filter(i => i.title && i.url.startsWith("http"));
  } catch (e) { console.log("Feed failed:", url); return []; }
}
async function readPage(url) {
  try {
    const html = await (await fetch(url, { headers: UA, signal: AbortSignal.timeout(15000) })).text();
    const ps = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => decode(m[1])).filter(t => t.length > 60);
    return ps.join("\n").slice(0, 5000);
  } catch { return ""; }
}
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

async function write(story, research) {
  const prompt = `You are a writer for a fun, friendly news blog called "Find Fun Around".
Write an ORIGINAL article of 450-700 words about the story below, in your own words. Never copy sentences.
Use ONLY facts found in the source material. Do not invent quotes, numbers or names. If details are thin, stay general.
Mention the source publication by name inside the article. Use a clear headline, a conversational tone, and 2-3 "## " subheadings.
Return JSON: {"title": string, "excerpt": string (max 30 words), "body": string (paragraphs separated by blank lines, subheadings start with "## "), "image_query": string (2-4 words describing a generic photo that fits), "video_query": string or ""}
SOURCE HEADLINE: ${story.title}
SOURCE SUMMARY: ${story.summary}
SOURCE TEXT: ${research}`;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.7 } }),
  });
  const j = await r.json();
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned nothing: " + JSON.stringify(j).slice(0, 300));
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
async function save(url, slug) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error("download failed " + r.status);
  fs.mkdirSync("content/images", { recursive: true });
  fs.writeFileSync(`content/images/${slug}.jpg`, Buffer.from(await r.arrayBuffer()));
  return `/images/${slug}.jpg`;
}
// 1) Pixabay (free key, safe for commercial use)  2) Openverse (no key, Creative Commons)
async function photo(q, slug) {
  if (!q) return null;
  if (PIXABAY_API_KEY) {
    try {
      const j = await (await fetch(`https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=5`)).json();
      const p = j.hits?.[0];
      if (p) return { url: await save(p.largeImageURL, slug), alt: q, credit: p.user, creditUrl: p.pageURL, source: "Pixabay" };
    } catch (e) { console.log("Pixabay failed:", e.message); }
  }
  try {
    const j = await (await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license_type=commercial&mature=false&page_size=5`, { headers: UA })).json();
    const p = j.results?.find(x => x.thumbnail);
    if (p) return { url: await save(p.thumbnail, slug), alt: p.title || q, credit: `${p.creator || "Unknown"} (CC ${String(p.license).toUpperCase()})`, creditUrl: p.foreign_landing_url, source: "Openverse" };
  } catch (e) { console.log("Openverse failed:", e.message); }
  return null;
}
async function video(q) {
  if (!YOUTUBE_API_KEY || !q) return null;
  try {
    const j = await (await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=1&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY}`)).json();
    const v = j.items?.[0]; return v ? { id: v.id.videoId, title: v.snippet.title } : null;
  } catch { return null; }
}

fs.mkdirSync(dir, { recursive: true });
const seen = new Set(fs.readdirSync(dir).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).sources?.[0]?.url));
const cats = Object.keys(sources).sort(() => Math.random() - 0.5);
let made = 0;
for (const cat of cats) {
  if (made >= PER_RUN) break;
  const items = (await Promise.all(sources[cat].map(readFeed))).flat().filter(i => !seen.has(i.url));
  const story = items[Math.floor(Math.random() * Math.min(items.length, 5))];
  if (!story) continue;
  try {
    const research = await readPage(story.url);
    const a = await write(story, research);
    const slug = slugify(a.title);
    const [image, vid] = await Promise.all([photo(a.image_query, slug), video(a.video_query)]);
    const post = { title: a.title, slug, date: new Date().toISOString(), category: cat, excerpt: a.excerpt, body: a.body, image, video: vid,
      sources: [{ title: story.title, url: story.url }] };
    fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(post, null, 2));
    seen.add(story.url); made++; console.log("Created:", a.title);
  } catch (e) { console.log("Skipped:", e.message); }
}
console.log(`Done. ${made} new post(s).`);
