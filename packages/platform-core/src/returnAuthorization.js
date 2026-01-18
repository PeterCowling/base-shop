"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReturnAuthorization = exports.getTrackingStatus = void 0;
exports.listReturnAuthorizations = listReturnAuthorizations;
exports.createReturnAuthorization = createReturnAuthorization;
const returnAuthorization_server_1 = require("./repositories/returnAuthorization.server");
Object.defineProperty(exports, "getReturnAuthorization", { enumerable: true, get: function () { return returnAuthorization_server_1.getReturnAuthorization; } });
var index_1 = require("./shipping/index");
Object.defineProperty(exports, "getTrackingStatus", { enumerable: true, get: function () { return index_1.getTrackingStatus; } });
async function listReturnAuthorizations() {
    return (0, returnAuthorization_server_1.readReturnAuthorizations)();
}
async function createReturnAuthorization({ orderId, status = "pending", inspectionNotes = "", }) {
    const ra = {
        raId: `RA${Date.now().toString(36).toUpperCase()}`,
        orderId,
        status,
        inspectionNotes,
    };
    await (0, returnAuthorization_server_1.addReturnAuthorization)(ra);
    return ra;
}
