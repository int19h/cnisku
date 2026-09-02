import { ATTITUDES, INTENSITIES, MODIFIERS, formatCmavo } from "./attitudes.js";

const BASE_IDS = new Set(Object.keys(ATTITUDES));
const MODIFIER_IDS = new Set(Object.keys(MODIFIERS));
const INTENSITY_IDS = new Set(Object.keys(INTENSITIES));
const SPECIAL_IDS = new Set(["nai", "ge'e", "bu'o", "dai", "pei"]);
const TOKENS = [...BASE_IDS, ...MODIFIER_IDS, ...INTENSITY_IDS, ...SPECIAL_IDS]
  .sort((a, b) => b.length - a.length || a.localeCompare(b));

const separator = /[\s.,;:!?()[\]{}\-–—/]/;

export function tokenizeIndicators(input) {
  const source = input.toLocaleLowerCase().replaceAll("’", "'").replaceAll("‘", "'");
  const tokens = [];
  const diagnostics = [];
  let index = 0;

  while (index < source.length) {
    if (separator.test(source[index])) {
      index += 1;
      continue;
    }

    const token = TOKENS.find((candidate) => source.startsWith(candidate, index));
    if (token) {
      tokens.push({ value: token, start: index, end: index + token.length });
      index += token.length;
      continue;
    }

    const start = index;
    while (index < source.length && !separator.test(source[index]) && !TOKENS.some((candidate) => source.startsWith(candidate, index))) {
      index += 1;
    }
    if (start === index) index += 1;
    diagnostics.push({
      level: "error",
      message: `Unrecognized text “${source.slice(start, index)}” at character ${start + 1}.`
    });
  }

  return { tokens, diagnostics };
}

function newClause(root = "ge'e") {
  return {
    root,
    polarity: 1,
    intensity: null,
    modifiers: [],
    contour: null,
    empathy: false,
    question: false
  };
}

export function parseIndicators(input) {
  const tokenized = tokenizeIndicators(input);
  const diagnostics = [...tokenized.diagnostics];
  const clauses = [];
  let current = null;
  let last = null;
  let pendingQuestion = false;

  const ensureCurrent = () => {
    if (!current) {
      current = newClause();
      clauses.push(current);
    }
    return current;
  };

  for (const token of tokenized.tokens) {
    const id = token.value;

    if (BASE_IDS.has(id) || id === "ge'e") {
      current = newClause(id);
      current.question = pendingQuestion;
      pendingQuestion = false;
      clauses.push(current);
      last = { kind: "scalable", target: current };
      continue;
    }

    if (MODIFIER_IDS.has(id)) {
      const clause = ensureCurrent();
      const modifier = { id, polarity: 1, intensity: null };
      clause.modifiers.push(modifier);
      last = { kind: "scalable", target: modifier };
      continue;
    }

    if (INTENSITY_IDS.has(id)) {
      if (last?.kind === "contour" && id === "cu'i") {
        ensureCurrent().contour = "continue";
        last = { kind: "contour", target: current };
        continue;
      }

      if (!last || (last.kind !== "scalable" && last.kind !== "intensity")) {
        const clause = ensureCurrent();
        last = { kind: "scalable", target: clause };
      }
      const target = last.target;
      if (target.intensity !== null) {
        diagnostics.push({ level: "warning", message: `${formatCmavo(id)} replaces the previous intensity on the same indicator.` });
      }
      target.intensity = id;
      last = { kind: "intensity", target };
      continue;
    }

    if (id === "nai") {
      if (last?.kind === "scalable") {
        last.target.polarity *= -1;
      } else if (last?.kind === "contour") {
        ensureCurrent().contour = "end";
      } else if (last?.kind === "intensity") {
        diagnostics.push({
          level: "warning",
          message: "This face-only subset does not interpret nai applied directly to a CAI word; put nai immediately after the attitude or modifier instead."
        });
      } else {
        diagnostics.push({ level: "error", message: "nai needs a preceding attitude, modifier, or bu'o." });
      }
      continue;
    }

    if (id === "bu'o") {
      ensureCurrent().contour = "start";
      last = { kind: "contour", target: current };
      continue;
    }

    if (id === "dai") {
      ensureCurrent().empathy = true;
      last = { kind: "special", target: current };
      continue;
    }

    if (id === "pei") {
      if (current) {
        current.question = true;
        last = { kind: "special", target: current };
      } else {
        pendingQuestion = true;
        last = { kind: "special", target: null };
      }
    }
  }

  if (pendingQuestion && !clauses.length) {
    current = newClause();
    current.question = true;
    clauses.push(current);
  }

  return { input, tokens: tokenized.tokens.map(({ value }) => value), clauses, diagnostics };
}

const intensityDescription = (intensity) => intensity ? INTENSITIES[intensity]?.label : null;

function describeScalable(definition, scalable) {
  if (scalable.intensity === "cu'i") return definition.neutral;
  const meaning = scalable.polarity < 0 ? definition.negative : definition.positive;
  const intensity = intensityDescription(scalable.intensity);
  return intensity ? `${intensity} ${meaning}` : meaning;
}

export function describeClause(clause) {
  const pieces = [];
  if (clause.root !== "ge'e") pieces.push(describeScalable(ATTITUDES[clause.root], clause));
  for (const modifier of clause.modifiers) {
    pieces.push(describeScalable(MODIFIERS[modifier.id], modifier));
  }
  if (!pieces.length) pieces.push("unspecified attitude");
  if (clause.empathy) pieces.push("felt empathetically");
  if (clause.question) pieces.push("questioned rather than asserted");
  if (clause.contour === "start") pieces.push("beginning");
  if (clause.contour === "continue") pieces.push("continuing");
  if (clause.contour === "end") pieces.push("ending");
  return pieces.join(" · ");
}
