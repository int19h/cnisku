import test from "node:test";
import assert from "node:assert/strict";

import { ATTITUDES, MODIFIERS } from "../src/attitudes.js";
import { composeExpression, neutralPose } from "../src/expression.js";
import { describeClause, parseIndicators, tokenizeIndicators } from "../src/parser.js";

test("ships the complete 39-scale CLL attitudinal inventory", () => {
  assert.equal(Object.keys(ATTITUDES).length, 39);
  assert.equal(Object.keys(MODIFIERS).length, 14);

  for (const root of Object.values(ATTITUDES)) {
    assert.ok(root.positive);
    assert.ok(root.negative);
    assert.notStrictEqual(root.positivePose, root.negativePose);
  }
});

test("tokenizes concatenated and spaced cmavo from the supported subset", () => {
  const result = tokenizeIndicators(".o'onaicai ri'enai .uiru'e");
  assert.deepEqual(result.tokens.map(({ value }) => value), ["o'o", "nai", "cai", "ri'e", "nai", "ui", "ru'e"]);
  assert.deepEqual(result.diagnostics, []);
});

test("applies nai and CAI to the immediately preceding scalable word", () => {
  const parsed = parseIndicators(".o'onaicai ri'enaisai");
  assert.equal(parsed.clauses.length, 1);
  assert.deepEqual(parsed.clauses[0], {
    root: "o'o",
    polarity: -1,
    intensity: "cai",
    modifiers: [{ id: "ri'e", polarity: -1, intensity: "sai" }],
    contour: null,
    empathy: false,
    question: false
  });
  assert.equal(describeClause(parsed.clauses[0]), "intense anger · strong controlled");
});

test("preserves opposite emotions as separate contributions", () => {
  const parsed = parseIndicators(".ii .iinai");
  assert.equal(parsed.clauses.length, 2);
  assert.equal(parsed.clauses[0].polarity, 1);
  assert.equal(parsed.clauses[1].polarity, -1);

  const expression = composeExpression(parsed);
  assert.deepEqual(expression.descriptions, ["fear", "security"]);
  assert.ok(expression.pose.eyeOpen > 0, "fearful eye widening remains visible");
  assert.ok(expression.pose.headLift > 0, "the security contribution remains visible");
});

test("supports modifier-only expressions through an implicit unspecified root", () => {
  const parsed = parseIndicators("ri'enai");
  assert.equal(parsed.clauses[0].root, "ge'e");
  assert.deepEqual(parsed.clauses[0].modifiers, [{ id: "ri'e", polarity: -1, intensity: null }]);
  assert.equal(describeClause(parsed.clauses[0]), "controlled");
});

test("recognizes start, continuation, and end contours", () => {
  assert.equal(parseIndicators(".uibu'o").clauses[0].contour, "start");
  assert.equal(parseIndicators(".uibu'ocu'i").clauses[0].contour, "continue");
  assert.equal(parseIndicators(".uibu'onai").clauses[0].contour, "end");
});

test("questions do not assert a facial pose", () => {
  const expression = composeExpression(parseIndicators(".uipei"));
  assert.equal(expression.question, true);
  assert.deepEqual(expression.pose, neutralPose());
});

test("prefix pei questions the following attitude instead of creating a separate clause", () => {
  const parsed = parseIndicators("pei.o'u");
  assert.equal(parsed.clauses.length, 1);
  assert.equal(parsed.clauses[0].root, "o'u");
  assert.equal(parsed.clauses[0].question, true);
});

test("reports unsupported text without invoking a general Lojban parser", () => {
  const parsed = parseIndicators(".ui broda");
  assert.ok(parsed.diagnostics.some(({ level, message }) => level === "error" && message.includes("Unrecognized")));
  assert.equal(parsed.clauses[0].root, "ui");
});

test("cu'i contributes the neutral point of a scale", () => {
  const expression = composeExpression(parseIndicators(".uicu'i"));
  assert.deepEqual(expression.pose, neutralPose());
  assert.deepEqual(expression.descriptions, ["neither happiness nor unhappiness"]);
});
