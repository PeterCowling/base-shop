"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setEmailService = setEmailService;
exports.getEmailService = getEmailService;
exports.sendSystemEmail = sendSystemEmail;
require("server-only");
const module_1 = require("module");
const req = typeof require === "function" ? require : (0, module_1.createRequire)(process.cwd() + "/");
let service;
function setEmailService(svc) {
    service = svc;
}
function getEmailService() {
    if (!service) {
        throw new Error("EmailService not registered"); // i18n-exempt -- CORE-1011 internal error message
    }
    return service;
}
/** Send an email using the system provider configuration. */
async function sendSystemEmail(data) {
    if (!process.env.EMAIL_PROVIDER) {
        throw new Error("Email provider not configured"); // i18n-exempt -- CORE-1011 internal error message
    }
    const mod = req("@acme/email");
    return mod.sendEmail(data.to, data.subject, data.html);
}
