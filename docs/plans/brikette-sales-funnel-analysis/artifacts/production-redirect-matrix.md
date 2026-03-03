# Production Redirect / Canonical Convergence Matrix

- Task: `TASK-08`
- Verification date: `2026-03-01`
- Method: `curl -L` checks against production host

## Live Check Command

```bash
for u in \
  "https://www.hostel-positano.com/book" \
  "https://www.hostel-positano.com/en/book" \
  "https://www.hostel-positano.com/it/prenota" \
  "https://www.hostel-positano.com/en/dorms" \
  "https://www.hostel-positano.com/it/camere-condivise"; do
  echo "URL $u"
  curl -s -o /dev/null -w 'code=%{http_code} redirects=%{num_redirects} final=%{url_effective}\n' -L "$u"
done
```

## Results

| Source URL | Redirect count | Final URL | Final HTTP status | Converged? | Notes |
|---|---:|---|---:|---|---|
| `https://www.hostel-positano.com/book` | 1 | `https://hostel-positano.com/book` | 404 | No | Alias reaches canonical host but canonical path is broken. |
| `https://www.hostel-positano.com/en/book` | 1 | `https://hostel-positano.com/en/book` | 200 | Partial | Host canonicalization works; path healthy. |
| `https://www.hostel-positano.com/it/prenota` | 1 | `https://hostel-positano.com/it/prenota` | 404 | No | Canonical target for localized booking path currently broken. |
| `https://www.hostel-positano.com/en/dorms` | 1 | `https://hostel-positano.com/en/dorms` | 404 | No | Dorm canonical target not healthy in production. |
| `https://www.hostel-positano.com/it/camere-condivise` | 1 | `https://hostel-positano.com/it/camere-condivise` | 404 | No | Localized dorm path not healthy in production. |

## Decision / Follow-up

- Host-level one-hop canonicalization (`www` -> apex) is present.
- Route-level canonical convergence is incomplete because multiple canonical targets still return `404`.
- Do not declare TASK-08 fully converged on production redirects until Cloudflare route rules are updated so each canonical booking-surface target returns `200`.
