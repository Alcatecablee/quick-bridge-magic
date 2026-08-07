---
name: Hero asset framing
description: The homepage device artwork is square and must stay contained rather than being placed in a wide cover-cropped frame.
---

The homepage hero device artwork is a square composition. Keep the phone, QR code, and monitor fully visible by preserving its square aspect ratio and using contained rendering; animated overlays must use the same square coordinate space.

**Why:** A wide 16:9 cover frame cropped the device artwork and made the visual appear missing or cut off in the hero.

**How to apply:** When replacing or animating the homepage hero visual, preserve the source artwork's aspect ratio first, then align any SVG or motion layer to that unchanged coordinate system.