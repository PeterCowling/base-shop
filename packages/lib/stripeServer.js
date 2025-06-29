"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = void 0;
// src/lib/stripeServer.ts
var env_1 = require("@config/env");
var stripe_1 = __importDefault(require("stripe"));
/**
 * Edge-friendly Stripe client.
 * Make sure STRIPE_SECRET_KEY is set in Cloudflare Pages → Environment Variables.
 */
exports.stripe = new stripe_1.default(env_1.env.STRIPE_SECRET_KEY, {
    // ✅ value assigned to the normal property
    apiVersion: "2025-05-28.basil",
    // ↳ required for Edge
    httpClient: stripe_1.default.createFetchHttpClient(),
});
