"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StepNavigation;
var shadcn_1 = require("@/components/atoms/shadcn");
var NavigationEditor_1 = require("@/components/cms/NavigationEditor");
var ConfiguratorContext_1 = require("../ConfiguratorContext");
var useStepCompletion_1 = require("../hooks/useStepCompletion");
var navigation_1 = require("next/navigation");
function StepNavigation() {
    var _a = (0, ConfiguratorContext_1.useConfigurator)(), state = _a.state, update = _a.update;
    var navItems = state.navItems;
    var setNavItems = function (items) { return update("navItems", items); };
    var _b = (0, useStepCompletion_1.default)("navigation"), markComplete = _b[1];
    var router = (0, navigation_1.useRouter)();
    return (<div className="space-y-4">
      <h2 className="text-xl font-semibold">Navigation</h2>
      <NavigationEditor_1.default items={navItems} onChange={setNavItems}/>
      <div className="flex justify-end gap-2">
        <shadcn_1.Button onClick={function () {
            markComplete(true);
            router.push("/cms/configurator");
        }}>
          Save & return
        </shadcn_1.Button>
      </div>
    </div>);
}
