# Cache App (Chrome extension)

Manifest V3 extension that reads **Instagram Saved** on `https://www.instagram.com` and **TikTok Favorites (videos)** on `https://www.tiktok.com` while you are logged in. Metadata is stored in **`chrome.storage.local`**. It does not run on other sites.

## Load unpacked

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. **Load unpacked** → choose this folder (`extensions/cache-app`).

## Use with the Cache web app

1. **Sign in** to your Cache deployment in Chrome (same profile as the extension).
2. Open **Library** (`/{locale}/library` while signed in).
3. Click **Generate token** (or copy the existing token) and set **Sync endpoint URL** to your ingest URL, e.g. `https://your-app.com/api/integrations/instagram/saved`.
4. Paste the token into extension **Options** as **Extension ingest token (Bearer)** and save (grant host permission if prompted).
5. **Sync** stays disabled until a Better Auth **session cookie** exists for that URL’s origin. After signing in, reopen the popup (or focus it) so it can detect the cookie.
6. On Instagram Saved or TikTok Favorites, click **Sync**. Local storage updates immediately; if Options are configured, each completed platform sync **POST**s to your app with `Authorization: Bearer <token>` and JSON `source` (`instagram` | `tiktok`) plus `items`.

**Open Cache** in the popup opens your app’s home at `/{defaultLocale}` derived from the sync URL origin (`en-US` if you use the default path).

## Optional server sync

The service worker skips server POSTs when no Cache session cookie is present for the sync endpoint origin (same rule as the popup).

## Privacy and limitations

- **Personal / best-effort:** Instagram and TikTok UIs change often; selectors may need updates.
- **Local by default:** Data stays in the browser; the server only receives what you configure.
- Respect each platform’s terms; use at your own risk.
