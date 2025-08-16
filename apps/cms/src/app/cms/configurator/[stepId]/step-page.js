"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StepPage;
var steps_1 = require("../steps");
var ConfiguratorContext_1 = require("../ConfiguratorContext");
function StepPage(_a) {
    var _b;
    var stepId = _a.stepId;
    var step = steps_1.steps[stepId];
    var state = (0, ConfiguratorContext_1.useConfigurator)().state;
    if (!step) {
        return null;
    }
    var list = (0, steps_1.getSteps)();
    var idx = (_b = steps_1.stepIndex[stepId]) !== null && _b !== void 0 ? _b : 0;
    var prev = list[idx - 1];
    var next = list[idx + 1];
    var StepComponent = step.component;
    return (<div className="space-y-4">
      <steps_1.ConfiguratorProgress currentStepId={stepId} completed={state.completed}/>
      <StepComponent prevStepId={prev === null || prev === void 0 ? void 0 : prev.id} nextStepId={next === null || next === void 0 ? void 0 : next.id}/>
    </div>);
}
