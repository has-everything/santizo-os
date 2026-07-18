# SantizoOS — santizo.com

Personal site for Hector Augusto Santizo (HAS), styled as a retro desktop OS: draggable windows, desktop file icons, a "bad ideas" trash can. Plain HTML/CSS/JS, no build step, no framework. Plain scripts (no modules) so the site also works via `file://`. Intended to become the new **santizo.com**.

Repo: **github.com/has-everything/santizo-os**. Live at **https://santizo-os.vercel.app** (Vercel project `santizo-os`, GitHub integration: push to `main` → production, no build command, output = repo root).

Origin: implemented from the Claude Design project "SantizoOS Retro.dc.html" (claude.ai/design). Related: has.tools repo at `~/Desktop/DesktopProjects/HAS_Tools_Website` (same owner, same conventions).

## Structure

- `index.html` — shell: head metadata, menu bar (shared chrome incl. IG/YT links and the "boring mode" link), `#desktop` (trash drop target), `#feed` (mobile). Loads `css/style.css`, then `js/site-data.js` → `js/mobile.js` → `js/os.js` (load order matters: content first, then renderers)
- `boring.html` — "boring mode": plain semantic one-pager (bio, work links, email/socials). Serves recruiters in a hurry, screen readers, and SEO; styled by the `body.plain` section of style.css
- `css/style.css` — all styles; ink/cream brand tokens in `:root`; mobile-feed styles at the bottom gated by `body.mode-mobile`
- `js/site-data.js` — **the content file**: `WINDOWS` (every window incl. its body HTML), `ICONS`, `MOBILE_FEED` (card order + which start collapsed), `PHOTOS`, `TRASH_NAME`/`TRASH_FIXED`. Edit this to change the site.
- `js/os.js` — boots the right mode (`matchMedia ≤820px` → mobile, else desktop; crossing the breakpoint reloads) and runs the desktop window manager: drag, focus/z-order, minimize (roll up), maximize (1.6x width, or full-page for `maxFull` media windows: reel, photos, projects), drag-to-trash with put-back, photo gallery, menu clock, initial layout. On screens larger than the ~1730px design, `fitToDesktop` scales media (`maxFull`) window widths/stages and the em-sized icons up to 1.35x; text windows never scale (type stays crisp, no page zoom, no scrolling). Rarely needs editing.
- `js/mobile.js` — mobile renderer: the same `WINDOWS` render as stacked collapsible cards in `MOBILE_FEED` order; `data-open` scrolls to and flashes the card; desktop-only hints (`.file-hint`, `.trash-hint`) are stripped.

## Common tasks

**Add a window**: add an entry to `WINDOWS` in `js/site-data.js` (`title`, `width`, `x`, `y`, `open`, `body`). Optional: `file: 'name.ext'` makes it a deletable desktop file; `dockRight: true` docks it to the right edge on load; `dockBottom: <px>` puts its top edge that many px above the desktop bottom on load (y becomes the fallback); `stageHeights: [normal, max]` sizes a `.stage` element in the body. Give it a desktop icon by adding to `ICONS` (icon `id` must be a `WINDOWS` key), and/or a menu item in `index.html` (`<span class="menu-item" data-open="<id>">`). Also add it to `MOBILE_FEED` or it won't appear on phones.

**Add a desktop shortcut to an external link**: add an `ICONS` entry with `href` instead of a window id (e.g. the instagram/youtube icons). `col: 1` places an icon one column left of the rightmost; columns are bottom-anchored.

**Embed a has.tools app as a window** (e.g. HAS Lathe): add a `WINDOWS` entry with `body: appWindowBody(name, url)`, `maxFull: true`, `stageHeights: [h, h]`, plus an `ICONS` entry. has.tools sends no frame-blocking headers, so the apps embed fine; the body includes an "Open full app ↗" row. Desktop-only: leave app windows out of `MOBILE_FEED` (the apps gate small screens themselves).

**Iframe lifecycle (memory)**: nothing loads until a window opens (`data-src` → `src` in `openWin`, at the window's real size so app mobile gates don't misfire). Close (✕/Esc) quits: `closeWin` blanks every iframe in the window, releasing memory/GPU/audio, and stashes the URL back in `data-src` so reopening cold-boots it. Minimize (–) keeps the app alive with state. Applies to app windows, clip players, and the reel alike.

**Keyboard**: everything clickable is reachable by keyboard (`pressable()` helper adds role/tabindex/Enter/Space); window chrome and gallery arrows are real `<button>`s; Esc closes the topmost window on desktop.

**Anything with `data-open="<id>"`** (menu items, rows inside window bodies) opens that window on click.

## Conventions

- **Brand**: `--ink #111`, `--paper #f4f2ec`, `--desk #c8c4b8`; 2px solid ink borders; hard offset shadows (6px windows, 3px buttons); Space Mono for UI, Archivo (heavy, condensed, uppercase) for display type.
- **No em dashes** anywhere in copy (owner dislikes them, reads as AI-written). Use commas, colons, or the middot ` · `.
- **Prefer simple over optimal**: no config/infra/optimizations unless there's a user-visible problem.

## Known placeholders

- The `xr` and `anim` windows are clip players (`XR_VIDEOS`/`ANIM_VIDEOS` in site-data.js; `clipPlayerBody(ns, list)` builds the markup, `initClipPlayer(ns, list)` in both renderers wires it; only the current clip's iframe loads). Add a clip = add a `{title, tag, src}` entry.
- Vimeo reel id 350908783 is the current reel (also in `ANIM_VIDEOS` as HAS CG Reel); swap when recut.
- The has.tools widget stage is a text placeholder; swap the `.stage-note` div for an `<img>` (e.g. `img/hastools-card.png`) when a real capture exists.
- Old santizo.com page URLs (hello.html, animation.html, xr.html, images/) will 404 once the domain points here; add redirects in a vercel.json if that ever matters.

## Analytics

Vercel Web Analytics (cookieless, no consent banner). Snippet in index.html and boring.html. `openWin` (desktop) and `setCollapsed` (mobile) fire a custom `open_window` event with the window id, so the dashboard shows which windows visitors actually open — the whole OS is one URL, so plain pageviews alone would be thin. Must be enabled in the Vercel dashboard (Project → Analytics) for `/_vercel/insights/script.js` to serve; until then the shim harmlessly queues.

## Deep links

`index.html?open=<window id>` opens that window (desktop) or scrolls to and expands that card (mobile), e.g. `?open=anim`, `?open=bm`. boring.html uses these for its work links.

## Preview

`python3 -m http.server 8898` in this folder (also in `.claude/launch.json` as `santizo-os`), or just open `index.html` directly in a browser.
