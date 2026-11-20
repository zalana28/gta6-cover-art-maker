[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/zalana28/gta6-cover-art-maker/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/zalana28/gta6-cover-art-maker/reward.svg)](https://make.fun/c/gta6-cover-art-01)

# Vice Cover Studio

A GTA-style cover art maker that runs fully offline in your browser. Upload
your own photos, crop and reposition each one inside bold diagonal panels,
pick a sunset, neon or noir colour grade, write your caption in big outlined
poster lettering, and export a PNG ready to post — 1080×1080, 1080×1350 or
1920×1080. A built-in sample photo (a sun-soaked palm boulevard, made with
an image model) is loaded so you can try it with no upload at all.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser.

## How it works

- **Photos:** add one or several photos from your device; click a photo, then
  click a panel to place it there. Drag a photo inside its panel to pan it,
  and use the zoom slider to crop in closer. One photo can fill all panels.
- **Layouts:** 1, 2, 3 or 4 diagonal panels in the GTA poster style.
- **Grades:** Sunset, Neon or Noir — each recolours the photos and adds a
  matching wash, plus halftone dots for the comic-poster finish.
- **Caption:** main title plus subtitle, in four lettering styles (Outline,
  Solid pop, Neon glow, Sunset fade).
- **Export:** one click downloads an exact-pixel PNG at the size you picked.

Everything is plain static files under `app/` — no network requests, no
build step, and your photos never leave your machine. The lettering is drawn
with system fonts; no Rockstar logo, artwork or font is used anywhere.
