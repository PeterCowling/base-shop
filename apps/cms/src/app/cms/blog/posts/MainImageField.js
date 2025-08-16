"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MainImageField;
var _ui_1 = require("@ui");
function MainImageField(_a) {
    var value = _a.value, onChange = _a.onChange;
    return (<div className="space-y-2">
      <label className="block font-medium">Main image</label>
      <_ui_1.ImagePicker onSelect={onChange}>
        <_ui_1.Button type="button" variant="outline">
          {value ? "Change image" : "Select image"}
        </_ui_1.Button>
      </_ui_1.ImagePicker>
      {value && (<img src={value} alt="Main image" className="h-32 w-auto rounded object-cover"/>)}
    </div>);
}
