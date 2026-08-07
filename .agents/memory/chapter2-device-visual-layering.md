---
name: Chapter 2 device visual layering
description: The shared square device artwork is reused in Chapter 2 without a frame or crop.
---

The Chapter 2 visual reuses the shared square device artwork and its animated SVG overlay. Keep the image and overlay absolutely positioned in the same square coordinate system, remove any parent rule that repositions descendant SVGs, and use responsive containment when enlarging it.

**Why:** A fixed landscape frame and a broad descendant SVG rule previously clipped the phone, QR, and monitor or separated the overlay from the artwork.

**How to apply:** Preserve the square aspect ratio, keep the Chapter 2 presentation unboxed, and scale the complete visual through its containing width rather than changing the source artwork or overlay coordinates.