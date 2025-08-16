"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PreviewPane;
var react_1 = require("react");
var StyleEditor_1 = require("@/components/cms/StyleEditor");
var WizardPreview_1 = require("../../../wizard/WizardPreview");
function PreviewPane(_a) {
    var style = _a.style, tokens = _a.tokens, baseTokens = _a.baseTokens, onChange = _a.onChange;
    var _b = (0, react_1.useState)(null), selectedToken = _b[0], setSelectedToken = _b[1];
    var styleEditorRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        var _a, _b;
        if (selectedToken) {
            (_b = (_a = styleEditorRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView) === null || _b === void 0 ? void 0 : _b.call(_a, {
                behavior: "smooth",
                block: "start",
            });
        }
    }, [selectedToken]);
    return (<>
      <WizardPreview_1.default style={style} inspectMode onTokenSelect={setSelectedToken}/>
      {selectedToken && (<div ref={styleEditorRef}>
          <StyleEditor_1.default tokens={tokens} baseTokens={baseTokens} onChange={onChange} focusToken={selectedToken}/>
        </div>)}
    </>);
}
