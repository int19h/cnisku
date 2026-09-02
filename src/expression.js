import { ATTITUDES, DEFAULT_INTENSITY, INTENSITIES, MODIFIERS } from "./attitudes.js";
import { describeClause } from "./parser.js";

export const SIGNED_CHANNELS = Object.freeze([
  "browInner", "browOuter", "eyeOpen", "pupil", "gazeX", "gazeY", "smile",
  "mouthWidth", "headTilt", "headLift", "valence", "arousal", "dominance", "warmth"
]);

export const UNIPOLAR_CHANNELS = Object.freeze([
  "browKnit", "lidTension", "cheekRaise", "noseWrinkle", "mouthOpen", "lipPress",
  "upperLip", "jaw", "asymmetry", "blush", "tear", "sweat", "stress", "sparkle", "shadow"
]);

const ALL_CHANNELS = [...SIGNED_CHANNELS, ...UNIPOLAR_CHANNELS];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function neutralPose() {
  return Object.fromEntries(ALL_CHANNELS.map((channel) => [channel, 0]));
}

const amountFor = (intensity) => intensity ? INTENSITIES[intensity].amount : DEFAULT_INTENSITY;

function addPose(target, source, amount = 1) {
  for (const [channel, value] of Object.entries(source ?? {})) {
    if (channel in target) target[channel] += value * amount;
  }
}

function scaleExpressiveChannels(target, gain) {
  for (const channel of ALL_CHANNELS) {
    if (["valence", "arousal", "dominance", "warmth"].includes(channel)) continue;
    target[channel] *= gain;
  }
}

function modifierPose(modifier) {
  const definition = MODIFIERS[modifier.id];
  if (!definition || modifier.intensity === "cu'i") return {};
  return modifier.polarity < 0 ? definition.negativePose : definition.positivePose;
}

function expressionForClause(clause) {
  const result = neutralPose();
  const baseDefinition = ATTITUDES[clause.root];
  const baseAmount = amountFor(clause.intensity);

  if (baseDefinition && baseAmount > 0) {
    const endpoint = clause.polarity < 0 ? baseDefinition.negativePose : baseDefinition.positivePose;
    addPose(result, endpoint, baseAmount);
  }

  for (const modifier of clause.modifiers) {
    const modifierAmount = amountFor(modifier.intensity);
    if (modifierAmount === 0) continue;

    if (modifier.id === "ri'e") scaleExpressiveChannels(result, modifier.polarity < 0 ? 0.72 : 1.18);
    if (modifier.id === "fu'i") scaleExpressiveChannels(result, modifier.polarity < 0 ? 1.08 : 0.9);
    addPose(result, modifierPose(modifier), modifierAmount);
  }

  // An ending contour contributes no target pose; the UI animates from its
  // previous pose to neutral. Questions likewise do not assert an emotion.
  if (clause.contour === "end" || clause.question) return neutralPose();
  return result;
}

export function composeExpression(parsed) {
  const combined = neutralPose();
  parsed.clauses.forEach((clause, index) => {
    const priority = Math.max(0.55, 1 - index * 0.12);
    addPose(combined, expressionForClause(clause), priority);
  });

  for (const channel of SIGNED_CHANNELS) combined[channel] = clamp(combined[channel], -1, 1);
  for (const channel of UNIPOLAR_CHANNELS) combined[channel] = clamp(combined[channel], 0, 1);

  const descriptions = parsed.clauses.map(describeClause);
  const confidences = parsed.clauses
    .map((clause) => ATTITUDES[clause.root]?.confidence)
    .filter(Boolean);

  return {
    pose: combined,
    descriptions,
    confidence: confidences.includes("low") ? "low" : confidences.includes("medium") ? "medium" : confidences.length ? "high" : "none",
    empathy: parsed.clauses.some((clause) => clause.empathy),
    question: parsed.clauses.some((clause) => clause.question),
    contour: parsed.clauses.find((clause) => clause.contour)?.contour ?? null
  };
}
