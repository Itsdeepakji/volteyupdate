---
name: Clone Fidelity Rules
description: User's mandatory rules for every UI section cloned from a reference screenshot.
---

## Rules (apply to every clone, no exceptions)

1. **Exact height & width** — measure section height, column widths, image dimensions from the reference screenshot and reproduce them pixel-accurately. Do not guess or use approximate values.

2. **Left/right proportions** — the split between the left content column and the right image/media column must mirror the reference. Measure each column's percentage of the viewport/container and replicate it.

3. **Font size** — measure all text sizes from the reference (title, subtitle, price, button labels, footnotes) and match them exactly in px.

4. **Font weight** — match bold/semibold/regular/light for every text element. Do not default everything to regular.

5. **Font family** — always use **Poppins** for all text, regardless of what font the reference uses. Add `fontFamily: "Poppins, sans-serif"` on every text element (or on a parent wrapper), and ensure the Google Fonts import for Poppins is present.

6. **Lottie animated icons** — wherever the reference shows a small icon inside a badge, feature card, or UI widget, use a Lottie animation (`<LottieIcon src="/icons/lottie/<name>.json" size={N} autoplay loop />`) instead of a static SVG.

## Implementation patterns

- **2-line title forced split**: When a headline must break on a specific word (e.g. "One phone number|that works everywhere"), store the `|`-separated string in the CMS default and render with:
  ```jsx
  {title.split("|").map((line, i) => (
    <span key={i} style={{ display: "block" }}>{line}</span>
  ))}
  ```
  Also set the left column `maxWidth` wide enough (520px worked for 44px Poppins Black) so the second line fits.

- **Badge straddling image corner**: position the badge `top = image_top - badge_height/2`, `left = image_left - overhang` so the center-Y of the badge aligns with the image top edge.

- **Image sizing**: use FIXED px values for `width` and `height` on absolutely-positioned images (do NOT use `calc(100% - Xpx)` — it makes the image too wide at larger viewports). Match the reference's aspect ratio; near-square images should have equal or near-equal width and height.

**Why:** User explicitly stated on 2026-06-17 that every future clone must match height/width/proportions/font sizes/font weights exactly, always use Poppins, and always use Lottie icons.
