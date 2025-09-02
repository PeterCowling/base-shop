import { expect, test } from "@playwright/test";

async function readVar(page: any, name: string) {
  return page.evaluate(
    (n) =>
      getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name
  );
}

test("toolbar theme and mode toggles update CSS variables", async ({
  page,
}) => {
  await page.goto("http://localhost:6007/iframe.html?id=tokens-all--overview");

  const basePrimary = await readVar(page, "--color-primary");
  expect(basePrimary).toBe("220 90% 56%");

  await page.evaluate(() =>
    window.__STORYBOOK_ADDONS.channel.emit("updateGlobals", {
      globals: { tokens: "brandx" },
    })
  );
  await page.waitForTimeout(100);
  const brandPrimary = await readVar(page, "--color-primary");
  expect(brandPrimary).toBe("340 80% 50%");

  await page.evaluate(() =>
    window.__STORYBOOK_ADDONS.channel.emit("updateGlobals", {
      globals: { theme: "dark" },
    })
  );
  await page.waitForTimeout(100);
  const darkBg = await readVar(page, "--color-bg");
  expect(darkBg).toBe("0 0% 4%");
});
