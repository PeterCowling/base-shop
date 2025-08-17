// apps/shop-bcd/src/app/[lang]/product/[slug]/PdpClient.tsx
"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PdpClient;
var ImageGallery_1 = require("@platform-core/components/pdp/ImageGallery");
var SizeSelector_1 = require("@platform-core/components/pdp/SizeSelector");
var AddToCartButton_client_1 = require("@platform-core/components/shop/AddToCartButton.client");
var Price_1 = require("@ui/components/atoms/Price");
var react_1 = require("react");
function PdpClient(_a) {
    var product = _a.product;
    var _b = (0, react_1.useState)(null), size = _b[0], setSize = _b[1];
    var _c = (0, react_1.useState)(1), quantity = _c[0], setQuantity = _c[1];
    return (<div className="mx-auto max-w-6xl p-6 lg:grid lg:grid-cols-2 lg:gap-10">
      <ImageGallery_1.default items={product.media}/>

      <section className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">{product.title}</h1>
        <p className="text-gray-700">{product.description}</p>

        <div>
          <div className="mb-2 font-medium">Select size:</div>
          <SizeSelector_1.default sizes={product.sizes} onSelect={setSize}/>
        </div>

        <div className="text-2xl font-semibold">
          <Price_1.Price amount={product.price}/>
        </div>
        <div>
          <label className="mb-2 block font-medium" htmlFor="qty">
            Quantity:
          </label>
          <input id="qty" type="number" min={1} value={quantity} onChange={function (e) { return setQuantity(Number(e.target.value)); }} className="w-20 rounded border p-2"/>
        </div>

        {/* size could be added to cart line later */}
        <AddToCartButton_client_1.default sku={product} size={size !== null && size !== void 0 ? size : undefined} disabled={!size} quantity={quantity}/>
      </section>
    </div>);
}
