"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ColorInput;
var shadcn_1 = require("@/components/atoms/shadcn");
var colorUtils_1 = require("@ui/utils/colorUtils");
function ColorInput(_a) {
    var name = _a.name, defaultValue = _a.defaultValue, value = _a.value, onChange = _a.onChange, onReset = _a.onReset, inputRef = _a.inputRef;
    var hasOverride = value !== "";
    var isOverridden = hasOverride && value !== defaultValue;
    var defaultIsHsl = (0, colorUtils_1.isHsl)(defaultValue);
    var defaultIsHex = (0, colorUtils_1.isHex)(defaultValue);
    var isColor = defaultIsHsl || defaultIsHex;
    var current = hasOverride ? value : defaultValue;
    var colorValue = defaultIsHsl
        ? (0, colorUtils_1.isHex)(current)
            ? current
            : (0, colorUtils_1.hslToHex)(current)
        : current;
    var handleChange = function (e) {
        var raw = e.target.value;
        var converted = defaultIsHsl ? (0, colorUtils_1.hexToHsl)(raw) : raw;
        onChange(converted === defaultValue ? "" : converted);
    };
    return (<label data-token-key={name} className={"flex flex-col gap-1 ".concat(isOverridden ? "bg-amber-50" : "")}>
      <span>{name}</span>
      <div className="flex items-center gap-2">
        <shadcn_1.Input value={defaultValue} disabled/>
        {isColor ? (<>
            <input type="color" value={colorValue} onChange={handleChange} ref={inputRef} className={isOverridden ? "bg-amber-100" : ""}/>
            <span className="h-6 w-6 rounded border" style={{ background: colorValue }}/>
          </>) : (<shadcn_1.Input placeholder={defaultValue} value={value} onChange={function (e) { return onChange(e.target.value); }} ref={inputRef} className={isOverridden ? "bg-amber-100" : ""}/>)}
        {hasOverride && (<shadcn_1.Button type="button" onClick={onReset}>
            Reset
          </shadcn_1.Button>)}
      </div>
    </label>);
}
