import { describe, it } from "@jest/globals";

// CI-only test stubs for EditProductFilterSelector show-all mode. Never run locally.
describe("EditProductFilterSelector", () => {
  it.skip("TC-01: 5 products across 2 brands, showAll=false → Show all products button visible below New Product button", () => {});
  it.skip("TC-02: Click Show all products → all 5 products listed with brand+collection subtitles → cascade selects hidden", () => {});
  it.skip("TC-03: In show-all mode, click a product → onSelect called with correct product → showAll resets to false", () => {});
  it.skip("TC-04: In show-all mode, click Back to filter → showAll false → onNew NOT called → criteria unchanged", () => {});
  it.skip("TC-05: Show-all mode renders from props.products directly — criteria does not filter the list", () => {});
  it.skip("TC-06: Render with 0 products → Show all products button NOT rendered", () => {});
  it.skip("TC-07: Products with empty brandHandle render subtitle as — / —", () => {});
  it.skip("TC-08: zh locale → Show all products shows 显示全部商品 → Back to filter shows 返回筛选", () => {});
  it.skip("TC-09: data-testid edit-filter-show-all and edit-filter-hide-all present on correct buttons", () => {});
  it.skip("TC-10: 1 product in catalog, show-all mode active → auto-select useEffect fires → showAll remains true", () => {});
});
