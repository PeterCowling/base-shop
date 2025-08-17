"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PreviewClient;
var react_1 = require("react");
var DynamicRenderer_1 = require("@ui/components/DynamicRenderer");
var DeviceSelector_1 = require("@ui/components/DeviceSelector");
var devicePresets_1 = require("@ui/utils/devicePresets");
var hooks_1 = require("@ui/hooks");
function PreviewClient(_a) {
    var components = _a.components, locale = _a.locale, initialDeviceId = _a.initialDeviceId;
    var _b = (0, hooks_1.usePreviewDevice)(initialDeviceId), deviceId = _b[0], setDeviceId = _b[1];
    var device = (0, react_1.useMemo)(function () { var _a; return (_a = devicePresets_1.devicePresets.find(function (d) { return d.id === deviceId; })) !== null && _a !== void 0 ? _a : devicePresets_1.devicePresets[0]; }, [deviceId]);
    return (<div className="space-y-4">
      <DeviceSelector_1.default deviceId={deviceId} setDeviceId={setDeviceId}/>
      <div style={{ width: device.width, height: device.height }} className="mx-auto overflow-auto rounded border">
        <DynamicRenderer_1.default components={components} locale={locale}/>
      </div>
    </div>);
}
