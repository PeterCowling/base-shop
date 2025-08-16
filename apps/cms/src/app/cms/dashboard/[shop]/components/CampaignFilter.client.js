"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignFilter = CampaignFilter;
var navigation_1 = require("next/navigation");
function CampaignFilter(_a) {
    var campaigns = _a.campaigns;
    var router = (0, navigation_1.useRouter)();
    var pathname = (0, navigation_1.usePathname)();
    var searchParams = (0, navigation_1.useSearchParams)();
    var selected = searchParams.getAll("campaign");
    return (<select multiple className="mb-4 rounded border p-1" value={selected} onChange={function (e) {
            var params = new URLSearchParams(searchParams.toString());
            params.delete("campaign");
            var values = Array.from(e.target.selectedOptions).map(function (o) { return o.value; });
            for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
                var v = values_1[_i];
                if (v)
                    params.append("campaign", v);
            }
            var query = params.toString();
            router.push(query ? "".concat(pathname, "?").concat(query) : pathname);
        }}>
      {campaigns.map(function (c) { return (<option key={c} value={c}>
          {c}
        </option>); })}
    </select>);
}
