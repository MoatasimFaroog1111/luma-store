import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
const root = process.cwd();
const ids = ["planner-bundle", "wellness-journal", "ai-prompts", "budget-templates", "social-templates", "ebook-bundle"];
test("paid products are not deployed as public PDFs", () => {
  for (const id of ids) assert.equal(existsSync(join(root, "public", "downloads", id + ".pdf")), false, id + " must be private");
});
test("checkout is handled by server endpoints, never browser-side capture", () => {
  const button = readFileSync(join(root, "components", "PayPalButton.tsx"), "utf8");
  assert.match(button, /\/api\/checkout\/create/);
  assert.match(button, /\/api\/checkout\/capture/);
  assert.doesNotMatch(button, /actions\.order\.capture/);
});
test("download endpoint verifies signed access before reading storage", () => {
  const route = readFileSync(join(root, "app", "api", "download", "[id]", "route.ts"), "utf8");
  assert.match(route, /verifyDownload\(token, id\)/);
  assert.match(route, /fetchPrivatePdf\(id\)/);
});
test("no placeholder checkout in storefront", () => {
  const page = readFileSync(join(root, "app", "page.tsx"), "utf8");
  assert.doesNotMatch(page, /Checkout ready/);
  assert.doesNotMatch(page, /\/downloads\/\$\{id\}/);
});
