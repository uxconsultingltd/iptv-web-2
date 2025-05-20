# IPTV Web Player with Proxy API (Xtream Codes)

## 🔧 How to deploy:

1. Create a public GitHub repository.
2. Upload all files from this ZIP into the repository.
3. Go to [https://vercel.com](https://vercel.com), log in with GitHub, and import the repo.
4. Vercel will auto-deploy with support for:
   - `/api/player_api.js` – CORS-safe proxy to Xtream Codes API
   - React frontend (`src/`) that calls the backend

You can now fetch data like:
`/api/player_api?username=...&password=...&action=player_api`
