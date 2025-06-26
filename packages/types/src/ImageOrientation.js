"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageOrientationSchema = void 0;
var zod_1 = require("zod");
/**
 * Enum-like string union for supported image orientations.
 */
exports.imageOrientationSchema = zod_1.z.enum(["portrait", "landscape"]);
