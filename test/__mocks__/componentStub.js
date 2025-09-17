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
      props.shops.map((shop) => {
        const href = props.card.href(shop);
        const title = resolveValue(props.card.title, shop) || shop;
        const description = resolveValue(props.card.description, shop) || "";
        const ctaLabel = resolveValue(props.card.ctaLabel, shop) || href;

        return React.createElement(
          "li",
          { key: shop },
          React.createElement("h3", null, title),
          description ? React.createElement("p", null, description) : null,
          React.createElement(
            "a",
            { href, "data-cy": "shop-chooser-cta" },
            React.createElement("span", { className: "sr-only" }, shop),
            React.createElement("span", { "aria-hidden": "true" }, ctaLabel)
          )
        );
      })
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
