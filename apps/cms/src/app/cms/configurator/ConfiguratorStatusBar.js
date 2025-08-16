// apps/cms/src/app/cms/configurator/ConfiguratorStatusBar.tsx
"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ConfiguratorStatusBar;
var ConfiguratorContext_1 = require("./ConfiguratorContext");
function ConfiguratorStatusBar() {
    var saving = (0, ConfiguratorContext_1.useConfigurator)().saving;
    if (!saving)
        return null;
    return (<div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-muted py-2 text-sm">
      Saving…
    </div>);
}
