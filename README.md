# Ever After Events

**[Watch the latest moving hero concept](preview/README.md)** — original 360-degree scene, with a looping preview and MP4. This is the first revised visual draft.

A complete, responsive luxury wedding planning website built with React, Vite and Three.js. The company name is illustrative. All content and assets are local; the deployed website makes no third-party asset requests.

## Run locally

Use Node.js 22.14 or newer (developed with Node 24).

```sh
cd /workspace/Wedding-Planning-
npm ci
npm run dev
```

Vite prints the development address. To create and serve the production build:

```sh
npm run build
npm run preview
```

Deploy the generated `dist/` directory to any static hosting provider. There are no API keys or environment variables to configure.

## What's included

- An actual WebGL wedding scene: an instanced floral arch with ivory and blush flowers, curved leaves, animated silk-like drapes, reflective gold rings, a faceted stone, candle arrangements and drifting petals.
- Environment reflections, physically based materials, real shadows on capable devices, pointer-driven camera movement and a scroll-driven camera transition.
- Locally hosted fonts and optimised WebP images, a lazy-loaded scene, capped device pixel ratio, reduced scene density on mobile, software-renderer detection, and rendering suspended outside the viewport.
- Reduced-motion support, an animation pause control, loading messaging, context-loss handling and a photographic fallback when WebGL cannot start.
- Service accordions, a filterable inspiration gallery with keyboard-operated lightbox, a four-step planning process, responsive navigation and a validated inquiry form.

## Inquiry form limitation

**No backend or email provider is configured. Nothing is sent or stored.** The form validates the entered information and prepares a plain-text inquiry that the visitor can download. This limitation is stated next to the form and in its success state. A production launch needs a real submission endpoint, recipient address, spam protection, privacy policy, and delivery/error handling. Do not change the success copy to imply delivery before integrating and testing a backend.

## Validation

```sh
npm test
npm run build
npm run test:e2e
```

The unit tests cover inquiry validation and downloaded content. Browser tests cover actual scene rendering and motion, pause/reduced-motion behaviour, WebGL fallback, navigation, service details, gallery controls and focus, form validation/downloads, and responsive layouts.

The browser configuration uses system Chromium at `/usr/bin/chromium`. On another machine, set `CHROMIUM_PATH` to your Chromium executable, or install Playwright Chromium and adjust `playwright.config.js` to use it. The browser suite builds the site, then starts the production preview automatically on port 4173. Screenshot-based animation checks can be slower on software-rendered WebGL.

## Assets and production content

See [ASSETS.md](ASSETS.md) for source and license details. The portfolio is explicitly an editorial inspiration collection, not invented client work. Replace it with authorised company photography before representing actual events. No testimonials, awards, client names or company history have been invented.

The 3D scene is original procedural geometry rather than a scanned floral model. Its fidelity and frame rate depend on the device's GPU; lower-powered devices get a lighter scene. The first build followed the written brief. The revised concept uses the later salon screenshots as visual references for rotation and staging; those screenshots are not embedded or copied into the website.

This cloud task already has an isolated checkout. Use this checkout; no Git worktree is needed.

## Open the complete website without installing anything

Run `npm run build:standalone` to generate `standalone/Ever-After-Events.html`. Download that HTML file and double-click it in a modern browser. All JavaScript, styles, photographs and fonts are embedded in the file. The 3D scene, gallery, navigation and local inquiry download work without a development server or an Internet connection. WebGL still requires a capable browser; reduced-motion settings intentionally freeze the scene.

The managed browser in this cloud environment blocks `file://` navigation by administrator policy. The generated single-file build is validated through a local static server with all of its content embedded. If your browser also restricts local HTML, serve the containing directory using any static HTTP server.

## Revised 3D hero concept

The hero is now built in `src/CinematicScene.js`. It uses curved petal meshes in overlapping spiral whorls, arrangements on the front and back of the arch, a three-dimensional support frame, silk surfaces with procedural microtexture, glass candle vessels and independent jewellery motion. The full installation completes a continuous turn in 32 seconds; pause and reduced-motion controls retain a still scene.

`preview/Revised-Hero-Concept.mp4` is a complete turntable concept rendered from the actual WebGL geometry. Its playback is accelerated for a short review of all sides. It is an original, procedural 3D draft, rather than a scan of a real floral installation. The user's salon screenshots were used only to understand the intended visual direction and were not copied into the site or any asset.

For deterministic concept captures during development, open `/tools/hero-concept.html` through Vite and call `window.drawConcept(timeInSeconds)` in browser automation. `/tools/export-scene.html` exports the original geometry for further work in a 3D editor. These development tools are not included in the production application bundle.
