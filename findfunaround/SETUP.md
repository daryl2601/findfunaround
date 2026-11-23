# findfunaround.me setup (beginner guide, all free)

## 1. Get 3 free API keys
1. **Gemini (writes the articles, required):** go to aistudio.google.com, sign in, click "Get API key".
2. **Pixabay (photos, recommended):** create a free account at pixabay.com, open pixabay.com/api/docs/ while logged in, and your key is shown instantly. If you skip this, the site automatically uses Openverse (free, no key) for photos.
3. **YouTube (videos, optional):** console.cloud.google.com, create a project, enable "YouTube Data API v3", create an API key.

## 2. Put the code on GitHub
1. Create a free account at github.com, click New repository, name it `findfunaround`, keep it Public.
2. Click "uploading an existing file", unzip this project, drag in ALL files and folders
   (including the hidden `.github` folder), then click Commit.
   Tip: if `.github` won't upload by drag and drop, use GitHub Desktop (free).

## 3. Add your keys as secrets
In your repo: Settings > Secrets and variables > Actions > New repository secret.
Add `GEMINI_API_KEY`, `PIXABAY_API_KEY`, and optionally `YOUTUBE_API_KEY`.

## 4. Deploy on Netlify
1. netlify.com, sign up with GitHub, "Add new site" > "Import an existing project" > pick your repo.
2. Settings are read from netlify.toml automatically. Click Deploy.
3. Domain management > Add a domain > `findfunaround.me`, then follow Netlify's DNS steps at your domain registrar.

## 5. Start auto-posting
Repo > Actions tab > "Auto post" > Run workflow. After about a minute new posts are committed,
and Netlify rebuilds the site by itself. From then on it runs every 3 days and adds 6 posts at once. This is deliberate: Netlify Free gives 300 credits a month and each deploy costs 15, so about 20 deploys a month is the limit.

## Tuning
- Add or remove news sources in `sources.json`.
- Change posts per run (`POSTS_PER_RUN`) or schedule (`cron`) in `.github/workflows/auto-post.yml`.
- If Gemini reports a model error, set `GEMINI_MODEL` to a current model name from aistudio.google.com.
