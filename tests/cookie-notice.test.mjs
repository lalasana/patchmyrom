// The cookie notice is a visual notice only. These tests pin the requirement that Google Tag Manager,
// Analytics and AdSense never depend on it, and that the notice stays the simple one-button banner.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

function sourceFiles(dir, out = []) {
  for (const name of readdirSync(new URL(dir, root))) {
    const rel = `${dir}${name}`;
    if (statSync(new URL(rel, root)).isDirectory()) sourceFiles(rel + "/", out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(rel);
  }
  return out;
}
const allSource = ["app/", "components/", "lib/", "hooks/"].flatMap((d) => sourceFiles(d));

test("the layout head keeps the Google tags exactly once, as plain tags", () => {
  const layout = read("app/layout.tsx");
  assert.equal((layout.match(/adsbygoogle\.js\?client=ca-pub-4892097815597579/g) || []).length, 1, "AdSense tag once, exact ID");
  assert.equal((layout.match(/googletagmanager\.com\/gtm\.js\?id=GTM-M2XR3LLF/g) || []).length, 1, "GTM tag once, exact ID");
  assert.equal((layout.match(/'gtm\.start'/g) || []).length, 1, "one gtm.start push");
  const head = layout.slice(layout.indexOf("<head>"), layout.indexOf("</head>"));
  assert.doesNotMatch(head, /CookieNotice|consent|localStorage/i, "nothing in the head depends on the notice");
  assert.doesNotMatch(layout, /from "next\/script"/, "no next/script wrapper that could defer or gate the tags");
});

test("nothing reads a consent value, so no Google behaviour depends on Accept", () => {
  for (const file of allSource) {
    const src = read(file);
    assert.doesNotMatch(src, /readStoredConsent|\.analytics\b|\.ads\b|cookie-consent/, `${file} has no consent gating`);
  }
  assert.ok(!existsSync(new URL("lib/cookie-consent.ts", root)), "old consent module is gone");
  assert.ok(!existsSync(new URL("components/layout/CookieConsentProvider.tsx", root)), "old provider is gone");
});

test("only the notice module touches the dismissal flag, and only to hide the notice", () => {
  const users = allSource.filter((f) => /cookie-notice|COOKIE_NOTICE_STORAGE_KEY/.test(read(f)));
  assert.deepEqual(users.sort(), ["components/layout/CookieNotice.tsx", "lib/cookie-notice.ts"]);
  const notice = read("components/layout/CookieNotice.tsx");
  assert.doesNotMatch(notice, /dataLayer|gtag|googletagmanager|adsbygoogle|window\.google/, "the notice never touches Google");
});

test("the notice is the simple banner: exact text, a single Accept button, link to the cookie policy", () => {
  const notice = read("components/layout/CookieNotice.tsx");
  assert.match(notice, /Our website uses cookies to improve your experience\. Learn more about our/);
  assert.match(notice, /href="\/privacy#cookies"/);
  assert.match(notice, />\s*cookie policy\s*</);
  assert.equal((notice.match(/<Button\b/g) || []).length, 1, "one button");
  assert.match(notice, />\s*Accept\s*<\/Button>/);
  assert.doesNotMatch(notice, /Customize|Reject|Settings|Preferences/i, "no settings or extra buttons");
});

test("the privacy page has the cookies section the notice links to and describes the Google services", () => {
  const privacy = read("app/privacy/page.tsx");
  assert.match(privacy, /id="cookies"/);
  assert.match(privacy, /Google Tag Manager/);
  assert.match(privacy, /Google AdSense/);
  assert.match(privacy, /run whether or not\s+you click it/);
  assert.doesNotMatch(privacy, /no analytics or advertising scripts are loaded/i);
  assert.doesNotMatch(privacy, /future version of the site/i);
});

test("About no longer claims there is no ad network or an optional-cookie choice", () => {
  const about = read("app/about/page.tsx");
  assert.doesNotMatch(about, /No ad network is\s+loaded/i);
  assert.doesNotMatch(about, /lets you decline/i);
  assert.match(about, /Google\s+Tag Manager, Google Analytics and Google AdSense/);
});

test("the emulator promo events are not gated on a cookie choice", () => {
  const client = read("lib/gba-emulator-client.ts");
  assert.doesNotMatch(client, /consent|opted into/i);
  assert.match(client, /export function trackGbaEmulator/);
});
