"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sveltePlugin;
function sveltePlugin() {
    return {
        name: "svelte-plugin",
        setup: function () {
            console.log("Svelte plugin loaded");
        },
    };
}
