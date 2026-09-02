# cnisku

`cnisku` is a client-side visual playground for Lojban attitudinals. Enter a short string such as `.o'onaicai ri'enai` and a deterministic SVG face renders an editorial interpretation of the attitude.

The app has no runtime dependencies and no build step. All processing stays in the browser, and the repository root can be published directly with GitHub Pages.

The current input is stored in the URL's `q` query parameter as it changes. Opening or copying that URL reproduces the same face, including an explicitly empty expression.

## Run locally

Any static file server works:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

Run the semantic/parser tests with:

```sh
npm test
```

## Publish with GitHub Pages

Push the repository to GitHub, then choose **Settings → Pages → Deploy from a branch** and select the repository's default branch and the `/ (root)` folder. No generated files or deployment build are needed.

## Supported input

The parser intentionally recognizes only the indicator vocabulary the face needs:

- The 39 VV/V'V attitudinal roots described in CLL Chapter 13
- The six category words (`ro'a` through `re'e`)
- The eight attitudinal modifiers (`ga'i`, `le'o`, `vu'e`, `se'i`, `ri'e`, `fu'i`, `be'u`, and `se'a`)
- `cai`, `sai`, `ru'e`, `cu'i`, and polar `nai`
- `ge'e`, `dai`, `pei`, and the `bu'o` emotion contour

Pause dots and spaces are optional. This is deliberately not a general Lojban parser; unsupported text produces a local diagnostic while any recognized attitudes continue to render.

## Model

The implementation keeps language interpretation separate from facial projection:

1. [`src/parser.js`](src/parser.js) turns the supported token stream into ordered attitude clauses. Modifiers attach to the preceding attitude, and opposed feelings remain separate contributions.
2. [`src/attitudes.js`](src/attitudes.js) defines both poles of every root as independently authored, sparse face recipes. The opposite endpoint is never calculated by numerically negating the positive endpoint.
3. [`src/expression.js`](src/expression.js) applies CAI strength, modifier transforms, ordering salience, and safe rig bounds.
4. [`src/render.js`](src/render.js) converts the resulting controls into parametric SVG geometry and transitions.
5. [`src/share.js`](src/share.js) round-trips the exact input through a GitHub Pages-compatible query parameter.

The numerical strengths used by the renderer are an artistic convention. CLL specifies an ordered seven-position scale, not equal metric distances, and an unmarked attitude has unspecified intensity. This app uses a moderate visual default for an unmarked root.

Many attitudinals—especially directive, epistemic, spiritual, ethical, and relational ones—are not uniquely visible on a human face. The mapping table marks facial legibility and the interface calls out low-confidence editorial renderings. These mappings are not part of the Lojban specification.
