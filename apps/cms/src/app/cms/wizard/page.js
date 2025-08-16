"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WizardPage;
var navigation_1 = require("next/navigation");
function WizardPage() {
    (0, navigation_1.redirect)("/cms/configurator");
}
