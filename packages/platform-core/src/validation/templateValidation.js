"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTemplateCreation = validateTemplateCreation;
const componentRules_1 = require("./componentRules");
const placement_1 = require("./placement");
function validateTemplateCreation(components, options) {
    const comp = (0, componentRules_1.validateComponentRules)(components);
    if (comp.ok === false)
        return comp;
    const place = (0, placement_1.validatePlacement)(components, options);
    if (place.ok === false)
        return place;
    return { ok: true };
}
