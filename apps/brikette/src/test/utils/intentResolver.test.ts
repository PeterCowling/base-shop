// apps/brikette/src/test/utils/intentResolver.test.ts
// Test stubs for intentResolver utility.
// Tests run in CI only — never run jest locally (docs/testing-policy.md).

describe("resolveIntent", () => {
  test.todo(
    "desktop_header resolves to hostel / null / direct_resolution / hostel_central"
  );

  test.todo(
    "mobile_nav resolves to hostel / null / direct_resolution / hostel_central"
  );

  test.todo(
    "notification_banner resolves to hostel / null / direct_resolution / hostel_central"
  );

  test.todo(
    "offers_modal resolves to hostel / null / direct_resolution / hostel_central"
  );

  test.todo(
    "booking_widget resolves to hostel / null / direct_resolution / hostel_central"
  );

  test.todo(
    "room_card resolves to hostel / hostel_bed / direct_resolution / hostel_assist"
  );

  test.todo(
    "sticky_book_now resolves to hostel / hostel_bed / direct_resolution / hostel_assist"
  );

  test.todo(
    "deals_page_cta resolves to hostel / null / direct_resolution / hostel_central"
  );

  test.todo(
    "sticky_cta with isPrivateRoute: true resolves to private / null / direct_resolution / private"
  );

  test.todo(
    "sticky_cta with isPrivateRoute: false resolves to hostel / null / direct_resolution / hostel_central"
  );

  test.todo(
    "sticky_cta with no pageContext resolves to hostel (defaults to non-private)"
  );

  test.todo(
    "unknown ctaLocation resolves to undetermined / null / chooser / hostel_central (safe fallback)"
  );

  test.todo(
    "SSR safety: resolveIntent does not access window, sessionStorage, or any browser global"
  );
});
