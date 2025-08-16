"use strict";
// apps/cms/src/actions/pages/service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPages = getPages;
exports.savePage = savePage;
exports.updatePage = updatePage;
exports.deletePage = deletePage;
var index_server_1 = require("@platform-core/repositories/pages/index.server");
function getPages(shop) {
    return (0, index_server_1.getPages)(shop);
}
function savePage(shop, page) {
    return (0, index_server_1.savePage)(shop, page);
}
function updatePage(shop, page) {
    return (0, index_server_1.updatePage)(shop, page);
}
function deletePage(shop, id) {
    return (0, index_server_1.deletePage)(shop, id);
}
