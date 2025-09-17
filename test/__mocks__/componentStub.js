const React = require("react");

function resolveValue(value, shop) {
  if (typeof value === "function") {
    return value(shop);
  }
  return value;
}

function ComponentStub(props) {
  if (
    props &&
    Array.isArray(props.shops) &&
    props.card &&
    typeof props.card.href === "function"
  ) {
    if (props.shops.length === 0) {
      const emptyTitle =
        (props.emptyState && props.emptyState.title) || "No shops found.";
      return React.createElement("div", null, emptyTitle);
    }

    return React.createElement(
      "ul",
      null,
      props.shops.map((shop) =>
        React.createElement(
          "li",
          { key: shop },
          React.createElement(
            "a",
            { href: props.card.href(shop) },
            resolveValue(props.card.ctaLabel, shop) || props.card.href(shop)
          )
        )
      )
    );
  }

  return null;
}

/* The proxy lets the same file satisfy:
   -   default export     →  import X from '…'
   - *any* named export   →  import { Y } from '…'
*/
module.exports = new Proxy(ComponentStub, {
  get: () => ComponentStub,
});
