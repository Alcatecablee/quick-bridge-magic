---
name: Vercel npm registry
description: Deployment constraint for imported npm projects whose lockfiles contain Replit package firewall URLs.
---

# Vercel npm registry

Vercel builds cannot resolve `package-firewall.replit.local`, even when the lockfile has valid integrity hashes. Imported projects may contain those internal tarball URLs in `package-lock.json`.

**Why:** The hostname is available only inside the Replit package environment. A hosted Vercel builder needs a publicly reachable registry URL.

**How to apply:** Keep the dependency versions unchanged and configure the Vercel build install with `--package-lock=false --registry=https://registry.npmjs.org` when the lockfile contains Replit-internal resolved URLs. This is a smaller change than rewriting the entire lockfile.