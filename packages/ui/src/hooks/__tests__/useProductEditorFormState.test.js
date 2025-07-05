import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useProductEditorFormState } from "../useProductEditorFormState";
/* ------------------------------------------------------------------ *
 *  Mock the image-upload and publish-location hooks (no network, no DOM)
 * ------------------------------------------------------------------ */
jest.mock("../useImageUpload", () => ({
    useImageUpload: () => ({
        file: null,
        setFile: jest.fn(),
        uploader: _jsx("div", {}),
    }),
}));
jest.mock("../usePublishLocations", () => ({
    usePublishLocations: () => ({ locations: [], reload: jest.fn() }),
}));
/* ------------------------------------------------------------------ *
 *  Shared fixtures
 * ------------------------------------------------------------------ */
const product = {
    id: "p1",
    sku: "sku1",
    title: { en: "Old EN", de: "Old DE", it: "Old IT" },
    description: { en: "Desc EN", de: "Desc DE", it: "Desc IT" },
    price: 100,
    currency: "EUR",
    images: [],
    created_at: "2023-01-01",
    updated_at: "2023-01-01",
    shop: "shop",
    status: "draft",
    row_version: 1,
};
const locales = ["en", "de"];
/* ------------------------------------------------------------------ *
 *  Test wrapper component
 * ------------------------------------------------------------------ */
function Wrapper({ onSave, }) {
    const state = useProductEditorFormState(product, locales, onSave);
    return (_jsxs("form", { onSubmit: state.handleSubmit, children: [_jsx("input", { "data-testid": "title-en", name: "title_en", value: state.product.title.en, onChange: state.handleChange }), _jsx("input", { "data-testid": "price", name: "price", value: state.product.price, onChange: state.handleChange }), _jsx("button", { type: "submit", children: "save" })] }));
}
/* ------------------------------------------------------------------ *
 *  Tests
 * ------------------------------------------------------------------ */
describe("useProductEditorFormState", () => {
    it("handleChange updates multilingual fields and price", () => {
        const onSave = jest.fn().mockResolvedValue({ product });
        render(_jsx(Wrapper, { onSave: onSave }));
        fireEvent.change(screen.getByTestId("title-en"), {
            target: { value: "New" },
        });
        fireEvent.change(screen.getByTestId("price"), {
            target: { value: "200" },
        });
        expect(screen.getByTestId("title-en").value).toBe("New");
        expect(screen.getByTestId("price").value).toBe("200");
    });
    it("handleSubmit calls save callback with generated FormData", async () => {
        const onSave = jest
            .fn()
            .mockResolvedValue({ product });
        render(_jsx(Wrapper, { onSave: onSave }));
        fireEvent.change(screen.getByTestId("title-en"), {
            target: { value: "New" },
        });
        fireEvent.change(screen.getByTestId("price"), {
            target: { value: "200" },
        });
        fireEvent.click(screen.getByText("save"));
        await waitFor(() => expect(onSave).toHaveBeenCalled());
        const fd = onSave.mock.calls[0][0];
        const entries = Array.from(fd.entries());
        expect(entries).toEqual(expect.arrayContaining([
            ["id", "p1"],
            ["title_en", "New"],
            ["desc_en", "Desc EN"],
            ["title_de", "Old DE"],
            ["desc_de", "Desc DE"],
            ["price", "200"],
            ["publish", ""],
        ]));
    });
});
