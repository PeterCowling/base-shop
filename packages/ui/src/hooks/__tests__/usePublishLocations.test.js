import { jsx as _jsx } from "react/jsx-runtime";
// packages/ui/hooks/__tests__/usePublishLocations.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { usePublishLocations } from "../usePublishLocations";
describe("usePublishLocations", () => {
    it("fetches locations from API", async () => {
        /* --------------- mock fetch ----------------- */
        const originalFetch = global.fetch;
        global.fetch = jest.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
                {
                    id: "a",
                    name: "A",
                    path: "a",
                    requiredOrientation: "landscape",
                },
            ]),
        }));
        /* --------------- test component ------------- */
        function Test() {
            const { locations } = usePublishLocations();
            return _jsx("span", { "data-testid": "count", children: locations.length });
        }
        render(_jsx(Test, {}));
        await waitFor(() => expect(Number(screen.getByTestId("count").textContent)).toBe(1));
        /* --------------- restore fetch -------------- */
        global.fetch = originalFetch;
    });
});
