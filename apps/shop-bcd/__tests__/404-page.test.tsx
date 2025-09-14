// apps/shop-bcd/__tests__/404-page.test.tsx

jest.mock("../src/components/NotFoundContent", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

import { renderToString } from "react-dom/server";
import NotFoundContent from "../src/components/NotFoundContent";
import FourOhFourPage, { dynamic } from "../src/app/404/page";

test("renders NotFoundContent", () => {
  renderToString(<FourOhFourPage />);
  expect(NotFoundContent).toHaveBeenCalled();
});

test("dynamic export is force-static", () => {
  expect(dynamic).toBe("force-static");
});

