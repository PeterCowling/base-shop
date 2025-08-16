"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("@testing-library/react");
var MainImageField_1 = require("@cms/app/cms/blog/posts/MainImageField");
jest.mock("@ui", function () { return ({
    Button: function (_a) {
        var children = _a.children;
        return <button>{children}</button>;
    },
    ImagePicker: function (_a) {
        var children = _a.children;
        return <div>{children}</div>;
    },
}); });
describe("MainImageField", function () {
    it("shows select label when empty", function () {
        (0, react_1.render)(<MainImageField_1.default value="" onChange={function () { }}/>);
        expect(react_1.screen.getByText("Select image")).toBeInTheDocument();
    });
    it("shows preview when value present", function () {
        (0, react_1.render)(<MainImageField_1.default value="/test.png" onChange={function () { }}/>);
        expect(react_1.screen.getByAltText("Main image")).toHaveAttribute("src", "/test.png");
        expect(react_1.screen.getByText("Change image")).toBeInTheDocument();
    });
});
