// apps/cms/src/app/cms/blog/posts/PublishButton.client.tsx
"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PublishButton;
var react_dom_1 = require("react-dom");
var _ui_1 = require("@ui");
var blog_server_1 = require("@cms/actions/blog.server");
function PublishButton(_a) {
    var id = _a.id, shopId = _a.shopId;
    var action = blog_server_1.publishPost.bind(null, shopId, id);
    var _b = (0, react_dom_1.useFormState)(action, {
        message: "",
        error: "",
    }), state = _b[0], formAction = _b[1];
    return (<div className="space-y-2">
      <form id="publish-form" action={formAction}>
        <_ui_1.Button type="submit" variant="outline">
          Publish
        </_ui_1.Button>
      </form>
      <_ui_1.Toast open={Boolean(state.message || state.error)} message={state.message || state.error || ""}/>
    </div>);
}
