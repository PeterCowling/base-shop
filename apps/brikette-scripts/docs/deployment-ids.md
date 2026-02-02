# Google Apps Script Deployment IDs

Reference for all Brikette Google Apps Script deployments.

## Active Deployments

| Script Project | Deployment ID | Purpose |
|----------------|---------------|---------|
| Booking Email | `AKfycbz236VUyVFKEKkJF8QaiL_h9y75XuwWsl82-xfWepZwv1-gBroOr5S4t_og4Fvl4caW` | Booking email scanning and responses |
| Guest Email | `AKfycbzEPvmqFeK1wW8VAid-cs6dhlQ49QDDOQR48whSU_jRQkbTQiNN38yjZSUVu9gYvlIx` | Guest communications |
| Alloggiati | `AKfycbxemYj6vv2k8qDyF3QieAfCujnlUeHMMKriYV8lkhLiHVvb7FnjTpwRTtF-Uo9-VT9UVQ` | Italian guest registration |
| Statistics | `AKfycbwzKYZ0FxoAgSlt98OruRKSaW8OAe4Ug3e1VZ2YGEttgWrRZyAWX8VRHG3Abf_OrXGM` | Analytics and monitoring |

## URL Pattern

Scripts are called via:
```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

## Security Note

These deployment IDs are currently hardcoded in `apps/reception/`. The security audit (2026-01) flagged this as a risk. Consider:

1. Moving IDs to environment variables
2. Adding to `.env.reference.md`
3. Updating `apps/reception/` to read from env

## Deployment ID Rotation

If a deployment ID needs to be rotated:
1. Create a new deployment in script.google.com
2. Update this file with the new ID
3. Update any environment variables
4. Update `apps/reception/` if still hardcoded
5. Test all integrations before removing old deployment
