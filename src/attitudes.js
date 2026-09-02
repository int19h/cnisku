const pose = (values) => Object.freeze(values);

const joy = pose({ smile: 0.9, cheekRaise: 0.75, eyeOpen: -0.2, mouthOpen: 0.18, valence: 1, arousal: 0.35, warmth: 0.75 });
const sadness = pose({ smile: -0.78, browInner: 0.7, browOuter: -0.18, gazeY: 0.28, eyeOpen: -0.18, tear: 0.24, valence: -0.95, arousal: -0.18, warmth: 0.15 });
const surprise = pose({ browInner: 0.95, browOuter: 0.95, eyeOpen: 0.95, mouthOpen: 0.82, jaw: 0.62, pupil: -0.12, arousal: 0.95, sparkle: 0.3 });
const focus = pose({ browInner: -0.18, browOuter: -0.1, browKnit: 0.36, eyeOpen: 0.2, lidTension: 0.28, mouthOpen: 0.02, arousal: 0.25 });
const confusion = pose({ browInner: 0.35, browOuter: 0.12, browKnit: 0.35, eyeOpen: 0.16, asymmetry: 0.72, headTilt: 0.58, mouthOpen: 0.12, valence: -0.12 });
const anger = pose({ browInner: -0.82, browOuter: -0.66, browKnit: 0.9, eyeOpen: -0.12, lidTension: 0.94, smile: -0.28, mouthWidth: 0.24, lipPress: 0.7, noseWrinkle: 0.25, arousal: 0.9, dominance: 0.88, valence: -0.78, stress: 0.35 });
const fear = pose({ browInner: 0.82, browOuter: 0.46, browKnit: 0.66, eyeOpen: 0.9, mouthOpen: 0.58, mouthWidth: 0.58, pupil: -0.15, headLift: -0.22, sweat: 0.55, arousal: 1, dominance: -0.78, valence: -0.72 });
const calm = pose({ eyeOpen: -0.34, smile: 0.17, mouthWidth: -0.12, browInner: 0.08, headLift: 0.08, valence: 0.36, arousal: -0.82, warmth: 0.25 });
const stress = pose({ browInner: -0.18, browOuter: 0.25, browKnit: 0.58, eyeOpen: 0.24, lidTension: 0.66, smile: -0.35, mouthWidth: 0.4, lipPress: 0.34, sweat: 0.55, stress: 0.88, arousal: 0.72, valence: -0.58 });
const disgust = pose({ browInner: -0.32, eyeOpen: -0.48, noseWrinkle: 0.95, upperLip: 0.86, smile: -0.28, headTilt: -0.12, valence: -0.82, dominance: 0.18 });
const confidence = pose({ browInner: -0.08, eyeOpen: -0.16, smile: 0.3, lipPress: 0.2, headLift: 0.56, dominance: 0.9, valence: 0.4, arousal: 0.16 });
const shame = pose({ browInner: 0.5, browOuter: -0.24, eyeOpen: -0.32, gazeX: 0.45, gazeY: 0.45, headLift: -0.64, blush: 0.68, smile: -0.32, valence: -0.65, dominance: -0.85 });
const affection = pose({ smile: 0.68, cheekRaise: 0.5, eyeOpen: -0.38, pupil: 0.5, headTilt: 0.25, blush: 0.35, valence: 0.9, warmth: 1, arousal: 0.08 });
const fatigue = pose({ browInner: 0.08, browOuter: -0.45, eyeOpen: -0.72, gazeY: 0.36, smile: -0.2, mouthOpen: 0.3, jaw: 0.2, headLift: -0.46, arousal: -0.9, valence: -0.32 });
const concern = pose({ browInner: 0.66, browOuter: -0.12, browKnit: 0.25, eyeOpen: 0.18, smile: -0.3, headTilt: 0.2, warmth: 0.82, valence: -0.25 });

const entries = [
  // Immediate and complex emotions (CLL 13.2)
  ["ua", "discovery", "no discovery or confusion", "confusion", { ...surprise, mouthOpen: 0.42, valence: 0.35 }, confusion, "high", "u-series"],
  ["u'a", "gain", "neither gain nor loss", "loss", { ...joy, smile: 0.55, dominance: 0.4 }, { ...sadness, tear: 0.08 }, "medium", "u-series"],
  ["ue", "surprise", "no surprise", "expectation", surprise, { ...focus, eyeOpen: 0.1, valence: 0.12 }, "high", "u-series"],
  ["u'e", "wonder", "commonplace", "commonplace", { ...surprise, mouthOpen: 0.3, sparkle: 0.9, valence: 0.6 }, { ...calm, eyeOpen: -0.52, smile: 0, valence: 0 }, "high", "u-series"],
  ["ui", "happiness", "neither happiness nor unhappiness", "unhappiness", joy, sadness, "high", "u-series"],
  ["u'i", "amusement", "neither amused nor weary", "weariness", { ...joy, asymmetry: 0.3, mouthOpen: 0.36 }, fatigue, "high", "u-series"],
  ["uo", "completion", "neither complete nor incomplete", "incompleteness", { ...calm, smile: 0.46, arousal: -0.35 }, { ...stress, browKnit: 0.42, arousal: 0.36 }, "medium", "u-series"],
  ["u'o", "courage", "timidity", "cowardice", confidence, fear, "medium", "u-series"],
  ["uu", "pity", "neither pity nor cruelty", "cruelty", concern, { eyeOpen: -0.45, smile: 0.35, asymmetry: 0.55, headLift: 0.28, warmth: -0.85, valence: -0.45, dominance: 0.55 }, "medium", "u-series"],
  ["u'u", "repentance", "lack of regret", "innocence", { ...shame, tear: 0.18 }, { eyeOpen: 0.25, browInner: 0.18, smile: 0.12, headLift: 0.18, valence: 0.18 }, "medium", "u-series"],

  ["o'a", "pride", "modesty", "shame", { ...confidence, smile: 0.48, headLift: 0.78 }, shame, "high", "o-series"],
  ["o'e", "closeness", "detachment", "distance", affection, { eyeOpen: -0.3, gazeX: 0.62, headTilt: -0.2, smile: -0.08, warmth: -0.9, valence: -0.15 }, "medium", "o-series"],
  ["oi", "pain or complaint", "doing OK", "pleasure", { ...stress, eyeOpen: -0.58, mouthOpen: 0.66, smile: -0.65, tear: 0.4, valence: -1 }, { ...joy, eyeOpen: -0.5, smile: 0.72, arousal: -0.05 }, "high", "o-series"],
  ["o'i", "caution", "boldness", "rashness", { ...fear, eyeOpen: 0.5, mouthOpen: 0.12, dominance: -0.2 }, { ...confidence, eyeOpen: 0.4, mouthOpen: 0.35, arousal: 0.75 }, "medium", "o-series"],
  ["o'o", "patience", "mere tolerance", "anger", calm, anger, "high", "o-series"],
  ["o'u", "relaxation", "composure", "stress", calm, stress, "high", "o-series"],

  ["ii", "fear", "nervousness", "security", fear, confidence, "high", "i-series emotions"],
  ["i'i", "togetherness", "neither togetherness nor privacy", "privacy", affection, { eyeOpen: -0.32, gazeX: 0.72, headTilt: -0.22, warmth: -0.45, dominance: -0.05 }, "medium", "i-series emotions"],
  ["io", "respect", "neither respect nor disrespect", "disrespect", { browInner: 0.32, eyeOpen: 0.1, smile: 0.14, headLift: -0.28, dominance: -0.32, warmth: 0.3 }, { eyeOpen: -0.55, gazeY: -0.3, smile: 0.28, asymmetry: 0.72, headLift: 0.35, dominance: 0.55, warmth: -0.5 }, "medium", "i-series emotions"],
  ["i'o", "appreciation", "neither appreciation nor envy", "envy", { ...affection, smile: 0.52, warmth: 0.64 }, { browInner: -0.2, browKnit: 0.4, eyeOpen: -0.28, gazeX: 0.55, smile: -0.22, asymmetry: 0.45, valence: -0.55, warmth: -0.28 }, "medium", "i-series emotions"],
  ["iu", "love", "no love lost", "hatred", affection, { ...anger, noseWrinkle: 0.48, warmth: -1, valence: -1 }, "high", "i-series emotions"],
  ["i'u", "familiarity", "neither familiar nor mysterious", "mystery", { eyeOpen: -0.15, smile: 0.28, headTilt: 0.08, warmth: 0.35, arousal: -0.18 }, { ...confusion, eyeOpen: 0.5, sparkle: 0.35 }, "medium", "i-series emotions"],

  // Propositional attitudes (CLL 13.3, modern directive e-series)
  ["a'a", "attentiveness", "inattentiveness", "avoidance", { ...focus, eyeOpen: 0.38 }, { eyeOpen: -0.36, gazeX: 0.8, headTilt: -0.2, valence: -0.15 }, "medium", "personal stance"],
  ["a'e", "alertness", "neither alert nor exhausted", "exhaustion", { ...focus, eyeOpen: 0.72, arousal: 0.72 }, fatigue, "high", "personal stance"],
  ["ai", "intent", "indecision", "unintentionality", { ...confidence, browKnit: 0.24, eyeOpen: 0.2, smile: 0.08 }, { eyeOpen: 0.1, gazeX: 0.5, asymmetry: 0.35, headTilt: 0.42, dominance: -0.4 }, "medium", "personal stance"],
  ["a'i", "effort", "no real effort", "repose", { ...stress, mouthOpen: 0.24, dominance: 0.15, valence: 0 }, calm, "high", "personal stance"],
  ["a'o", "hope", "neither hope nor despair", "despair", { ...affection, browInner: 0.5, eyeOpen: 0.24, gazeY: -0.28, sparkle: 0.55 }, { ...sadness, tear: 0.55, headLift: -0.55, arousal: -0.7 }, "high", "personal stance"],
  ["au", "desire", "indifference", "reluctance", { pupil: 0.45, eyeOpen: 0.28, smile: 0.3, mouthOpen: 0.14, headTilt: 0.12, warmth: 0.35, arousal: 0.4 }, { browInner: 0.32, eyeOpen: -0.25, gazeX: 0.42, smile: -0.3, headTilt: -0.25, valence: -0.38 }, "medium", "personal stance"],
  ["a'u", "interest", "no interest", "repulsion", { ...focus, eyeOpen: 0.48, pupil: 0.35, headTilt: 0.28, valence: 0.32 }, disgust, "high", "personal stance"],

  ["e'a", "permission", "neither permission nor prohibition", "prohibition", { smile: 0.22, browInner: 0.12, headTilt: 0.12, valence: 0.22, dominance: 0.15 }, { ...anger, mouthOpen: 0.15, lipPress: 0.78, dominance: 0.82 }, "low", "directive stance"],
  ["e'e", "exhortation", "neither exhortation nor discouragement", "discouragement", { ...confidence, smile: 0.55, eyeOpen: 0.35, arousal: 0.62, warmth: 0.4 }, { ...concern, smile: -0.4, gazeY: 0.25 }, "medium", "directive stance"],
  ["ei", "obligation", "neither obligation nor freedom", "freedom", { ...focus, browKnit: 0.55, lipPress: 0.48, valence: -0.08 }, { ...calm, smile: 0.52, headLift: 0.3, valence: 0.65 }, "low", "directive stance"],
  ["e'i", "command", "neither command nor release", "release from command", { ...anger, smile: 0, mouthOpen: 0.28, headLift: 0.72, dominance: 1 }, { ...calm, smile: 0.35, dominance: -0.1, warmth: 0.25 }, "medium", "directive stance"],
  ["e'o", "request", "neither request nor offer", "offer", { ...concern, smile: 0.12, browInner: 0.82, headTilt: 0.28, dominance: -0.72 }, { ...affection, eyeOpen: 0.12, headTilt: -0.15, dominance: 0.15 }, "medium", "directive stance"],
  ["e'u", "suggestion", "no suggestion", "warning", { ...focus, browInner: 0.18, smile: 0.2, headTilt: 0.18, warmth: 0.18 }, { ...fear, mouthOpen: 0.18, dominance: 0.15 }, "medium", "directive stance"],

  ["ia", "belief", "skepticism", "disbelief", { eyeOpen: -0.12, smile: 0.14, lipPress: 0.22, headLift: 0.18, dominance: 0.34 }, { ...confusion, browInner: 0.6, asymmetry: 0.8, valence: -0.2 }, "low", "evaluative stance"],
  ["i'a", "acceptance", "neither acceptance nor refusal", "refusal or blame", { ...calm, smile: 0.32, warmth: 0.35 }, { ...anger, mouthOpen: 0.1, gazeX: 0.1, dominance: 0.55 }, "medium", "evaluative stance"],
  ["ie", "agreement", "neither agreement nor disagreement", "disagreement", { smile: 0.3, eyeOpen: -0.08, headLift: 0.2, valence: 0.32, warmth: 0.2 }, { browInner: -0.32, browKnit: 0.45, eyeOpen: 0.22, smile: -0.2, headTilt: 0.44, valence: -0.36 }, "low", "evaluative stance"],
  ["i'e", "approval", "non-approval", "disapproval", { ...joy, smile: 0.58, dominance: 0.2 }, { ...disgust, browKnit: 0.3, dominance: 0.35 }, "high", "evaluative stance"]
];

export const ATTITUDES = Object.freeze(Object.fromEntries(entries.map(([id, positive, neutral, negative, positivePose, negativePose, confidence, group]) => [
  id,
  Object.freeze({ id, positive, neutral, negative, positivePose: pose(positivePose), negativePose: pose(negativePose), confidence, group })
])));

const modifiers = [
  ["ro'a", "social", "asocial", "antisocial", { gazeY: 0.12, blush: 0.35, warmth: 0.2 }, { gazeX: 0.56, eyeOpen: -0.22, warmth: -0.5 }, "category"],
  ["ro'e", "mental", "neither mental nor mindless", "mindless", { browKnit: 0.38, eyeOpen: 0.2 }, { eyeOpen: -0.38, gazeX: 0.28, arousal: -0.25 }, "category"],
  ["ro'i", "emotional", "neither emotional nor emotion-denying", "denying emotion", { arousal: 0.3, warmth: 0.2 }, { eyeOpen: -0.2, lipPress: 0.45, arousal: -0.3 }, "category"],
  ["ro'o", "physical", "neither physical nor physical-denying", "denying physical", { lidTension: 0.24, mouthOpen: 0.12, stress: 0.2 }, { lipPress: 0.3, arousal: -0.2 }, "category"],
  ["ro'u", "sexual", "neither sexual nor abstinent", "sexual abstinence", { blush: 0.5, pupil: 0.25, warmth: 0.32 }, { gazeX: 0.3, lipPress: 0.2, warmth: -0.18 }, "category"],
  ["re'e", "spiritual", "secular", "sacrilegious", { sparkle: 0.42, gazeY: -0.2 }, { asymmetry: 0.28, dominance: 0.2 }, "category"],
  ["ga'i", "hauteur or higher rank", "equal rank", "meekness or lower rank", { headLift: 0.7, eyeOpen: -0.28, dominance: 0.72 }, { headLift: -0.62, browInner: 0.3, dominance: -0.66 }, "modifier"],
  ["le'o", "aggressive", "passive", "defensive", { browInner: -0.5, browKnit: 0.55, lidTension: 0.5, headLift: 0.3, dominance: 0.75 }, { browInner: 0.42, eyeOpen: 0.48, headLift: -0.52, dominance: -0.68 }, "modifier"],
  ["vu'e", "virtuous", "neither virtuous nor sinful", "sinful", { headLift: 0.34, smile: 0.16, sparkle: 0.2 }, { gazeY: 0.3, asymmetry: 0.28, shadow: 0.3 }, "modifier"],
  ["se'i", "self-oriented", "neither self- nor other-oriented", "other-oriented", { gazeY: 0.3, headTilt: -0.12 }, { gazeX: 0.38, headTilt: 0.2, warmth: 0.25 }, "modifier"],
  ["ri'e", "released", "neither released nor controlled", "controlled", { mouthOpen: 0.3, arousal: 0.35 }, { lipPress: 0.62, mouthOpen: -0.25, arousal: -0.12 }, "modifier"],
  ["fu'i", "easy or helped", "neither helped nor opposed", "difficult or opposed", { browKnit: -0.25, stress: -0.3, smile: 0.18 }, { browKnit: 0.45, lidTension: 0.35, sweat: 0.42, stress: 0.55 }, "modifier"],
  ["be'u", "lack or need", "presence or satisfaction", "satiation", { pupil: 0.25, browInner: 0.35, mouthOpen: 0.14 }, { eyeOpen: -0.28, cheekRaise: 0.2, smile: 0.24, arousal: -0.35 }, "modifier"],
  ["se'a", "self-sufficient", "neither self-sufficient nor dependent", "dependent", { headLift: 0.45, dominance: 0.58, lipPress: 0.18 }, { browInner: 0.52, headLift: -0.35, dominance: -0.6, warmth: 0.2 }, "modifier"]
];

export const MODIFIERS = Object.freeze(Object.fromEntries(modifiers.map(([id, positive, neutral, negative, positivePose, negativePose, kind]) => [
  id,
  Object.freeze({ id, positive, neutral, negative, positivePose: pose(positivePose), negativePose: pose(negativePose), kind })
])));

export const ATTITUDE_GROUPS = Object.freeze([
  ["u-series", "Immediate emotions"],
  ["o-series", "Complex emotions"],
  ["i-series emotions", "Relational emotions"],
  ["personal stance", "Personal stance"],
  ["directive stance", "Directive stance"],
  ["evaluative stance", "Evaluative stance"]
]);

export const INTENSITIES = Object.freeze({
  "cai": { amount: 1, label: "intense" },
  "sai": { amount: 0.68, label: "strong" },
  "ru'e": { amount: 0.3, label: "weak" },
  "cu'i": { amount: 0, label: "neutral" }
});

export const DEFAULT_INTENSITY = 0.58;

export const formatCmavo = (id) => /^[aeiou]/.test(id) ? `.${id}` : id;
