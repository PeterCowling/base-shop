const React = require("react");

function Empty() {
  return null;
}

const Toast = ({ open, message }) => (open ? React.createElement("div", null, message) : null);

/* The proxy lets the same file satisfy:
   -   default export     →  import X from '…'
   - *any* named export   →  import { Y } from '…'
*/
module.exports = new Proxy(Empty, {
  get: (_target, prop) => {
    if (prop === "Toast") {
      return Toast;
    }
    return Empty;
  },
});
