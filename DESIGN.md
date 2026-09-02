# How cnisku turns attitudinals into a face

This document describes the interesting part of `cnisku`: the path from a short Lojban indicator string to a moving SVG face. It is both an explanation of the current implementation and a guide for changing it without accidentally confusing Lojban semantics with an artistic rendering convention.

The short version is:

```text
indicator text
    → a small, purpose-built token stream
    → ordered semantic clauses
    → independently authored endpoint recipes
    → intensity and modifier transforms
    → one bounded 29-channel pose
    → parametric SVG geometry
```

There is no trained model, image generator, hidden classifier, or full Lojban parser. Every step is deterministic and inspectable.

## 1. Design goals

The implementation is organized around five goals:

1. **Preserve the shape of the attitudinal system.** CLL describes many independent scales, not a small set of mutually exclusive basic emotions.
2. **Keep language meaning separate from facial convention.** A Lojban pole such as expectation is semantic; the focused eyes chosen to draw it are editorial.
3. **Make mixtures possible.** `.ii .iinai` must remain fear plus security, not be simplified to zero before rendering.
4. **Make every mapping easy to inspect and tune.** The 39 roots and 14 category/modifier words live in ordinary JavaScript data.
5. **Remain a static site.** Parsing, composition, animation, and URL sharing all run locally in the browser with no dependencies or build step.

The project is not trying to infer what a real speaker's face must look like. Facial expression is culturally variable, many attitudinals are not primarily emotions, and even familiar emotions do not determine a unique face. The result is intentionally a legible cartoon interpretation.

## 2. The semantic model taken from CLL

The primary source model is Chapter 13 of *The Complete Lojban Language*.

### 2.1 Thirty-nine independent scales

Each attitudinal root names a scale with a conventionally “positive” pole, a midpoint, and a conventionally “negative” pole. `nai` selects the opposite pole. The quotation marks matter: fear (`.ii`) and pain (`.oi`) are on the short, non-`nai` side of their scales, so positive here does not mean pleasant or morally good.

The implementation does **not** represent the negative pole by multiplying the positive pose by `-1`. The endpoints often have different structures:

- `.ue` surprise uses raised brows, wide eyes, and an open mouth.
- `.uenai` expectation uses a quieter focused pose.
- `.oi` pain uses tension, eye closure, an open mouth, and a possible tear.
- `.oinai` pleasure uses a smile, cheek raising, and softened eyes.

Every entry in `ATTITUDES` therefore has a separate `positivePose` and `negativePose`.

### 2.2 CAI strength

CLL specifies seven ordered positions: three strengths on each side and the midpoint. It does not say that the positions are equally spaced numerical measurements. `cnisku` needs numbers to interpolate a picture, so [`src/attitudes.js`](src/attitudes.js) adopts these display values:

| CAI form | Display magnitude |
| --- | ---: |
| `cai` | `1.00` |
| `sai` | `0.68` |
| `ru'e` | `0.30` |
| `cu'i` | `0.00` |
| no CAI word | `0.58` |

Polarity and magnitude are kept separate. For example, `.uinairu'e` selects the unhappiness recipe at magnitude `0.30`.

The `0.58` unmarked value is a UI convention. An unmarked `.ui` has unspecified strength in CLL; it does not semantically mean 58% happiness. A moderate default lets the face show something without claiming that CLL supplied a number.

`cu'i` contributes no displacement from the neutral face. Some CLL midpoint glosses—timidity, composure, skepticism, and so on—are more suggestive than “nothing,” but a single consistent zero contribution is the least surprising interpolation rule. The textual reading still displays the relevant midpoint gloss.

### 2.3 Compounds and order

CLL treats compound indicators as additive and says the first expressed attitude is presumed most important. The parser consequently preserves an ordered list of clauses rather than choosing one winning emotion.

Rendering uses the following display-priority weights:

```text
first clause   1.00
second         0.88
third          0.76
fourth         0.64
later clauses  0.55
```

This weighting is a visual policy for resolving limited facial bandwidth, not an additional claim about Lojban meaning.

Opposite feelings are never collapsed in the semantic layer. With `.ii .iinai`, the fear recipe can retain widened eyes while the security recipe contributes lifted posture and composure. Channels that directly oppose one another can still partially cancel during the final geometric blend; see [Limitations](#11-limitations-and-known-losses).

### 2.4 Categories and modifiers

The six `roV`/`re'e` category words and eight attitudinal modifiers are stored separately from the 39 roots. They normally color the preceding root rather than start an unrelated primary expression. Thus `.o'unairo'a` is represented as stress modified toward the social domain, yielding stress plus gaze/blush cues associated with embarrassment.

A modifier can also appear by itself. The parser represents that with the unspecified root `ge'e`, allowing a pose such as standalone controlledness (`ri'enai`) without inventing a base emotion.

## 3. Architecture and files

| File | Responsibility |
| --- | --- |
| [`src/attitudes.js`](src/attitudes.js) | Glosses, endpoint recipes, modifier recipes, confidence labels, and CAI magnitudes |
| [`src/parser.js`](src/parser.js) | Enumerative tokenization, local attachment, clause construction, and human-readable descriptions |
| [`src/expression.js`](src/expression.js) | Endpoint selection, intensity scaling, modifier transforms, clause mixing, and bounds |
| [`src/render.js`](src/render.js) | Conversion of a pose into SVG path/shape attributes and animated transitions |
| [`src/app.js`](src/app.js) | DOM wiring, reference list, examples, diagnostics, and clipboard behavior |
| [`src/share.js`](src/share.js) | Exact input round-tripping through the `q` URL parameter |
| [`index.html`](index.html) | Neutral SVG drawing and application markup |

The semantic modules do not depend on the DOM. This is why parsing and composition can be tested directly under Node.

## 4. The deliberately small parser

The input language is a finite subset. The tokenizer builds a longest-first list from:

- all 39 attitudinal roots;
- the 14 category/modifier words;
- `cai`, `sai`, `ru'e`, and `cu'i`;
- `nai`, `ge'e`, `bu'o`, `dai`, and `pei`.

It lowercases input, normalizes curly apostrophes, skips pause dots and common separators, and repeatedly matches the longest valid token at the current position. This handles both `.o'onaicai ri'enai` and `o'o nai cai ri'e nai` without using general Lojban morphology or grammar. Unmatched text produces diagnostics rather than being silently accepted.

The useful conceptual grammar is:

```text
stream       := clause*
clause       := root polarity? intensity? modifier* contour? empathy? question?
modifier     := modifier-root polarity? intensity?
polarity     := nai
intensity    := cai | sai | ru'e | cu'i
contour      := bu'o | bu'ocu'i | bu'onai
empathy      := dai
question     := pei
```

The actual parser is intentionally a little forgiving:

- Every primary root starts a new clause.
- A category/modifier attaches to the current clause.
- CAI attaches to the most recently seen scalable root or modifier.
- `nai` flips the immediately preceding scalable root or modifier.
- `bu'o`, `bu'ocu'i`, and `bu'onai` mean start, continue, and end.
- `dai` marks the clause as empathetically attributed.
- `pei` after a clause questions it; prefix `pei` is held until the following root.
- A modifier or intensity with no root creates an implicit `ge'e` clause.

`nai` applied directly to a CAI word is recognized but deliberately not assigned a face interpretation. The UI recommends putting `nai` immediately after the root or modifier, which covers the canonical seven-position forms needed here.

For example:

```text
.o'onaicai ri'enaisai .uiru'e
```

becomes conceptually:

```js
[
  {
    root: "o'o",
    polarity: -1,
    intensity: "cai",
    modifiers: [
      { id: "ri'e", polarity: -1, intensity: "sai" }
    ]
  },
  {
    root: "ui",
    polarity: 1,
    intensity: "ru'e",
    modifiers: []
  }
]
```

That structure reads as intense anger, strongly controlled, plus weak happiness.

## 5. The 29-channel face rig

A recipe is a sparse object whose keys are rig channels and whose values normally lie between `-1` and `1`. Missing keys mean no contribution. The composer expands sparse recipes into a complete neutral pose.

### 5.1 Signed channels

Signed channels can move in either direction and are clamped to `[-1, 1]` after composition.

| Channel | Negative direction | Positive direction | Current projection |
| --- | --- | --- | --- |
| `browInner` | inner brow lowered | inner brow raised | brow endpoint Y and curve |
| `browOuter` | outer brow lowered | outer brow raised | brow endpoint Y and curve |
| `eyeOpen` | narrowed/closed | widened | eye ellipse height |
| `pupil` | smaller | larger | pupil radius |
| `gazeX` | leftward convention | rightward convention | pupil X offset |
| `gazeY` | upward | downward | pupil Y offset |
| `smile` | corners down | corners up | mouth corners and center curve |
| `mouthWidth` | narrower | wider | mouth half-width |
| `headTilt` | counterclockwise | clockwise | head-group rotation |
| `headLift` | lowered/tucked | raised | vertical head translation |
| `valence` | unpleasant | pleasant | aura hue |
| `arousal` | subdued | activated | aura color strength/opacity |
| `dominance` | submissive | dominant | latent; recipes usually also set head/brow channels |
| `warmth` | distancing | affiliative | latent; recipes usually also set gaze/smile/blush |

`dominance` and `warmth` are retained as useful semantic-display dimensions but are not presently projected directly by `draw()`. They make the recipes clearer and leave room for later posture, color, or multi-character rendering without changing the data format.

### 5.2 Unipolar channels

Unipolar channels describe activations. They are clamped to `[0, 1]` after composition. A negative value in a modifier recipe can reduce an activation accumulated earlier, but the final value cannot fall below zero.

| Channel | Effect |
| --- | --- |
| `browKnit` | moves inner brow endpoints toward the center |
| `lidTension` | narrows eyes, reduces eye width, strengthens lid lines |
| `cheekRaise` | narrows the eyes from below and strengthens lid definition |
| `noseWrinkle` | reveals wrinkle strokes beside the nose |
| `mouthOpen` | opens the filled mouth interior |
| `lipPress` | thickens the mouth stroke |
| `upperLip` | reveals and raises a separate upper-lip curve |
| `jaw` | deepens mouth opening and lowers the chin curve |
| `asymmetry` | offsets the right brow, lid, and mouth corner |
| `blush` | reveals blurred cheek color |
| `tear` | reveals a tear beside the left eye |
| `sweat` | reveals a sweat drop near the right temple |
| `stress` | reveals radiating stress marks |
| `sparkle` | reveals surrounding sparkle marks |
| `shadow` | overlays a subdued purple face wash |

The rig is FACS-inspired in the loose sense that visible components are independently controllable, but it is not a FACS implementation and the channel names are not Action Unit claims.

## 6. Endpoint recipes for the 39 scales

The following table is the human-readable map. Exact coefficients live in `ATTITUDES`; the descriptions below explain the visual strategy rather than repeating every number.

### 6.1 Immediate emotions: the u-series

| Root | Positive → midpoint → negative | Visual strategy | Legibility |
| --- | --- | --- | --- |
| `.ua` | discovery → neutral → confusion | Discovery borrows a restrained surprise pose; confusion knits and asymmetrically raises brows with a head tilt. | high |
| `.u'a` | gain → neutral → loss | Gain uses a confident smile; loss uses subdued sadness. | medium |
| `.ue` | surprise → no surprise → expectation | Surprise maximizes brows, eyes, and jaw; expectation uses quiet focus rather than an inverse surprise. | high |
| `.u'e` | wonder → commonplace → commonplace | Wonder adds wide-eyed surprise and sparkles; commonplace uses a low-arousal flat pose. | high |
| `.ui` | happiness → neutral → unhappiness | Happiness combines smile, cheek raise, and softened eyes; unhappiness combines a frown, raised inner brows, downward gaze, and possible tear. | high |
| `.u'i` | amusement → neutral → weariness | Amusement is an asymmetric, open smile; weariness droops lids, gaze, mouth, and head. | high |
| `.uo` | completion → neutral → incompleteness | Completion resembles mild relief; incompleteness resembles restrained stress and unresolved focus. | medium |
| `.u'o` | courage → timidity → cowardice | Courage uses lifted, confident posture; cowardice uses the fear basis. | medium |
| `.uu` | pity → neutral → cruelty | Pity uses concern and warmth; cruelty uses narrowed eyes, an asymmetric smile, and distancing warmth. | medium |
| `.u'u` | repentance → lack of regret → innocence | Repentance uses shame plus a tear; innocence uses open eyes and mild composure. | medium |

### 6.2 Complex emotions: the o-series

| Root | Positive → midpoint → negative | Visual strategy | Legibility |
| --- | --- | --- | --- |
| `.o'a` | pride → modesty → shame | Pride strengthens the confidence pose and raises the head; shame averts and lowers gaze with blush. | high |
| `.o'e` | closeness → detachment → distance | Closeness uses the affection basis; distance averts gaze and cools the pose. | medium |
| `.oi` | pain/complaint → doing OK → pleasure | Pain closes tense eyes, opens a distressed mouth, and may tear; pleasure uses softened joy. | high |
| `.o'i` | caution → boldness → rashness | Caution is a restrained fear/wary pose; rashness combines confidence with high arousal. | medium |
| `.o'o` | patience → tolerance → anger | Patience uses low-arousal calm; anger strongly knits/lower brows, tenses lids, and presses lips. | high |
| `.o'u` | relaxation → composure → stress | Relaxation uses calm; stress combines brow uncertainty, lid tension, pressed lips, sweat, and stress marks. | high |

### 6.3 Relational and remaining pure emotions: the i-series

| Root | Positive → midpoint → negative | Visual strategy | Legibility |
| --- | --- | --- | --- |
| `.ii` | fear → nervousness → security | Fear uses wide eyes, contracted raised brows, an open stretched mouth, and sweat; security uses confidence. | high |
| `.i'i` | togetherness → neutral → privacy | Togetherness uses affection; privacy averts and softens gaze with reduced warmth. | medium |
| `.io` | respect → neutral → disrespect | Respect lowers posture and softens attention; disrespect narrows/rolls the gaze and adds an asymmetric smirk. | medium |
| `.i'o` | appreciation → neutral → envy | Appreciation uses warm affection; envy uses side gaze, knit brows, and an asymmetric frown. | medium |
| `.iu` | love → no love lost → hatred | Love uses affection, large pupils, blush, and warmth; hatred intensifies anger, nose wrinkle, and distance. | high |
| `.i'u` | familiarity → neutral → mystery | Familiarity is relaxed and mildly warm; mystery uses curiosity/confusion with a sparkle cue. | medium |

### 6.4 Personal stance: the a-series

| Root | Positive → midpoint → negative | Visual strategy | Legibility |
| --- | --- | --- | --- |
| `.a'a` | attentiveness → inattentiveness → avoidance | Attention uses focused open eyes; avoidance turns the gaze away and slightly withdraws the head. | medium |
| `.a'e` | alertness → neutral → exhaustion | Alertness opens focused eyes with higher arousal; exhaustion uses the fatigue basis. | high |
| `.ai` | intent → indecision → unintentionality | Intent uses steady confidence and focus; unintentionality uses wandering gaze, asymmetry, and head tilt. | medium |
| `.a'i` | effort → no real effort → repose | Effort uses muscular stress without negative valence; repose uses calm. | high |
| `.a'o` | hope → neutral → despair | Hope combines affection, raised inner brows, upward gaze, and sparkle; despair strengthens sadness and withdrawal. | high |
| `.au` | desire → indifference → reluctance | Desire enlarges pupils and approaches with a slight open smile; reluctance averts gaze and withdraws. | medium |
| `.a'u` | interest → no interest → repulsion | Interest uses focused eyes, pupil enlargement, and head tilt; repulsion uses the disgust basis. | high |

### 6.5 Directive stance: the e-series

The project follows the modern directive interpretation used by the CLL edition consulted for the implementation. Older frozen word lists assign different glosses to some members, especially `.e'e` and `.e'i`.

| Root | Positive → midpoint → negative | Visual strategy | Legibility |
| --- | --- | --- | --- |
| `.e'a` | permission → neutral → prohibition | Permission is a mild open/accepting pose; prohibition borrows restrained anger and firm lip pressure. | low |
| `.e'e` | exhortation → neutral → discouragement | Exhortation uses warm, activated confidence; discouragement uses concern. | medium |
| `.ei` | obligation → neutral → freedom | Obligation uses focused tension and pressed lips; freedom uses lifted relaxed calm. | low |
| `.e'i` | command → neutral → release from command | Command uses a raised dominant head, fixed anger-like focus, and open speech mouth; release relaxes it. | medium |
| `.e'o` | request → neutral → offer | Request raises inner brows and lowers dominance; offer uses open affection and outward attention. | medium |
| `.e'u` | suggestion → no suggestion → warning | Suggestion is mild attentive warmth; warning borrows a controlled fear/alert pose. | medium |

### 6.6 Evaluative stance: remaining i-series roots

| Root | Positive → midpoint → negative | Visual strategy | Legibility |
| --- | --- | --- | --- |
| `.ia` | belief → skepticism → disbelief | Belief uses steady composure; disbelief uses asymmetric confused brows and head tilt. | low |
| `.i'a` | acceptance → neutral → refusal/blame | Acceptance uses mild calm and warmth; refusal/blame borrows restrained anger. | medium |
| `.ie` | agreement → neutral → disagreement | Agreement uses a mild nod-like lifted pose; disagreement knits brows and tilts the head. | low |
| `.i'e` | approval → non-approval → disapproval | Approval borrows joy; disapproval uses disgust and brow tension. | high |

The `confidence` field is not a confidence in the parse. It estimates how directly a static face can communicate the intended scale. If any clause has low facial legibility, the UI displays the editorial-convention warning.

## 7. Category and modifier transforms

Category/modifier recipes use the same channels as primary endpoints, but their role is different: they alter how the current attitude is displayed.

| Word | Positive → midpoint → negative | Current visual transformation |
| --- | --- | --- |
| `ro'a` | social → asocial → antisocial | Adds blush/social gaze and warmth, or averted narrowed gaze and distance. |
| `ro'e` | mental → neutral → mindless | Adds concentrated brows/eyes, or unfocused lowered-arousal gaze. |
| `ro'i` | emotional → neutral → denying emotion | Raises expressivity/arousal, or adds suppression through lid/lip restraint. |
| `ro'o` | physical → neutral → denying physical | Adds bodily tension and mouth response, or suppresses it with lip pressure. |
| `ro'u` | sexual → neutral → abstinent | Uses blush, pupil, and warmth cues, or averted restrained cues. This is especially culture-dependent. |
| `re'e` | spiritual → secular → sacrilegious | Uses upward gaze/sparkle or asymmetric dominant cues. This cannot be reliably facial. |
| `ga'i` | hauteur/higher rank → equal rank → meekness/lower rank | Raises head and narrows eyes, or lowers head and raises inner brows. |
| `le'o` | aggressive → passive → defensive | Adds lowered knit brows, lid tension, and dominance, or widened eyes and a tucked head. |
| `vu'e` | virtuous → neutral → sinful | Adds lifted self-assurance/sparkle, or downcast gaze, asymmetry, and shadow. |
| `se'i` | self-oriented → neutral → other-oriented | Redirects gaze/head inward or outward; a single face cannot show the referent explicitly. |
| `ri'e` | released → neutral → controlled | Changes the gain of the existing expression, then adds mouth opening/arousal or lip pressure/suppression. |
| `fu'i` | easy/helped → neutral → difficult/opposed | Slightly damps existing exertion and relaxes it, or amplifies tension and adds knit brows/sweat. |
| `be'u` | lack/need → satisfaction → satiation | Adds seeking eyes/open mouth, or softened eyes, cheeks, smile, and low arousal. |
| `se'a` | self-sufficient → neutral → dependent | Adds lifted confidence and dominance, or raised inner brows, lowered posture, and appeal. |

Two modifiers also change the amplitude already accumulated in their clause:

```text
ri'e       expressive gain × 1.18
ri'enai    expressive gain × 0.72
fu'i       expressive gain × 0.90
fu'inai    expressive gain × 1.08
```

The gain excludes the four tonal channels (`valence`, `arousal`, `dominance`, and `warmth`) and acts on the visible rig channels. The modifier's own sparse pose is then added at its CAI magnitude.

Because gain transforms are applied as modifiers are encountered, reordering multiple `ri'e`/`fu'i` modifiers can change small geometric details even when the descriptive semantic inventory is the same. This is a rendering artifact rather than intended Lojban semantics.

## 8. Composition algorithm

For each clause, [`src/expression.js`](src/expression.js) performs these operations:

1. Create a complete zero-valued pose.
2. Select the root's positive or negative endpoint recipe from its polarity.
3. Multiply that sparse recipe by its CAI magnitude and add it to the clause pose.
4. Process modifiers in source order: apply special gain behavior where applicable, then add each modifier recipe at its own magnitude.
5. If the clause is ending (`bu'onai`) or is a question (`pei`), replace its target contribution with neutral. The textual description is retained.
6. Add the clause pose to the final pose using its order-based display-priority weight.
7. Clamp signed channels to `[-1, 1]` and unipolar activations to `[0, 1]`.

This is linear addition followed by hard bounds. It is intentionally simple and predictable. There is no normalization by clause count: adding emotions can make a face more activated until individual channels saturate.

The compound `.a'osai .iiru'e`, for example, contributes:

- 68% of the hope endpoint at priority `1.00`;
- 30% of the fear endpoint at priority `0.88`;
- a final channel-wise clamp.

The resulting face can retain hope's smile, warmth, raised inner brows, and sparkle while adding a smaller amount of fear's eye opening, brow contraction, mouth opening, and sweat.

## 9. From channels to SVG geometry

The neutral face is ordinary SVG markup in [`index.html`](index.html). The renderer never swaps images. It updates path data, ellipse radii, circle positions, group transforms, and cue opacity on every animation frame.

The most important geometric relationships are:

### Head

```text
rotation degrees = headTilt × 7
vertical offset  = headLift × -7 px
```

### Brows

Inner and outer brow values independently move the endpoint Y coordinates by roughly 22 and 20 pixels. `browKnit` moves inner endpoints up to 9 pixels toward the center. `asymmetry` offsets the right brow and changes its curvature.

### Eyes and gaze

```text
eye height = clamp(
  21 + 15×eyeOpen - 5×lidTension - 5×cheekRaise,
  4,
  38
)

eye width    = 43 - 3×lidTension
pupil radius = clamp(12 + 4×pupil, 7, 17)
gaze offset  = (12×gazeX, 9×gazeY) px
```

Lid-line opacity increases with tension, cheek raising, and eye narrowing.

### Mouth and jaw

```text
mouth half-width = clamp(60 + 18×mouthWidth, 38, 79)
corner Y         = 395 - 14×smile
curve-center Y   = 395 + 34×smile
opening          = clamp(mouthOpen + 0.35×jaw, 0, 1)
opening depth    = 5 + 46×opening
mouth stroke     = 8 + 7×lipPress
```

`upperLip` reveals and raises a second curve. `jaw` also lowers the chin curve. `asymmetry` shifts the right mouth corner.

### Cartoon cues and aura

Blush, tear, sweat, stress, sparkle, nose-wrinkle, and shadow elements are permanently present in the SVG and revealed through opacity. `dai` reveals a dashed aqua echo around the face to distinguish empathetic attribution from the speaker's own emotion.

The aura is the only current consumer of `valence` and `arousal`. It blends between teal calm, gold positive affect, and purple negative affect; absolute valence and positive arousal increase opacity. The aura is intentionally secondary to geometry.

## 10. Animation, questions, and share state

`createFaceRenderer()` remembers the current pose and interpolates each channel toward the new target with `requestAnimationFrame`. The easing function is cubic ease-out:

```text
ease(t) = 1 - (1 - t)³
```

Transition durations are:

| Context | Duration |
| --- | ---: |
| ordinary edit | 480 ms |
| `bu'o` beginning | 850 ms |
| `bu'onai` ending | 1050 ms |
| reduced-motion preference | 0 ms |

The replay button starts from a neutral pose and runs the transition again. `bu'ocu'i` retains the ordinary target pose. A questioned clause (`pei`) has a neutral target because it asks for an attitude rather than expressing one.

The exact textarea contents are continuously written to the `q` query parameter with `history.replaceState`. Query state works on GitHub Pages because it does not alter the requested file path. `URLSearchParams` handles apostrophes, spaces, and other escaping. An explicitly empty `?q=` is kept distinct from a URL with no `q`: the first restores a neutral empty input, while the second starts with the built-in demonstration expression.

## 11. Limitations and known losses

The implementation is deliberately honest about several losses:

- **A face cannot encode all 39 scales uniquely.** Obligation, permission, belief, rank, spirituality, ethical virtue, and self/other orientation depend heavily on context. Their drawings are conventions.
- **Scope is absent.** The app reads a standalone indicator stream. It does not know which bridi, word, person, or event an attitudinal would modify in a larger text.
- **One face obscures participants.** `dai` can mark empathy, but the renderer cannot identify whose emotion is being attributed. `se'i` can redirect gaze, but cannot show its referent.
- **Mixtures have finite bandwidth.** Separate recipes survive until pose composition, but additions on the same signed channel can cancel and activations can saturate. There is no region-level winner selection or temporal multiplexing.
- **The midpoint is geometrically neutral.** This is clean for interpolation but can under-render midpoint glosses that have their own ordinary-language character.
- **Unmarked magnitude is invented for display.** `0.58` is not a CLL measurement.
- **The rig is stylized.** It does not simulate facial anatomy, individual variation, or physically constrained muscle interactions.
- **Modifier gain is order-sensitive.** This is a small display artifact described in Section 7.
- **Gaze direction is conventional.** Positive and negative `gazeX` have no universal semantic meaning; recipes use direction mainly to create visible aversion or uncertainty.
- **The mapping has not been perceptually calibrated.** Legibility labels and coefficients were authored rationally, not derived from a user study.

These limitations are why the UI always shows the textual reading next to the face and explicitly labels low-legibility mappings as editorial.

## 12. Extending or tuning the model

### Tune an existing scale

Edit the root's `positivePose` or `negativePose` in `src/attitudes.js`. Recipes are sparse, so it is usually better to change a few diagnostic channels than to set every channel. Check the root at `ru'e`, unmarked, `sai`, and `cai`, and also mix it with a strongly opposed expression.

### Add a new rig channel

1. Decide whether it is signed or unipolar and add it to the corresponding list in `src/expression.js`.
2. Add neutral SVG geometry to `index.html` if necessary.
3. Project the channel in `draw()` in `src/render.js`.
4. Add it sparingly to endpoint/modifier recipes.
5. Add a composition test that checks finite, bounded behavior.

### Improve mixture handling

The current add-and-clamp algorithm is a useful baseline. A more sophisticated successor could group channels into brows, eyes, mouth, posture, and cues, then allocate different regions to competing high-salience clauses. Any such system should preserve the semantic clause list and treat region arbitration strictly as display policy.

### Calibrate with people

A useful study would render randomized endpoints without labels and ask participants to choose among nearby Lojban glosses, then separately test mixed expressions. Results should tune the editable recipe coefficients and legibility metadata rather than replace the transparent model with an opaque classifier.

### Preserve the central boundary

The most important invariant is architectural: language analysis produces semantic clauses; facial projection consumes those clauses. A successful drawing is evidence that a convention is legible, not evidence that CLL entails that facial geometry.
