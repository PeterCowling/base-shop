# Returns configuration

To disable UPS labels and tracking:

1. Edit `data/return-logistics.json` and remove `"ups"` from the `returnCarrier` array or change `labelService`.
2. In the shop's `shop.json`, set `returnService.upsEnabled` to `false`.

This prevents the API from creating UPS labels or checking tracking status.
