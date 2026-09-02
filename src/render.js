import { neutralPose } from "./expression.js";

const $ = (id) => document.getElementById(id);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (a, b, amount) => a + (b - a) * amount;
const ease = (t) => 1 - Math.pow(1 - t, 3);

function colorForMood(valence, arousal) {
  const negative = [121, 104, 171];
  const positive = [241, 174, 86];
  const calm = [99, 191, 181];
  const emotional = valence >= 0 ? positive : negative;
  const strength = Math.abs(valence);
  const base = emotional.map((channel, index) => Math.round(mix(calm[index], channel, strength)));
  const light = clamp(0.72 + arousal * 0.12, 0.55, 0.9);
  return `rgb(${base.map((channel) => Math.round(mix(255, channel, light))).join(" ")})`;
}

export function createFaceRenderer(svg) {
  const elements = {
    head: $("head"), description: $("face-description"), auraInner: $("aura-inner"), aura: $("aura"),
    browLeft: $("brow-left"), browRight: $("brow-right"),
    eyeLeft: $("eye-left"), eyeRight: $("eye-right"), pupilLeft: $("pupil-left"), pupilRight: $("pupil-right"),
    glintLeft: $("glint-left"), glintRight: $("glint-right"), lidLeft: $("lid-left"), lidRight: $("lid-right"),
    mouth: $("mouth"), mouthOpen: $("mouth-open"), upperLip: $("upper-lip"), chin: $("chin"),
    wrinkles: $("nose-wrinkles"), blushLeft: $("blush-left"), blushRight: $("blush-right"),
    tear: $("tear"), sweat: $("sweat"), stress: $("stress-marks"), sparkles: $("sparkles"),
    shadow: $("shadow-wash"), empathy: $("empathy-echo")
  };
  let current = neutralPose();
  let frame = null;
  let lastExpression = null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function draw(p, expression) {
    const tilt = p.headTilt * 7;
    const lift = p.headLift * -7;
    elements.head.setAttribute("transform", `translate(0 ${lift.toFixed(2)}) rotate(${tilt.toFixed(2)} 310 320)`);

    const knitShift = p.browKnit * 9;
    const asymmetry = p.asymmetry * 10;
    const leftOuterY = 229 - p.browOuter * 20;
    const leftInnerY = 229 - p.browInner * 22;
    const rightInnerY = 229 - p.browInner * 22 + asymmetry;
    const rightOuterY = 229 - p.browOuter * 20 - asymmetry * 0.45;
    elements.browLeft.setAttribute("d", `M207 ${leftOuterY.toFixed(1)} Q245 ${(210 - (p.browInner + p.browOuter) * 8).toFixed(1)} ${283 + knitShift} ${leftInnerY.toFixed(1)}`);
    elements.browRight.setAttribute("d", `M${337 - knitShift} ${rightInnerY.toFixed(1)} Q375 ${(210 - (p.browInner + p.browOuter) * 8 + asymmetry * 0.3).toFixed(1)} 413 ${rightOuterY.toFixed(1)}`);

    const eyeHeight = clamp(21 + p.eyeOpen * 15 - p.lidTension * 5 - p.cheekRaise * 5, 4, 38);
    const eyeWidth = 43 - p.lidTension * 3;
    for (const [eye, cx] of [[elements.eyeLeft, 248], [elements.eyeRight, 372]]) {
      const white = eye.querySelector(".eye-white");
      white.setAttribute("rx", eyeWidth.toFixed(1));
      white.setAttribute("ry", eyeHeight.toFixed(1));
    }

    const gazeX = p.gazeX * 12;
    const gazeY = p.gazeY * 9;
    const pupilRadius = clamp(12 + p.pupil * 4, 7, 17);
    [[elements.pupilLeft, elements.glintLeft, 248], [elements.pupilRight, elements.glintRight, 372]].forEach(([pupil, glint, cx]) => {
      pupil.setAttribute("cx", (cx + gazeX).toFixed(1));
      pupil.setAttribute("cy", (282 + gazeY).toFixed(1));
      pupil.setAttribute("r", pupilRadius.toFixed(1));
      glint.setAttribute("cx", (cx + gazeX - 5).toFixed(1));
      glint.setAttribute("cy", (277 + gazeY).toFixed(1));
    });
    const lidOpacity = clamp(0.08 + p.lidTension * 0.72 + p.cheekRaise * 0.2 + Math.max(0, -p.eyeOpen) * 0.42, 0, 0.9);
    elements.lidLeft.style.opacity = lidOpacity;
    elements.lidRight.style.opacity = lidOpacity;
    elements.lidLeft.setAttribute("d", `M207 282 Q248 ${(282 - eyeHeight).toFixed(1)} 289 282`);
    elements.lidRight.setAttribute("d", `M331 282 Q372 ${(282 - eyeHeight + asymmetry * 0.25).toFixed(1)} 413 282`);

    const halfWidth = clamp(60 + p.mouthWidth * 18, 38, 79);
    const leftX = 310 - halfWidth;
    const rightX = 310 + halfWidth;
    const leftY = 395 - p.smile * 14;
    const rightY = 395 - p.smile * 14 + asymmetry * 0.55;
    const centerY = 395 + p.smile * 34;
    const open = clamp(p.mouthOpen + p.jaw * 0.35, 0, 1);
    const openDepth = 5 + open * 46;
    elements.mouth.setAttribute("d", `M${leftX.toFixed(1)} ${leftY.toFixed(1)} Q310 ${centerY.toFixed(1)} ${rightX.toFixed(1)} ${rightY.toFixed(1)}`);
    elements.mouth.style.strokeWidth = (8 + p.lipPress * 7).toFixed(1);
    elements.mouthOpen.setAttribute("d", `M${leftX.toFixed(1)} ${leftY.toFixed(1)} Q310 ${(385 - p.upperLip * 10).toFixed(1)} ${rightX.toFixed(1)} ${rightY.toFixed(1)} Q310 ${(396 + openDepth).toFixed(1)} ${leftX.toFixed(1)} ${leftY.toFixed(1)}Z`);
    elements.mouthOpen.style.opacity = clamp(open * 1.8, 0, 1);
    elements.upperLip.setAttribute("d", `M${(278 - p.upperLip * 8).toFixed(1)} 389 Q310 ${(374 - p.upperLip * 12).toFixed(1)} ${(342 + p.upperLip * 8).toFixed(1)} 389`);
    elements.upperLip.style.opacity = p.upperLip;
    elements.chin.setAttribute("d", `M283 ${(458 + p.jaw * 9).toFixed(1)} Q310 ${(468 + p.jaw * 13).toFixed(1)} 337 ${(458 + p.jaw * 9).toFixed(1)}`);

    elements.blushLeft.style.opacity = p.blush * 0.72;
    elements.blushRight.style.opacity = p.blush * 0.72;
    elements.wrinkles.style.opacity = p.noseWrinkle;
    elements.tear.style.opacity = p.tear;
    elements.sweat.style.opacity = p.sweat;
    elements.stress.style.opacity = clamp(Math.max(p.stress, p.lidTension * 0.35), 0, 1);
    elements.sparkles.style.opacity = p.sparkle;
    elements.shadow.style.opacity = p.shadow * 0.22;
    elements.empathy.querySelector("ellipse").style.opacity = expression?.empathy ? 0.72 : 0;
    elements.aura.style.opacity = clamp(0.32 + Math.abs(p.valence) * 0.25 + Math.max(0, p.arousal) * 0.12, 0.25, 0.78);
    elements.auraInner.setAttribute("stop-color", colorForMood(p.valence, p.arousal));
  }

  function setExpression(expression, { replay = false } = {}) {
    if (frame) cancelAnimationFrame(frame);
    lastExpression = expression;
    const from = replay ? neutralPose() : { ...current };
    const to = expression.pose;
    const duration = reduceMotion.matches ? 0 : expression.contour === "end" ? 1050 : expression.contour === "start" ? 850 : 480;
    const started = performance.now();
    elements.description.textContent = expression.descriptions.length
      ? `A cartoon rendering of ${expression.descriptions.join(", then ")}.`
      : "A neutral cartoon face.";

    const tick = (now) => {
      const progress = duration === 0 ? 1 : clamp((now - started) / duration, 0, 1);
      const eased = ease(progress);
      current = Object.fromEntries(Object.keys(to).map((channel) => [channel, mix(from[channel] ?? 0, to[channel], eased)]));
      draw(current, expression);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else frame = null;
    };
    frame = requestAnimationFrame(tick);
  }

  draw(current, null);
  return { setExpression, replay: () => lastExpression && setExpression(lastExpression, { replay: true }) };
}
