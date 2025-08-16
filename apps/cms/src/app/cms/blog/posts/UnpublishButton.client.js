// apps/cms/src/app/cms/blog/posts/UnpublishButton.client.tsx
"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UnpublishButton;
var react_dom_1 = require("react-dom");
var _ui_1 = require("@ui");
var blog_server_1 = require("@cms/actions/blog.server");
function UnpublishButton(_a) {
    var id = _a.id, shopId = _a.shopId;
    var action = blog_server_1.unpublishPost.bind(null, shopId, id);
    var _b = (0, react_dom_1.useFormState)(action, {
        message: "",
        error: "",
    }), state = _b[0], formAction = _b[1];
    return (<div className="space-y-2">
      <form action={formAction}>
        <_ui_1.Button type="submit" variant="outline">
          Unpublish
        </_ui_1.Button>
      </form>
      <_ui_1.Toast open={Boolean(state.message || state.error)} message={state.message || state.error || ""}/>
    </div>);
}
