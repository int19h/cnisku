import test from "node:test";
import assert from "node:assert/strict";

import { expressionFromUrl, relativeUrl, urlWithExpression } from "../src/share.js";

test("round-trips an indicator string through the share URL", () => {
  const expression = ".o'onaicai ri'enai";
  const url = urlWithExpression("https://example.test/cnisku/", expression);

  assert.equal(expressionFromUrl(url), expression);
  assert.equal(url.pathname, "/cnisku/");
  assert.match(url.search, /^\?q=/);
});

test("preserves unrelated parameters and fragments", () => {
  const url = urlWithExpression("https://example.test/cnisku/?theme=paper#face", ".ii .iinai");

  assert.equal(url.searchParams.get("theme"), "paper");
  assert.equal(url.hash, "#face");
  assert.equal(relativeUrl(url), `${url.pathname}${url.search}#face`);
});

test("distinguishes an explicitly empty expression from a missing parameter", () => {
  assert.equal(expressionFromUrl("https://example.test/cnisku/"), null);

  const empty = urlWithExpression("https://example.test/cnisku/", "");
  assert.equal(expressionFromUrl(empty), "");
  assert.equal(empty.search, "?q=");
});
