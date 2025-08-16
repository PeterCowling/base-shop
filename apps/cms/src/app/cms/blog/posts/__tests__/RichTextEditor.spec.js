"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var RichTextEditor_1 = require("@cms/app/cms/blog/posts/RichTextEditor");
jest.mock("@ui", function () { return ({
    Button: function (_a) {
        var children = _a.children;
        return <button>{children}</button>;
    },
    Input: function (props) { return <input {...props}/>; },
    ImagePicker: function (_a) {
        var children = _a.children;
        return <div>{children}</div>;
    },
}); });
jest.mock("@portabletext/editor", function () { return ({
    defineSchema: function (x) { return x; },
    EditorProvider: function (_a) {
        var children = _a.children;
        return <div>{children}</div>;
    },
    PortableTextEditable: function () { return <div />; },
    PortableTextEditor: {
        insertBlock: jest.fn(),
        toggleMark: jest.fn(),
        toggleBlockStyle: jest.fn(),
        addAnnotation: jest.fn(),
        removeAnnotation: jest.fn(),
        isAnnotationActive: jest.fn(),
    },
    useEditor: function () { return ({}); },
}); });
var captured;
jest.mock("@portabletext/editor/plugins", function () { return ({
    EventListenerPlugin: function (_a) {
        var on = _a.on;
        captured = on;
        return null;
    },
}); });
describe("RichTextEditor", function () {
    it("invokes onChange on mutation", function () {
        var onChange = jest.fn();
        var initial = [];
        (0, react_1.render)(<RichTextEditor_1.default value={initial} onChange={onChange}/>);
        captured({ type: "mutation", value: [{ _type: "block", _key: "a" }] });
        expect(onChange).toHaveBeenCalledWith([{ _type: "block", _key: "a" }]);
    });
});
