import { ATTITUDES, ATTITUDE_GROUPS, formatCmavo } from "./attitudes.js";
import { composeExpression } from "./expression.js";
import { parseIndicators } from "./parser.js";
import { createFaceRenderer } from "./render.js";
import { expressionFromUrl, relativeUrl, urlWithExpression } from "./share.js";

const input = document.getElementById("attitude-input");
const inputWrap = document.querySelector(".input-wrap");
const diagnostics = document.getElementById("diagnostics");
const interpretation = document.getElementById("interpretation");
const confidence = document.getElementById("confidence");
const confidenceNote = document.getElementById("confidence-note");
const caption = document.getElementById("face-caption");
const copyLink = document.getElementById("copy-link");
const shareIcon = document.getElementById("share-icon");
const shareStatus = document.getElementById("share-status");
const renderer = createFaceRenderer(document.getElementById("face"));
const defaultExpression = input.value;
const sharedExpression = expressionFromUrl(window.location.href);
if (sharedExpression !== null) input.value = sharedExpression;

function update({ syncUrl = true } = {}) {
  const parsed = parseIndicators(input.value);
  const expression = composeExpression(parsed);
  const errors = parsed.diagnostics.filter(({ level }) => level === "error");

  inputWrap.classList.toggle("has-error", errors.length > 0);
  diagnostics.replaceChildren(...parsed.diagnostics.map(({ message }) => {
    const p = document.createElement("p");
    p.textContent = message;
    return p;
  }));

  interpretation.replaceChildren(...expression.descriptions.map((description) => {
    const chip = document.createElement("span");
    chip.className = "meaning-chip";
    chip.textContent = description;
    return chip;
  }));

  confidence.textContent = expression.confidence === "none" ? "" : `${expression.confidence} facial legibility`;
  confidenceNote.hidden = expression.confidence !== "low";
  caption.textContent = expression.descriptions.length ? expression.descriptions.join(" + ") : "Waiting for an attitude";
  renderer.setExpression(expression);

  if (syncUrl) {
    const url = urlWithExpression(window.location.href, input.value);
    window.history.replaceState(null, "", relativeUrl(url));
  }
}

function renderReference() {
  const container = document.getElementById("attitude-groups");
  ATTITUDE_GROUPS.forEach(([groupId, title], groupIndex) => {
    const roots = Object.values(ATTITUDES).filter(({ group }) => group === groupId);
    const details = document.createElement("details");
    details.className = "attitude-group";
    if (groupIndex === 0) details.open = true;

    const summary = document.createElement("summary");
    const count = document.createElement("span");
    count.className = "group-count";
    count.textContent = roots.length;
    summary.append(count, title);

    const list = document.createElement("div");
    list.className = "scale-list";
    roots.forEach((root) => {
      const item = document.createElement("div");
      item.className = "scale-item";
      const code = document.createElement("code");
      code.textContent = formatCmavo(root.id);
      const poles = document.createElement("span");
      poles.textContent = `${root.positive} ↔ ${root.negative}`;
      item.append(code, poles);
      list.append(item);
    });

    details.append(summary, list);
    container.append(details);
  });
}

document.getElementById("examples").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-expression]");
  if (!button) return;
  input.value = button.dataset.expression;
  update();
  input.focus();
});

document.getElementById("replay").addEventListener("click", () => renderer.replay());
copyLink.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    shareIcon.setAttribute("d", "M5 12.5l4.3 4.3L19 7");
    copyLink.setAttribute("aria-label", "Link copied");
    shareStatus.textContent = "Share link copied to the clipboard.";
    window.setTimeout(() => {
      shareIcon.setAttribute("d", "M9.5 14.5l5-5M7 17l-1.5 1.5a3.5 3.5 0 0 1-5-5L4 10a3.5 3.5 0 0 1 5 0M17 7l1.5-1.5a3.5 3.5 0 0 1 5 5L20 14a3.5 3.5 0 0 1-5 0");
      copyLink.setAttribute("aria-label", "Copy share link");
      shareStatus.textContent = "";
    }, 1600);
  } catch {
    shareStatus.textContent = "The link is ready in the address bar, but clipboard access was unavailable.";
  }
});
input.addEventListener("input", update);
window.addEventListener("popstate", () => {
  input.value = expressionFromUrl(window.location.href) ?? defaultExpression;
  update({ syncUrl: false });
});

renderReference();
update();
