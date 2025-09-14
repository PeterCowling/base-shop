/** @jest-environment jsdom */
import { render } from "@testing-library/react";

describe("_error page", () => {
  it("renders provided status code", () => {
    const { default: ErrorPage } = require("../src/pages/_error");
    const { getByText } = render(<ErrorPage statusCode={404} />);
    expect(getByText("404 — Something went wrong")).toBeInTheDocument();
  });

  it("getInitialProps returns status code", () => {
    const mod = require("../src/pages/_error");
    const getInitialProps = mod.default.getInitialProps as (ctx: any) => any;
    expect(getInitialProps({ res: { statusCode: 418 } })).toEqual({ statusCode: 418 });
    expect(getInitialProps({ err: { statusCode: 400 } })).toEqual({ statusCode: 400 });
    expect(getInitialProps({})).toEqual({ statusCode: 500 });
  });
});
