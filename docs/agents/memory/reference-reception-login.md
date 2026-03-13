# Reception App Login Procedure

## App details
- **URL**: http://localhost:3023 (redirects to `/bar` after login)
- **Dev port**: 3023

## Credentials
- **Email**: peter.cowling1976@gmail.com
- **Password**: 0bOW27Y,xcED

## The core problem: React controlled inputs

The login form uses React controlled `<input>` elements. Playwright's `fill` action sets the DOM value but does **not** trigger React's `onChange` handler — so React state stays as empty strings and Firebase receives empty credentials (no error is shown, the form just silently does nothing).

## Working login sequence (copy-paste this evaluate call)

After opening a session and observing the login page, use a **single `evaluate` action** that:
1. Calls React's `onChange` handler via the fiber for both inputs
2. Waits 200ms for React to batch the state updates
3. Dispatches a native form `submit` event

```js
// Paste into browser_act evaluate action:
const emailEl = document.getElementById('email');
const pwEl = document.getElementById('password');
const ef = emailEl[Object.keys(emailEl).find(k => k.startsWith('__reactFiber'))];
const pf = pwEl[Object.keys(pwEl).find(k => k.startsWith('__reactFiber'))];
ef?.pendingProps?.onChange?.({ target: { value: 'peter.cowling1976@gmail.com' } });
pf?.pendingProps?.onChange?.({ target: { value: '0bOW27Y,xcED' } });
setTimeout(() => document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })), 200);
'triggered'
```

After the evaluate, call `browser_observe` — if login succeeded the affordances will show bar product buttons (e.g. "PC Reg Syrup €12.50") instead of the email/password form.

## PIN setup screen

On first login (or if PIN was cleared), login success shows a **PIN setup** screen instead of the bar. You'll see a "Skip for now" button — click it to proceed to the app.

## Inactivity logout timer

- **Non-admin users**: auto-logout after **60 seconds** of no `mousemove`, `mousedown`, `keydown`, `touchstart`, or `scroll` events
- **Admin role**: timer is completely bypassed (never logs out)
- **`evaluate` calls count as inactivity** — they don't fire any of the tracked events

### Keeping the session alive during automation

Dispatch a `mousemove` event every ~30s inside any long `evaluate` call, or between browser actions:

```js
window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 100, clientY: 100 }));
```

### What logout looks like

The affordances list drops back to the login form: `textbox "Email"`, `button "Sign in"`. No warning is shown — simply re-run the login evaluate block above.

## Summary flow

```
browser_session_open(url=http://localhost:3023)
→ browser_observe (confirm login form is visible)
→ browser_act evaluate (fiber onChange + setTimeout submit)
→ browser_observe (confirm bar product buttons visible OR pin setup visible)
→ [if pin setup] browser_act click "Skip for now"
→ app is ready
```
