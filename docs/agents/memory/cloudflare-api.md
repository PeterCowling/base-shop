# Cloudflare API Operations

## Account

- **Account ID**: `9e2c24d2db8e38f743f0ad6f9dfcfd65`
- **Token location**: `CLOUDFLARE_API_TOKEN` in `.env.local` — account-scoped token (not user-scoped)

## Token Verification

Account-scoped tokens FAIL at `/user/tokens/verify`. Use the accounts endpoint instead:
```
curl -s "https://api.cloudflare.com/client/v4/accounts/9e2c24d2db8e38f743f0ad6f9dfcfd65/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```
Confirmed working as of 2026-03-12.

## Wrangler Auth

`CLOUDFLARE_API_TOKEN` alone fails at `/memberships` endpoint for account-scoped tokens.
**Always set both env vars when running wrangler:**
```bash
CLOUDFLARE_API_TOKEN=<from .env.local> CLOUDFLARE_ACCOUNT_ID=9e2c24d2db8e38f743f0ad6f9dfcfd65 wrangler deploy
```

## DNS Record Management

### Zone IDs
- `hostel-positano.com` → `25b082bdadbb0541c0f34c2bf0d21cc4`

### Endpoint
```
POST/PUT/DELETE https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records[/{record_id}]
GET https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?name=guests.hostel-positano.com
```

### Python snippet (once CLOUDFLARE_DNS_TOKEN is set)
```python
import os, urllib.request, json

token = os.environ['CLOUDFLARE_DNS_TOKEN']  # zone:dns:edit scoped token
zone_id = '25b082bdadbb0541c0f34c2bf0d21cc4'

data = json.dumps({
    'type': 'CNAME',
    'name': 'guests',                # subdomain only, not FQDN
    'content': 'prime-egt.pages.dev',
    'ttl': 1,                        # 1 = automatic
    'proxied': True
}).encode()

req = urllib.request.Request(
    f'https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records',
    data=data,
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req) as resp:
    r = json.loads(resp.read())
    print(r['result']['type'], r['result']['name'], '->', r['result']['content'])
```

## Adding Custom Domains to Cloudflare Pages

```python
account_id = '9e2c24d2db8e38f743f0ad6f9dfcfd65'
project = 'prime'

req = urllib.request.Request(
    f'https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project}/domains',
    data=json.dumps({'name': 'guests.hostel-positano.com'}).encode(),
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
    method='POST'
)
```

Note: The Pages API domain registration does NOT auto-create the DNS CNAME — create it separately.
