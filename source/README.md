# Avalanche Dimension Lab

A dependency-free, reusable `<parallax-grid>` web component plus an optional development sidebar. No framework, build system, remote assets or network requests are required. Aeonik Fono Regular, Medium and Bold from your supplied font package is embedded in the component. The standalone `parallax-grid-preview.html` runs directly in a browser. For the modular demo, serve this directory over HTTP (`python3 -m http.server 8080`) and open `http://localhost:8080/demo.html`.

## Add to your wrapper

```html
<section class="your-wrapper">
  <parallax-grid id="brand-grid" style="height:100svh;width:100%"></parallax-grid>
</section>
<script type="module">
  import './parallax-grid.js';
  const grid = document.querySelector('#brand-grid');
  grid.config = { rows: 18, columns: 8, cellRows: 2, cellColumns: 10 };
</script>
```

Only `parallax-grid.js` is needed in production. Styles live inside Shadow DOM, and mouse listeners are scoped to the component. The optional sidebar is outside the component. Give the host an explicit height (minimum 260px). The demo fills the entire viewport with no header or footer; its sidebar floats above the scene and is hidden initially. Instances operate independently; they release animation and resize listeners when removed.

## Shared coordinate system

Rows and columns describe the middle rectangle grid. `cellRows` and `cellColumns` describe each rectangle in square base cells. Base grid width is `columns × cellColumns`; height is `rows × cellRows`. Dots sit on cell intersections, including boundary dots. The front has `columns + 1` boundary lines, including both outside edges.

For your example, use `{rows:50, columns:10, cellRows:2, cellColumns:10}`. This gives 50 × 10 rectangles on a 100 × 100 base-cell grid. A 2-high × 10-wide rectangle is 5:1. Grid geometry always preserves square base cells. The default `fit: "cover"` fills the viewport and crops overflowing outer cells instead of stretching rectangles. Use `fit: "contain", zoom: 1` to show every configured row and column. The 100 × 100 example button selects contain mode. The 1 CSS-pixel gutter is measured on the local untransformed middle-layer plane; perspective naturally scales its apparent screen size. Every cell has a 1px inset outline, fully inside its bounds.

Three canvases sit at `-depth`, `0`, and `+depth` in a shared CSS 3D scene. Their neutral perspective scale is compensated so all cell boundaries align when the cursor is centered. Tilting separates their projected positions; that intentional offset is the parallax effect. Set depth to zero for exact projected registration throughout rotation. Mouse movement rotates toward the cursor, leaving eases back to neutral. Reduced-motion preferences disable rotation. Touch does not hijack scrolling. Idle frames do not continuously animate; requestAnimationFrame runs while rotation, hover pulses or presets are active.

## Settings

`grid.config = {...}` merges a partial update; reading it returns a copy. Defaults are available as `ParallaxGrid.defaults` from the module.

| Setting | Default | Meaning |
|---|---:|---|
| rows / columns | 18 / 8 | Module counts (1–100 / 1–40) |
| cellRows / cellColumns | 2 / 10 | Module dimensions in base cells (1–10 / 1–20) |
| tilt | 7 | Maximum rotation in degrees (0–16) |
| depth | 70 | Pixels between adjacent layers (0–150) |
| perspective | 1400 | CSS perspective distance in pixels (900–2400) |
| smoothing | 0.09 | Frame-rate-adjusted easing; higher is faster |
| zoom / fit | 1.06 / cover | Scale and viewport fitting mode (`cover` or `contain`) |
| pattern | all | `all`, `staggered`, `random`, `wave` |
| density / seed | 0.72 / 12 | Seeded random pattern settings |
| color | #ff394a | Accent color |
| dots / tiles / guides | .45 / .6 / .32 | Layer opacity; zero hides a layer |
| fill | .13 | Active module fill opacity (0–1) |
| motion | true | Cursor response enabled |

## Custom patterns and assets

```js
grid.setPattern(({row, column, rows, columns}) => (row + column) % 3 === 0);
// Or an externally generated boolean matrix:
grid.setPattern(({row, column}) => Boolean(myPattern[row]?.[column]));
grid.setPattern(null); // Restore the selected built-in pattern.
await grid.setAsset('/assets/brand-mark.svg'); // Optional artwork inside modules.
await grid.setAsset(''); // Clear it.
```

The predicate is evaluated when a cell is triggered or an animation preset is scheduled. It must be synchronous and side-effect-free. Raster content is capped at 2× device pixel ratio for predictable memory use. Extremely dense grids necessarily lose detail at small screen sizes.

`configchange` emits the normalized configuration. `geometrychange` emits `{columns,rows,unit,width,height,rectangleWidth,rectangleHeight}` with base-cell counts and local pixel measurements. Events dispatch on the component.

The demo saves settings in localStorage, exports JSON, and copies an embed snippet. Artwork is local to the current session; it is not embedded in exported configuration. To use an exported JSON configuration, load it and assign the object to `grid.config`.

## Reference status

Figma was connected during the task, but its design tools were not exposed in this active session, and the supplied URL could not be read through the web reader. This prototype follows the written requirements and the red Avalanche direction visible in the conversation; it does not claim to reproduce or extract assets from that Figma file. Upload a logo in the demo or pass an asset URL when integrating. No third-party dependencies or analytics are included.

## Verification

Run `node verify.mjs` for source parsing, shared-grid arithmetic, neutral alignment, seeded/custom patterns, input bounds, and cursor-direction checks. These checks passed. Actual browser visual and interaction testing was blocked: this runtime had no browser executable, and its browser download was restricted. Responsive layout and reduced-motion support are implemented but have not been visually verified here.

## Hover and animation (v2)

The middle layer is entirely off on load. Passing over a permitted cell reveals it, holds it briefly, then fades it out, even if the cursor stops there. Re-entering a cell restarts its envelope smoothly from its current opacity. Fast cursor moves sample the path to avoid skipping intervening cells. Picking inverts the actual rotated perspective of the middle plane, and works with cursor rotation disabled as well.

The default envelope is 100ms reveal, 450ms hold, 700ms fade. Set `reveal`, `hold`, `fade` in milliseconds; `stagger` defaults to 100ms between steps. `loop` defaults to false. With reduced motion enabled, cursor tilt and programmed sweeps are disabled; direct hover feedback remains available.

```js
grid.config = { reveal: 100, hold: 450, fade: 700, stagger: 100, loop: false };
grid.play('row');      // Center row, left to right.
grid.play('sweep');    // Each column across all rows, left to right.
grid.play('raster');   // Each row left to right, then the next row.
grid.play('diagonal');// Left-to-right progression with row offsets.
grid.stop();          // Clear pending animation and all visible cells.
```

`play()` without an argument uses `config.preset` (default `row`). Loops pause for 500ms after the last cell finishes. A configuration edit stops playback and clears cells so settings can be inspected from a clean state. Hover still works during presets. The `playbackchange` event reports `{playing}` and, when blocked, `{playing:false,reducedMotion:true}`.

V2 checks additionally passed for full-viewport coverage, hidden initial cells, exact 1px gutters, stroke placement inside all cell bounds, reveal/hold/fade timing, inverse perspective picking, all four preset schedules and stop/clear. These are source and geometry checks, not browser visual validation.

## Cell styling and typography (v3)

- `fill` accepts 0–1 (0–100% in the sidebar).
- `glow` accepts 0–1; default 0. `glowRadius` accepts 0–40 CSS pixels; default 12. Glow follows the reveal/hold/fade envelope. The underlying 1px gutter and inside stroke geometry remain intact; the light may spill beyond the cell.
- `labels` defaults to true. Both lines align to the upper-right of the cell and fade with it.
- `labelTitle` is editable text, default `NODE ID` (maximum 48 characters, one line).
- Line 2 is generated per row/column and `labelSeed`, matching exactly `[0-9][A-Z][0-9][0-9]...`. Values do not change during animation or on unrelated appearance edits. Random assignment does not guarantee globally unique IDs.
- `fontSize` defaults to 10 CSS pixels; `textPadding` defaults to 6. Labels scale down to fit small cells and are clipped inside their boundaries.
- `autoText` defaults to true and uses light/dark contrast against the fill. Disable it to use `textColor` (default white).
- `grid.regenerateNodeIds()` assigns a new label seed. `grid.getNodeId(row,column)` reads a cell's ID.

Aeonik Fono Regular WOFF2 is embedded as a data URL and loaded with the browser FontFace API. No external font host or asset path is required. If you apply a Content Security Policy, allow `data:` under `font-src`. The font came from the supplied Aeonik web.zip; the original upload is unchanged. Font rendering has not been visually verified in this runtime.

## Save and share (v4)

The demo sidebar has a **Save & share** section:

1. Enter a name and select **Save preset** to store a snapshot in this browser. Saving the same name updates that snapshot. Choose a saved preset and use **Load** or **Delete**.
2. Use **Export JSON** for a portable settings file, or **Copy settings** to share the JSON as text. If clipboard permission is unavailable, the text is selected for manual copying.
3. On another copy of this demo, select **Import JSON file** or **Paste settings**, then **Apply settings**. Save the imported setup as a named preset if desired.

Exports include a format identifier, version, name, and all component settings. Older plain JSON configuration exports are also accepted. Invalid files are rejected before applying changes. Imports replace the full configuration, using defaults for missing fields. They do not automatically start animation or overwrite named presets. Browser storage failures are reported; JSON export works independently of browser storage. Up to 100 named presets can be stored locally.

Node-ID and pattern seeds are preserved. Uploaded artwork and custom JavaScript pattern functions are not included. This is file/text sharing, not a hosted share link or cloud preset account. Importing settings keeps the currently uploaded artwork. The component API remains unchanged; the demo owns preset management.


## Column text, media and portable export (v5)

Use the independent **Middle fill color** and **Column line color** pickers. The original color picker now controls middle outlines/glow.

**Column text** selects an individual boundary line. Enable its label, enter up to three lines, and toggle each line independently. Each column has its own color, size, weight (Regular, Medium, Bold), and vertical offset. Text is left aligned. Labels on the final right boundary are placed inside the final column so they remain visible in contain mode; cover mode may crop outer columns along with the grid.

**Foreground media** accepts an image or a muted looping video (up to 40 MB). Set position, dimensions, opacity, contain/cover fit, visibility and depth. This plane sits ahead of the middle cells and column guides, rotating with the scene. Play/pause is available; playback starts paused for reduced-motion users. Media is embedded in whole-page exports, not settings JSON or browser defaults.

**Save as default** stores all current settings, including column text and media placement, as this browser's startup configuration. **Load default** restores it immediately. A shared exported page opens with its embedded settings instead. Uploaded files are not stored in browser defaults; use whole-page export to preserve them.

**Export whole page** downloads one offline HTML file containing the component, all three font weights, current settings, cell artwork and foreground media. Recipients can open it directly, adjust controls and export again. No server is needed. Large video files increase the exported file size. The source ZIP includes the modular component, demo, standalone preview, this guide and verification script.

```js
grid.config = {
  fillColor: '#ff394a', guideColor: '#909090',
  columnLabels: [{ enabled: true, color: '#ffffff', size: 12, weight: 500,
    offset: 24, lines: [
      {enabled:true, text:'AVALANCHE'},
      {enabled:true, text:'NETWORK'},
      {enabled:false, text:'STATUS'}
    ]
  }],
  mediaWidth: 35, mediaHeight: 55, mediaX: 50, mediaY: 50,
  mediaOpacity: 1, mediaDepth: 60, mediaFit: 'contain', mediaVisible: true
};
await grid.setMedia('/brand-film.mp4', 'video'); // or image URL, 'image'
await grid.toggleMediaPlayback();
await grid.setMedia(''); // remove
```

V5 checks cover independent colors, column-label normalization and copy isolation, left-aligned multi-line rendering, media depth/placement, and offline export/re-export with safely escaped embedded settings and media. Browser visual testing remains unavailable in this runtime.


## Column spacing (v5.2)

Each column now supports `lineSpacing` (0–600px added to its natural 1.3× line height) and `letterSpacing` (−5–40px). Font `size` now ranges from 6–320 CSS pixels; vertical `offset` from 0–2000px. Large text renders at the requested size and may span neighboring columns instead of being squeezed into one column. These values travel with presets, defaults and exported projects. Existing settings retain their original spacing.


## Named layers and mobile composition (v6.0)

Official names for controls and prompting:

| Name | Contents | Depth setting | Default |
|---|---|---|---:|
| Dot Field | Fine background dots | `dotLevel` | −1 |
| Cell Field | Animated rectangles and their NODE ID labels | `cellLevel` | 0 |
| Column Guides | Vertical boundary lines | `guideLevel` | 1 |
| Column Labels | Per-column multiline text | `labelLevel` | 1 |
| Media 01 | Primary image/video | `mediaLevel` | 2 |
| Text 01 / Media 02… | Added, renameable content layers | `extraLayers[].level` | 3+ |

Set depth from −10 to +10 in the Layer stack. Lower is farther back, higher is closer; equal values occupy the same plane. Depth is multiplied by Layer spacing and safely capped at 600px (or 60% of perspective distance). Zero Layer spacing makes the planes coincide. `mediaLevel` supersedes the older `mediaDepth` property. Cell hover picking accounts for its new depth.

Additional layers supports up to 20 text/media items. Select and rename each item; adjust its depth, horizontal/vertical position, width/height, opacity, desktop visibility and mobile visibility. Coordinates use percentages of the viewport, with the layer centered on the selected point. Text supports multiple lines, color, size, weight, line height and tracking. New text defaults to hidden on mobile; new media remains visible. Each media item can hold one image or muted looping video and has contain/cover and play/pause controls. Removing a media layer releases its media. Video autoplay may require manually pressing play.

All layer metadata is included in settings, presets and saved defaults. Actual media bytes are included only in whole-page export. Whole-page exports restore every additional media item. JSON and browser defaults do not include uploaded media.

```js
grid.config = {
  guideLevel: -0.5, labelLevel: 3, mediaLevel: 2,
  extraLayers: [
    {id:'headline', name:'Text 01', type:'text', text:'AVALANCHE',
     x:50, y:20, width:70, height:20, level:4, size:72, mobileVisible:false},
    {id:'film', name:'Media 02', type:'media', x:50, y:50,
     width:75, height:65, level:2, mobileVisible:true}
  ]
};
await grid.setLayerMedia('film', '/film.mp4', 'video');
// grid.layerMedia returns a copy of additional media sources for serialization.
```

### Mobile treatment

`mobileMode` is `auto` by default, switching at window widths ≤700px. Choose `mobile` to preview the treatment or `desktop` to disable it. Desktop settings are preserved and restored when leaving the mobile treatment. `mobileColumns` is 3 or 4 (default 4). The mobile Cell Field uses 18 rows, solid fills, reduced dots and guides, no node labels or Column Labels, and a larger primary media area. Extra layer mobile visibility is controlled per item.

Pointer-based tilt is disabled on mobile. Window scroll progress drives gentle 3D rotation. The standalone demo provides a 240svh scroll area around its fixed viewport. In a wrapper, provide actual page scroll space; the component never intercepts touch or creates page scroll space itself. A narrow phone may naturally display fewer rows because the grid preserves its proportions.

`mobileNoise` defaults to true. Seeded high-contrast noise activates Cell Field rectangles about every 240ms, using a short hold/fade. `noiseContrast` (0.1–0.95) is the activation threshold; higher gives fewer illuminated cells. Noise respects the selected module pattern, pauses in hidden tabs, and stops with reduced motion. Reduced motion also stops cursor/scroll tilt and automatic video playback. Use Play controls to explicitly start video.

V6 source checks passed for independently positioned layers, nonzero Cell Field depth picking, isolated mobile overrides, additional layer lifecycle and settings roundtrips. No browser executable is available in this runtime, so mobile touch, rendering and video playback still need device verification.


## Sparse Overlay Cell Field (v6.1)

Column Labels now allow `lineSpacing` from −400 to +600px, added to 1.3× the font size. Negative values tighten the lines; the baseline distance bottoms out at 1px.

**Overlay Cell Field** is a separate sparse rectangle plane. It shares the grid dimensions but has its own animation and styling; main Cell Field hover, presets and noise do not consume its slots. It follows above Media 01 and all visible additional media layers automatically. `overlayGap` sets depth separation; at zero global Layer spacing a minimum 1px separation keeps it above media.

Default selection probability is 2.5% per candidate cell per 240ms tick (`overlaySelection: 0.025`), independently sampled from visible-grid candidates. Lower values mean fewer activations; zero disables new selections. A hard limit includes revealing, held and fading cells, so at most four can be visible. `overlayMax` allows 1–4. Slots remain occupied until their fade finishes. The overlay uses a 100ms reveal, `overlayHold` of 450ms and `overlayFade` of 700ms by default. It runs on desktop and mobile and pauses for reduced motion or hidden tabs.

Other settings: `overlayEnabled` (true), `overlayColor` (#ff394a), `overlayFill` (0.35), `overlayGap` (1). All controls are under Overlay Cell Field and are included in settings/defaults/project exports. The overlay omits text and repeated artwork to keep the foreground sparse.


## Delayed mouse trail for Cell 2 (v6.2)

Overlay Cell Field (also called **Cell 2**) defaults to `overlayMode: 'mouse'`. It now responds to cursor crossings on its own projected plane. `overlayDelay` defaults to 180ms, `overlayReveal` to 180ms, `overlayHold` to 450ms and `overlayFade` to 700ms. The lower Cell Field keeps its separate timing. This delays cell activation; the overall scene still shares its existing cursor tilt.

`overlayCooldown` (default 80ms) sets the minimum interval between accepted trail hits; `overlayHoverRate` (default 1) controls what fraction of crossed cells are accepted. Mouse hits are separate from the existing low noise selection rate. Choose mouse, noise or both in the sidebar. Mobile keeps noise because it has no hover cursor.

The four-cell cap still includes fading cells. Hits arriving while all slots are occupied are skipped, avoiding a stale backlog. Leaving the scene lets already scheduled trail cells finish; editing settings or Stop / clear removes pending hits. All timing and input options are saved/exported.


## Font choices (v6.3)

Cell Field labels, Column Labels and additional Text layers now each have a Font selector. Aeonik Fono retains Regular/Medium/Bold weight controls. Aeonik Black uses the supplied actual Black WOFF2 at weight 900 and is embedded offline.

The supplied ZIP does **not** contain upright Aeonik Regular (only Regular Italic and Fono Regular). Its selector is disabled until the user supplies the correct WOFF/WOFF2 in **Brand fonts**. The upload is loaded as Aeonik Regular at weight 400 and embedded in whole-page exports. Settings JSON preserves the selection but excludes uploaded font bytes. Browser defaults likewise require re-uploading the font.

Component settings: `labelFont` for Cell Field labels, `columnLabels[].font`, and `extraLayers[].font`: `fono`, `aeonik-black`, or `aeonik-regular`. Load the supplied Regular file in a wrapper with `await grid.setRegularFont(url)`. Black and Regular fix their weight to their actual font; weight controls apply to Fono.


## Collapsible sections and rich Column Labels (v6.4)

Every sidebar section now has a native disclosure caret; open/closed state is remembered in this browser. Sidebar jump links open their target section automatically.

**Column Labels → Use rich text** enables a multiline visual HTML editor. Shift+Return inserts a line break. Select a word or phrase and apply Bold, Italic, Underline, color, font size or tracking (letter spacing). Overall font, size, line spacing adjustment, tracking and vertical position remain below the editor. Tracking controls space between letters; it is not a per-glyph kerning-pair editor. The HTML source disclosure supports direct source editing and Apply HTML. Plain-text paste avoids importing unrelated formatting.

Rich labels use DOM text on the Column Labels 3D plane, so per-word formatting stays attached to its column and independent depth. New empty columns default to rich editing; existing simple labels remain in their original three-line mode until switched. Switching to rich text initializes from enabled simple lines. Simple mode remains available. Rich text supports more than three lines.

Rich HTML is limited to 12,000 characters per column, with supported text tags and a narrow set of inline styles. Scripts, event handlers, links, embedded media and unsupported styles are removed from rendered content. HTML is safely escaped when embedded in exported project data. Settings imports now allow up to 1 MB to accommodate formatted labels. Store rich content as `columnLabels[].rich: true` and `columnLabels[].html`. All content travels in presets/defaults/exports.

Source and serialization checks passed. Selection toolbar behavior, caret rendering and browser rich-text editing have not been visually tested in this runtime.


## Rich-editor and disclosure fixes (v6.5)

Column Labels now has one always-available rich editor. The rich/simple toggle and three separate line inputs have been removed. Existing simple labels are converted into editable rich text when selected, preserving enabled lines. Editing or formatting a label makes it visible; the Show this column’s text checkbox can still hide it afterward.

Fixed a section-level input listener that was catching child events and resetting rich-text activation. Only column input/select controls now update column settings. Every section starts collapsed on each page load, regardless of earlier saved disclosure state. Jump links still open their target. Carets sit immediately beside left-aligned titles; small section badges remain on the right.


## Direct rich-text leading (v6.6)

Column Labels now use **Line spacing · px**, a direct 1–1000px distance between successive line positions (`columnLabels[].leading`). Smaller numbers bring lines closer. It replaces the negative adjustment control for rich labels. Existing settings migrate from their former font size and adjustment.

Rich HTML is converted into positioned lines while retaining word-level styling. Browser block layout, large inline fonts and inline line-height declarations can no longer force lines apart. Paragraphs and Shift+Return breaks each create explicit lines; HTML indentation whitespace is ignored. Tight leading may intentionally overlap glyphs.


## Blur and Vercel (v6.7)

Cell Field glow/blur radius now allows 0–200px. Media 01 and each additional media layer also have an independent 0–200px blur. Blur is applied to the media content, preserving the 3D plane.

For hosting, use the separate avalanche-grid-vercel.zip package. Export Vercel page downloads your configured scene—including media and uploaded Regular font—as index.html. Replace public/index.html in the deployment folder with that export before publishing to share your actual composition. Merely deploying the supplied default page does not include settings or files stored in your browser.
