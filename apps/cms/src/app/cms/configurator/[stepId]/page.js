"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ConfiguratorStepPage;
var ConfiguratorContext_1 = require("../ConfiguratorContext");
var step_page_1 = require("./step-page");
function ConfiguratorStepPage(_a) {
    var params = _a.params;
    return (<ConfiguratorContext_1.ConfiguratorProvider>
      <step_page_1.default stepId={params.stepId}/>
    </ConfiguratorContext_1.ConfiguratorProvider>);
}
