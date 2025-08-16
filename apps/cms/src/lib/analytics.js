"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMetrics = buildMetrics;
function buildMetrics(events, aggregates) {
    var emailOpenByDay = {};
    var emailClickByDay = {};
    var campaignSalesByDay = {};
    var campaignSalesCountByDay = {};
    var discountByCodeByDay = {};
    for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
        var e = events_1[_i];
        var day = (e.timestamp || "").slice(0, 10);
        if (!day)
            continue;
        if (e.type === "email_open") {
            emailOpenByDay[day] = (emailOpenByDay[day] || 0) + 1;
        }
        else if (e.type === "email_click") {
            emailClickByDay[day] = (emailClickByDay[day] || 0) + 1;
        }
        else if (e.type === "campaign_sale") {
            var amount = typeof e.amount === "number" ? e.amount : 0;
            campaignSalesByDay[day] = (campaignSalesByDay[day] || 0) + amount;
            campaignSalesCountByDay[day] =
                (campaignSalesCountByDay[day] || 0) + 1;
        }
        else if (e.type === "discount_redeemed" && typeof e.code === "string") {
            var code = e.code;
            var entry = discountByCodeByDay[day] || {};
            entry[code] = (entry[code] || 0) + 1;
            discountByCodeByDay[day] = entry;
        }
    }
    var days = Array.from(new Set(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], (aggregates ? Object.keys(aggregates.page_view) : []), true), (aggregates ? Object.keys(aggregates.order) : []), true), Object.keys(emailOpenByDay), true), Object.keys(emailClickByDay), true), Object.keys(campaignSalesByDay), true), Object.keys(discountByCodeByDay), true), (aggregates ? Object.keys(aggregates.discount_redeemed) : []), true), (aggregates ? Object.keys(aggregates.ai_crawl) : []), true))).sort();
    var traffic = {
        labels: days,
        data: aggregates
            ? days.map(function (d) { return aggregates.page_view[d] || 0; })
            : days.map(function (d) { return emailClickByDay[d] || 0; }),
    };
    var sales = {
        labels: days,
        data: aggregates
            ? days.map(function (d) { var _a, _b; return (_b = (_a = aggregates.order[d]) === null || _a === void 0 ? void 0 : _a.amount) !== null && _b !== void 0 ? _b : 0; })
            : days.map(function (d) { return campaignSalesByDay[d] || 0; }),
    };
    var conversion = {
        labels: days,
        data: aggregates
            ? days.map(function (d) {
                var _a;
                var views = aggregates.page_view[d] || 0;
                var orders = ((_a = aggregates.order[d]) === null || _a === void 0 ? void 0 : _a.count) || 0;
                return views > 0 ? (orders / views) * 100 : 0;
            })
            : days.map(function (d) {
                var clicks = emailClickByDay[d] || 0;
                var salesCount = campaignSalesCountByDay[d] || 0;
                return clicks > 0 ? (salesCount / clicks) * 100 : 0;
            }),
    };
    var emailOpens = {
        labels: days,
        data: days.map(function (d) { return emailOpenByDay[d] || 0; }),
    };
    var emailClicks = {
        labels: days,
        data: days.map(function (d) { return emailClickByDay[d] || 0; }),
    };
    var campaignSales = {
        labels: days,
        data: days.map(function (d) { return campaignSalesByDay[d] || 0; }),
    };
    var discountRedemptions = {
        labels: days,
        data: days.map(function (d) {
            var byCode = aggregates
                ? aggregates.discount_redeemed[d]
                : discountByCodeByDay[d];
            return byCode ? Object.values(byCode).reduce(function (a, b) { return a + b; }, 0) : 0;
        }),
    };
    var codes = new Set();
    if (aggregates) {
        for (var _a = 0, _b = Object.keys(aggregates.discount_redeemed); _a < _b.length; _a++) {
            var day = _b[_a];
            for (var _c = 0, _d = Object.keys(aggregates.discount_redeemed[day]); _c < _d.length; _c++) {
                var code = _d[_c];
                codes.add(code);
            }
        }
    }
    else {
        for (var _e = 0, _f = Object.keys(discountByCodeByDay); _e < _f.length; _e++) {
            var day = _f[_e];
            for (var _g = 0, _h = Object.keys(discountByCodeByDay[day]); _g < _h.length; _g++) {
                var code = _h[_g];
                codes.add(code);
            }
        }
    }
    var discountRedemptionsByCode = {
        labels: days,
        datasets: Array.from(codes).map(function (code) { return ({
            label: code,
            data: days.map(function (d) {
                var byCode = aggregates
                    ? aggregates.discount_redeemed[d]
                    : discountByCodeByDay[d];
                return byCode ? byCode[code] || 0 : 0;
            }),
        }); }),
    };
    var topDiscountCodes = Array.from(codes)
        .map(function (code) {
        var total = discountRedemptionsByCode.datasets
            .find(function (d) { return d.label === code; })
            .data.reduce(function (a, b) { return a + b; }, 0);
        return [code, total];
    })
        .sort(function (a, b) { return b[1] - a[1]; });
    var aiCrawl = {
        labels: days,
        data: aggregates
            ? days.map(function (d) { return aggregates.ai_crawl[d] || 0; })
            : days.map(function () { return 0; }),
    };
    var totals = {
        emailOpens: emailOpens.data.reduce(function (a, b) { return a + b; }, 0),
        emailClicks: emailClicks.data.reduce(function (a, b) { return a + b; }, 0),
        campaignSales: campaignSales.data.reduce(function (a, b) { return a + b; }, 0),
        campaignSaleCount: Object.values(campaignSalesCountByDay).reduce(function (a, b) { return a + b; }, 0),
        discountRedemptions: discountRedemptions.data.reduce(function (a, b) { return a + b; }, 0),
        aiCrawl: aiCrawl.data.reduce(function (a, b) { return a + b; }, 0),
    };
    var maxTotal = Math.max(totals.emailOpens, totals.emailClicks, totals.campaignSales, totals.discountRedemptions, totals.aiCrawl, 1);
    return {
        traffic: traffic,
        sales: sales,
        conversion: conversion,
        emailOpens: emailOpens,
        emailClicks: emailClicks,
        campaignSales: campaignSales,
        discountRedemptions: discountRedemptions,
        discountRedemptionsByCode: discountRedemptionsByCode,
        aiCrawl: aiCrawl,
        totals: totals,
        maxTotal: maxTotal,
        topDiscountCodes: topDiscountCodes,
    };
}
