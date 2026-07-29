# HANDOFF — SantizoOS session, July 2026

State of the world for the next session. Read CLAUDE.md first (structure,
conventions, common tasks); this file is what a fresh session can't infer.

## Live state

- **santizo.com** (+ www) serves this repo via Vercel project `santizo-os`
  (team augustos-projects-c42fb8a3, `vercel` CLI is logged in). Repo:
  **github.com/has-everything/santizo-os**, branch `main`.
- GitHub→Vercel auto-deploy exists but the webhook has silently missed
  pushes before. **Reliable path: `vercel deploy --prod` from this folder
  after pushing.** Verify with curl against santizo.com afterward.
- **DNS: do not touch nameservers, ever.** Zone lives on Netfirms
  (ns1/ns2.netfirms.com): A @ and www → 76.76.21.21, MX → Yahoo business
  mail (hector@santizo.com). Switching nameservers kills email; the
  Netfirms account must stay active (it hosts the zone). Vercel's
  "DNS Change Recommended" banner is cosmetic; ignore.
- **Analytics**: Vercel Web Analytics enabled (cookieless, no banner).
  Custom `open_window` events fire from openWin (desktop) and card expand
  (mobile).
- **boring.html** is deliberately `noindex`, out of the sitemap, and
  unadvertised (menu link only). Keep it that way.

## Design decisions already litigated (don't relitigate)

- Chrome font is **ChicagoFLF** (public domain, fonts/ with license README),
  menu bar + title bars only, single weight 13px. Everything inside windows
  is **Space Mono** (About included). Archivo survives only in the has.tools
  widget caption and boring.html. No em dashes anywhere in copy.
- Window glyphs are drawn CSS: zoom box = small square sharing the button's
  top/left border lines (only right/bottom strokes, 6x5 + borders);
  minimize = windowshade bar; grow box = paper corner with inset diagonal
  ridges. Close keeps ✕ deliberately (legibility over purity).
- **Double-click a title bar = WindowShade roll-up** (period-correct), not
  maximize. Zoom box button owns maximize. Full-page maximized windows are
  pinned (no drag) but still shade/restore by double-click.
- Apps (lathe, dither, cabinet, gallery) run in 960px windows with deferred
  iframes (`data-src`, loads on first open at real size so their mobile
  gates don't misfire), grow-box resize (pointer capture), and are
  trashable as "HAS <Name>.app" (trashing quits the iframe). ✕ close also
  unloads iframes (memory/audio); minimize keeps them alive.
- Players: xr (7 clips), anim (6 clips, paper stage via clipPlayerBody
  third arg). Photos are matted prints on paper (.stage-photos). has.tools
  widget = pure-CSS slide loop of live has.tools card captures, 2.5s/slide.
- About copy is the owner's own (Some/Others/All triplet); role is
  "3D Motion Designer · Creative Technologist" (Tool Builder was cut
  deliberately) — same order on about_me.txt and boring.html. Title/og
  titles: "Santizo · Hector Augusto Santizo" (og:site_name still SantizoOS).
- README.txt opens on load, airy styling (.readme-text), teaches the
  desktop, does NOT mention boring mode (deliberate: don't route people out).

## Verification workflow that works here

Temporarily add to HAS_Tools_Website/.claude/launch.json:
`{"name":"santizo-os","runtimeExecutable":"python3","runtimeArgs":["-m","http.server","8897","--directory","/Users/augustosantizo/Desktop/DesktopProjects/SantizoOS"],"port":8897}`
then preview_start it, and REVERT the entry after verifying. Browser-pane
quirks: it caches CSS/JS hard (bust with fetch(url,{cache:'reload'}) then
reload), renders screenshots miniature after manual resizes (verify via
computed styles/JS instead), narrow pane boots mobile mode (≤820px),
smooth-scroll and external tabs are throttled/gated. Playwright's bundled
chromium has no H.264 — use `channel: 'chrome'` for anything with video.

## Demo reel

santizo-os-demo.mp4 (45s 1080p, gitignored) lives in this folder. Recipe:
Playwright script run from ~/Desktop/DesktopProjects/ExplodedView/app
(headed, channel chrome, autoplay flag, injected fake cursor, choreographed
mouse), then `ffmpeg -ss 0.7 -i page@*.webm -c:v libx264 -crf 18 -pix_fmt
yuv420p -movflags +faststart -an out.mp4`. Re-run for new cuts (9:16 etc.).

## Open items (small, all optional)

- **og-home.png is stale**: captured before Chicago chrome, mixed-case
  About, and README restyle. Re-capture at 1200x630 (Playwright + Vimeo
  oEmbed poster injected over the reel; see CLAUDE.md) and redeploy.
- XR player stage is still ink; anim is paper. Match if wanted (one arg).
- boring.html h1 still renders uppercase (its own style); About went
  mixed-case. Harmonize only if the owner asks.
- HAS Gallery is deployed at has.tools/apps/gallery/ but unlisted there
  (owner's choice, "maybe later"): no grid entry/showcase/sitemap. The
  has.tools repo has the owner's own uncommitted WIP (js/tools-data.js +
  thumbnail images) — never sweep it into commits.
- Gallery app spams WebGPU errors if its canvas is 0-width (task chip filed;
  fix lives in ~/Desktop/DesktopProjects/HAS_Gallery, rebuild + copy dist
  to HAS_Tools_Website/apps/gallery/ per storefront convention).
- Legacy redirects (/animation.html → /?open=anim etc.) were discussed,
  never requested. Only add if old links surface somewhere.
