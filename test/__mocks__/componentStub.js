const React = require("react");

function Empty() {
  return null;
}

/* The proxy lets the same file satisfy:
   -   default export     →  import X from '…'
   - *any* named export   →  import { Y } from '…'
*/
module.exports = new Proxy(Empty, {
  get: () => Empty,
});
