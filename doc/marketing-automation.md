# Marketing Automation Hooks

The email package exposes hooks for analytics around scheduled campaigns.
Consumers can register listeners to capture send, open, and click events.

## Registering Listeners

```ts
import { onSend, onOpen, onClick } from "@acme/email";

onSend(({ shop, campaign, to }) => {
  console.log("sent", shop, campaign, to);
});

onOpen(({ shop, campaign }) => {
  console.log("opened", shop, campaign);
});

onClick(({ shop, campaign, url }) => {
  console.log("clicked", shop, campaign, url);
});
```

Listeners run in addition to the built-in analytics tracking. Multiple listeners
can be registered and will be invoked for every event.
