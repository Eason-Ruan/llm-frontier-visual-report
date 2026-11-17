# Refactor verification — 17 November 2026

The final functional checks passed against `http://127.0.0.1:8766`, using uv Python **3.12.13**, the repository requirements, installed Google Chrome, and the existing Playwright library at `/Users/ruanlixin/node_modules/playwright`. Browser assertions use plain Node scripts; no test framework or runtime dependency was added.

## Preserved evidence

Before implementation, `/tmp/refactor-verification/baseline/` captured canonical API JSON, source-file hashes, browser controls, chart options, and screenshots.

- All **20 API responses** and **121 existing data/public files** match their original hashes, including Chapter 3 Open/Closed filters and Chapter 5 bundles.
- All **8 Storyboard summary charts** retain their series data, types, and stacks.
- **11 rendered dashboard states** retain all series data/types/stacks and logical axes: Chapter 2 default/filtered, Chapter 3 default/Open, Chapter 4 default/battle window, and five Chapter 5 states spanning its three views. This compares 77 chart instances. Chapter 1 is covered by its source suites and browser controls.
- ECharts `animation*` options match the baseline. Existing Chapter 1 flow, storyboard, and composition tests and Chapter 2 state tests pass.

## Browser checks

For **every chapter**, a MutationObserver and stored object references verify the same iframe element, `contentWindow`, parent, and `src` across collapse, expand, fullscreen, child Escape, browser Forward, and panel exit. No iframe or ancestor removal, reparenting, or `src` mutation occurred. Nondefault chapter controls and selections remain intact; Chapter 3's actual 20–70% ECharts zoom is retained.

All five `/explore/chN/` routes support direct entry, reload, and exit with the global sidebar. Multi-chapter browser history, original Storyboard scroll position, and desktop trigger focus are restored. Mobile navigation opens/closes correctly, Tab/Shift+Tab wrap within the drawer, and fullscreen exit returns focus to the Navigation button.

Child scroll checks cover Chapters 1 and 4 entered from both collapsed and expanded panels. Fullscreen window offsets of 341 px / 194 px and inner scroll offsets of 400 px return exactly after exit/reopen. Expanded inline panels separately retain their prior 275 px inner scroll offsets; Storyboard scroll remains at its original 3355 px. The shared bridge snapshots window and container positions by mode before parent geometry changes.

Deep-link/reload checks pass for Chapter 1 `?category=coding` and Chapter 5 `?sel=deepseek#linked`; Chapter 5 child view/selection changes mirror the parent URL. Canonical 308 redirects preserve query parameters, and unknown chapters return 404. Group, zoom, and brush state are session state rather than additional URL parameters.

Actual failed-load checks abort the Chapter 5 iframe document request and, separately, its bundle API request. Both produce a visible error and explicit Retry button, then recover after interception is removed. The target iframe element/window/parent/source and another live chapter's document and group/year filters remain intact. An additional injected error verifies replay of the target's last view and selection. Functional runs report zero page errors; a root/raw/explore application-resource sweep reports no failed requests.

## Reproduce

```sh
PORT=8766 UV_CACHE_DIR=/private/tmp/llm-frontier-uv-cache UV_PYTHON=3.12 ./start.sh
cd sites/arena-weight-flow && npm test
```

From the repository root, with the captured session artifacts still present:

```sh
node dashboards/ch2/tests/state.test.mjs /tmp/refactor-verification/baseline/api-1.json
python3 /tmp/refactor-verification/verify-data.py
python3 /tmp/refactor-verification/compare-semantics.py
node /tmp/refactor-verification/shell.cjs
node /tmp/refactor-verification/history.cjs
node /tmp/refactor-verification/deeplink-retry.cjs
node /tmp/refactor-verification/real-failures.cjs
node /tmp/refactor-verification/scroll-retention.cjs
node /tmp/refactor-verification/final-css.cjs
node /tmp/refactor-verification/network.cjs
git diff --check
```

The JSON results, before/after snapshots, scripts, and temporary screenshots are under `/tmp/refactor-verification/`. They are session-local artifacts and are not checked into this repository.

## Visual QA

Independent visual QA inspected 30 screenshots of the Storyboard and five chapters at 1600×1000, 1920×1080, 1024×768, 390×844, and 1280×600. It reported zero page errors or document-level horizontal overflow and verified the fullscreen paper mask on tablet and mobile. Actual Chapter 1 animation sampling recorded 14 distinct normal-motion frames and one reduced-motion frame, matching the original 14/1 baseline. Chapter 5 animation sampling recorded 13 rank frames at 400 ms and four cost frames at 300 ms. Screenshots and animation traces remain in `/tmp/refactor-verification/visual/`.

All five chart-information controls open with keyboard Enter and show focus outlines. Their title bars remain pinned while the iframe scrolls. The final CSS probe confirms paper `#f7f8f4`, card border `#dbe4db`, and Inter typography on the root and Chapter 2; Chapter 2 help opens and Escape closes it without leaving fullscreen.

The current Chapter 2 build exposes all four `a.`–`d.` Scale Change subplot labels. Its grey selection-status text is visually clipped to 1×1 px while retaining updated text and `aria-live="polite"`; pagination artwork has an empty decorative alt attribute.

Chapter 1 interruption/resize QA rapidly switches area/rank/gap/tiers during animation, resizes the parent from 1440 to 1180 px, and settles against a clean reference. The same canvas is retained, no category fetch occurs, and the final rendered PNG is pixel-identical to the reference. Evidence: `/tmp/refactor-verification/ch1-animation/result.json` and its two matching PNGs; tested final assets are `index-xb30X8WJ.js` and `index-DJG2Rftp.css`.
