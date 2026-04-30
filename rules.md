# QuickBridge Project Rules - MANDATORY WORKFLOW

RULE NUMBER 1: NO ASSUMPTIONS, NO LAZY PATTERNS, NO GUESSWORK.

⚠️ **CRITICAL**: These are not suggestions. Follow EVERY step or you WILL break things.

## 🚨 MANDATORY PRE-WORK CHECKLIST (DO THIS FIRST!)

Before writing ANY code or creating ANY file, you MUST complete this checklist:

### Step 1: RESEARCH (Required for every task)
```
[ ] Read replit.md completely
[ ] Search for relevant existing files/hooks/components
[ ] Read ANY files that might be related before touching them
[ ] Check existing Supabase schema/realtime channel usage if touching signaling
[ ] Verify what already exists BEFORE assuming it's missing
```

### Step 2: UNDERSTAND (No assumptions allowed)
```
[ ] What EXACTLY is the current state?
[ ] What files/hooks/components already exist?
[ ] What is the MINIMAL change needed?
[ ] What could break in the WebRTC connection lifecycle if I make this change?
```

### Step 3: PLAN (Show your work)
```
[ ] State what you found in research
[ ] List ONLY the files that need changes
[ ] Explain WHY each change is needed
[ ] Get user approval if non-trivial
```

### Step 4: EXECUTE (Minimal changes only)
```
[ ] Make ONLY the changes identified in Step 3
[ ] NO "complete rewrites" or "comprehensive refactors"
[ ] NO additional features "while you're at it"
[ ] Test one concern at a time
```

## ❌ FORBIDDEN PATTERNS (Stop yourself before doing these)

- ❌ "Let me rewrite the WebRTC hook from scratch"
- ❌ "I'll add these features too while I'm at it"
- ❌ Creating files without checking if they exist
- ❌ "This looks like it needs X" (assumption without research)
- ❌ TODO comments or placeholder code
- ❌ Mocking WebRTC or Supabase Realtime in production paths
- ❌ Breaking the P2P signaling flow to ship a UI change

## ✅ CORRECT PATTERNS (This is what good looks like)

- ✅ "Let me check what exists first" (search, read files)
- ✅ "I found X already exists, so I'll only modify Y"
- ✅ "Minimal change: update N lines in file.ts"
- ✅ "Researched: found existing channel logic, building on it"
- ✅ Full implementation, no TODOs, production-ready
- ✅ Code that respects the WebRTC lifecycle and Supabase channel cleanup

## 🎯 Project Identity

QuickBridge is a **production-grade P2P file transfer app**, NOT a basic demo:
- Serverless architecture - no files ever touch a server
- WebRTC Data Channels with 16 KB chunking and backpressure management
- Supabase Realtime used exclusively for the signaling handshake (SDP offer/answer)
- Short Authentication Strings (SAS) for MITM-resistant connection verification
- File System Access API for stream-to-disk on Chromium (up to 2 GB transfers)
- PWA support with a service worker for offline shell loading
- QR code + 6-digit PIN pairing

**Every change must respect the connection lifecycle, preserve privacy, and be production-quality.**

## 🎨 Design Standards

**Dark, minimal, trust-building UI:**
- Dark backgrounds, clean typography
- Smooth transitions - no jarring state jumps
- Mobile-first responsive (phone is always one side of the transfer)
- Clear connection status feedback at every stage
- Security indicators (SAS emoji codes) must remain prominent and readable

**NEVER:**
- Remove or obscure the SAS verification UI
- Add loading states that block user action unnecessarily
- Introduce server-side storage of any file data
- Break mobile layout for desktop polish

## 📋 Architecture Reference

**Key Files - Read before touching:**
- `quickbridge/src/hooks/use-webrtc.ts` - Core P2P engine. Signaling, chunking, reconnection. Most bugs live here.
- `quickbridge/src/routes/index.tsx` - Host landing page. Session generation, QR display, PIN discovery.
- `quickbridge/src/components/quickbridge/Session.tsx` - Active transfer UI. Drag-and-drop, history, messages.
- `quickbridge/src/lib/streaming.ts` - File System Access API streaming logic.
- `quickbridge/src/lib/sas.ts` - SAS emoji/word derivation from DTLS fingerprints.
- `quickbridge/public/sw.js` - Service worker. Be careful - changes here affect offline behavior.

**Tech Stack:**
- React 19 + TanStack Start + TanStack Router
- TypeScript 5.8
- Tailwind CSS v4 + shadcn/ui (Radix UI)
- Bun + Vite 7
- Supabase Realtime (signaling only)
- WebRTC (RTCDataChannel, STUN/TURN)

## 🔌 Integration Points to Protect

| Layer | What it does | What breaks if touched carelessly |
|---|---|---|
| Supabase Realtime | Signaling handshake | Peers can't discover each other |
| RTCDataChannel | File/message transfer | Transfers drop or corrupt |
| File System Access API | Stream-to-disk | Large files crash RAM |
| SAS derivation | Security verification | MITM protection breaks |
| Service Worker | PWA offline shell | App fails to load offline |

## 🔄 Self-Check Before Submitting

Ask yourself:
1. ✅ Did I complete the MANDATORY checklist?
2. ✅ Did I check what exists before creating or modifying?
3. ✅ Is this production-grade, not a shortcut?
4. ✅ Does it respect the WebRTC connection lifecycle?
5. ✅ Is it fully implemented - no TODOs, no placeholders?
6. ✅ Did I avoid ALL forbidden patterns?

**If ANY answer is "no", STOP and restart from Step 1.**

---

**Project:** QuickBridge  
**Stack:** React 19 / TanStack / TypeScript / Supabase Realtime / WebRTC  
**Enforcement Level:** MANDATORY - Not following these rules risks breaking the P2P transfer pipeline
