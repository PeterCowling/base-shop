---
Type: Runbook
Status: Reference
Last-updated: 2026-02-05
---
# Remote Access via Free Tunnel

**Purpose:** Access Business OS from external devices (iPad, phone, remote machine) without deploying to production.

**Use case:** Demo app to collaborators, test on real devices, access from multiple locations during development.

**Time to setup:** <5 minutes

---

## Quick Start (One Command)

```bash
# From repo root
./apps/business-os/scripts/tunnel-trycloudflare.sh
```

This script will:
1. Check if cloudflared is installed (install if missing)
2. Start the Business OS dev server (port 3020)
3. Create a tunnel and display the public URL
4. Keep running until you press Ctrl+C

**Output example:**
```
✓ cloudflared is installed
✓ Starting Business OS dev server on port 3020...
✓ Creating tunnel...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Business OS is now accessible at:

  https://random-words-1234.trycloudflare.com

  Share this URL with your team or use on remote devices.
  Press Ctrl+C to stop the tunnel and dev server.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Manual Setup (Step-by-Step)

### 1. Install cloudflared

**macOS (Homebrew):**
```bash
brew install cloudflared
```

**Linux (Debian/Ubuntu):**
```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**Other platforms:**
See https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

**Verify installation:**
```bash
cloudflared --version
# Should output: cloudflared version 2024.x.x (or later)
```

### 2. Start Business OS dev server

```bash
cd /path/to/base-shop
pnpm --filter @apps/business-os dev
```

Wait for "Ready on http://localhost:3020"

### 3. Create tunnel (in new terminal)

```bash
cloudflared tunnel --url http://localhost:3020
```

**Output:**
```
2024-01-30 14:23:15 INF Thank you for trying Cloudflare Tunnel...
2024-01-30 14:23:16 INF Your quick Tunnel has been created!
2024-01-30 14:23:16 INF https://random-words-1234.trycloudflare.com
```

### 4. Access the app

Open the generated URL (e.g., `https://random-words-1234.trycloudflare.com`) in any browser, on any device.

**Note:** The URL is randomly generated each time you run the tunnel. It expires when you stop cloudflared.

---

## Important Notes

### URL Rotation
- **Every tunnel run generates a new URL** (e.g., `https://abc-def-1234.trycloudflare.com`)
- URLs expire immediately when you stop cloudflared (Ctrl+C)
- Cannot request specific URLs with free tier
- If you need persistent URLs, use cloudflared named tunnels (requires Cloudflare account) or ngrok paid tier

### Access Control
- **Anyone with the URL can access the app** (no authentication by default)
- Do NOT share tunnel URLs publicly or commit them to version control
- Consider the tunnel URL as temporary and sensitive
- For production deployment with auth, see Epic B (Cookie-based auth) in the Multi-User MVP plan

### Performance & Limitations
- **Latency:** Expect 50-200ms added latency (Cloudflare edge → your machine)
- **SSE not supported:** Server-sent events will not work over TryCloudflare
- **Bandwidth:** No hard limits, but very large file uploads may timeout
- **Connection stability:** If your local network connection drops, the tunnel dies

### Tunnel Restart on Failure

If cloudflared crashes or the tunnel URL stops working:

1. **Stop both processes:**
   ```bash
   # Press Ctrl+C in both terminals (dev server + tunnel)
   ```

2. **Restart using the script:**
   ```bash
   ./apps/business-os/scripts/tunnel-trycloudflare.sh
   ```

3. **Check for port conflicts:**
   ```bash
   # If port 3020 is in use
   lsof -ti:3020 | xargs kill -9
   ```

---

## Alternative: ngrok (Free Tier)

If TryCloudflare doesn't work for your use case, ngrok is an alternative:

### Setup
```bash
# macOS
brew install ngrok/ngrok/ngrok

# Linux/Other
# Download from https://ngrok.com/download
```

### Usage
```bash
# Start Business OS dev server (terminal 1)
pnpm --filter @apps/business-os dev

# Start ngrok tunnel (terminal 2)
ngrok http 3020
```

**Differences vs TryCloudflare:**
- ✅ Supports SSE (server-sent events)
- ✅ Web UI at http://localhost:4040 for request inspection
- ✅ More stable connection
- ❌ Requires account signup (free tier available)
- ❌ 40 requests/minute rate limit on free tier
- ❌ URLs expire after 2 hours on free tier

---

## Troubleshooting

### "Command not found: cloudflared"
- Installation failed or not in PATH
- Run `which cloudflared` to verify
- Try reinstalling: `brew reinstall cloudflared` (macOS)

### "Failed to connect to localhost:3020"
- Dev server not running
- Check: `curl http://localhost:3020/api/health`
- Restart dev server: `pnpm --filter @apps/business-os dev`

### "Tunnel connection failed"
- Network/firewall blocking cloudflared
- Try ngrok as alternative
- Check firewall settings (corporate networks may block tunnels)

### "Page won't load after opening tunnel URL"
- Wait 5-10 seconds for tunnel to fully establish
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Check dev server logs for errors

### Tunnel URL changes every time
- This is expected behavior with TryCloudflare (free quick tunnels)
- For persistent URLs, upgrade to named tunnels (requires Cloudflare account)
- Or use ngrok paid tier for static domains

---

## Security Considerations

### Development Mode Warning
The Business OS dev server is NOT hardened for public internet exposure:
- No rate limiting
- No DDoS protection
- Debug endpoints enabled (e.g., `/api/health`)
- Hot module replacement (HMR) websocket exposed

**Recommendation:** Only use tunnels for:
- Short-lived demos (<1 hour)
- Trusted collaborators only
- Testing on personal devices
- Not for production traffic or public demos

### Data Safety
- Tunnels expose your local dev database (if using local Postgres/SQLite)
- Do NOT use tunnels if your dev database contains real user data
- Consider using test/seed data only when exposing via tunnel

---

## Next Steps

After verifying tunnel access works:
- **For production deployment:** See `docs/deployment/cloudflare-pages.md` (TBD)
- **For authentication:** Implement Epic B (Cookie-based auth) from Multi-User MVP plan
- **For monitoring:** Use `/api/healthz` endpoint with uptime checker (see MVP-A2)

---

**Related docs:**
- Multi-User MVP Plan: `docs/plans/business-os-multi-user-mvp-plan.md`
- Cloudflare Tunnel docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/
- ngrok docs: https://ngrok.com/docs
