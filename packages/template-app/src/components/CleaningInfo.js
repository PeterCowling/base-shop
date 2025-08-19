"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleaningInfo = CleaningInfo;
var cleaning_json_1 = require("../../../../data/rental/cleaning.json");
function CleaningInfo() {
    return (<section className="space-y-4">
      <h2 className="text-lg font-semibold">Cleaning Information</h2>
      <div className="space-y-1">
        <h3 className="font-medium">Garments</h3>
        <p>{cleaning_json_1.default.garment}</p>
      </div>
      <div className="space-y-1">
        <h3 className="font-medium">Reusable Bags</h3>
        <p>{cleaning_json_1.default.reusableBag}</p>
      </div>
    </section>);
}
exports.default = CleaningInfo;
