// xa-b is a static export (output: "export") with no server-side auth.
// NEXTAUTH_SECRET, SESSION_SECRET, and CART_COOKIE_SECRET are not required
// at build time — no production secret guards exist in next.config.mjs.
// Secret guard tests were removed when xa-b switched to static-export in
// feat(xa-b): set output:export (TASK-01).

it.todo("no secret guards — xa-b is a static export with no server-side auth");
