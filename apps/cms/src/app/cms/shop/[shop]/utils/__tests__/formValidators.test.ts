import type { ErrorSetter as SharedErrorSetter } from "@acme/shared-utils";
import type { ErrorSetter as FormErrorSetter } from "../formValidators";

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() =>
  T extends B ? 1 : 2
    ? true
    : false;

type AssertErrorSetterReExported = Expect<
  Equal<FormErrorSetter, SharedErrorSetter>
>;

const jsonFieldHandlerSentinel = jest.fn();
const errorSetterSentinel = jest.fn(() => undefined) as unknown as SharedErrorSetter;
// The typed assignment below enforces at compile time that formValidators continues
// to re-export the ErrorSetter alias from @acme/shared-utils.
const forwardedErrorSetter: FormErrorSetter = errorSetterSentinel;
const _compileTimeCheck: AssertErrorSetterReExported = true;

jest.mock("@acme/shared-utils", () => ({
  __esModule: true,
  jsonFieldHandler: jsonFieldHandlerSentinel,
  ErrorSetter: errorSetterSentinel,
}));

describe("formValidators shared-utils wiring", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("re-exports jsonFieldHandler from @acme/shared-utils", async () => {
    const mod = await import("../formValidators");
    expect(mod.jsonFieldHandler).toBe(jsonFieldHandlerSentinel);
  });

  it("keeps ErrorSetter wired to the @acme/shared-utils export", async () => {
    await import("../formValidators");
    expect(_compileTimeCheck).toBe(true);
    // If the type-only re-export changes, the assignment above will fail to compile.
    expect(forwardedErrorSetter).toBe(errorSetterSentinel);
  });
});
