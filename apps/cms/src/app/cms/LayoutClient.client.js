"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LayoutClient;
var LayoutContext_1 = require("@platform-core/contexts/LayoutContext");
var Sidebar_client_1 = require("@ui/components/cms/Sidebar.client");
var TopBar_client_1 = require("@ui/components/cms/TopBar.client");
function LayoutClient(_a) {
    var role = _a.role, children = _a.children;
    var isMobileNavOpen = (0, LayoutContext_1.useLayout)().isMobileNavOpen;
    return (<div className="flex h-screen w-screen overflow-hidden">
      <div className={"".concat(isMobileNavOpen ? "block" : "hidden", " absolute z-20 h-full sm:static sm:block")}>
        <Sidebar_client_1.default role={role}/>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar_client_1.default />
        <main className="@container flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>);
}
