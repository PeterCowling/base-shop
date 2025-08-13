# Marketing Automation Hooks

The email scheduler exposes lifecycle hooks that allow custom analytics or side
effects when campaign emails are sent, opened or clicked. Register a listener
with the `onSend`, `onOpen` or `onClick` functions exported from `@acme/email`:

```ts
import { onSend, onOpen, onClick } from "@acme/email";

onSend((shop, event) => {
  console.log("sent", shop, event.campaign);
});

onOpen((shop, event) => {
  console.log("opened", shop, event.campaign);
});

onClick((shop, event) => {
  console.log("clicked", shop, event.campaign, event.url);
});
```

Listeners receive the shop and an event object containing the campaign id and
additional details such as `url`, `recipient` or `messageId` when available.
The package registers default listeners that record analytics via
`trackEvent`; registering a listener lets consumers extend tracking without
replacing the built‑in behavior.
