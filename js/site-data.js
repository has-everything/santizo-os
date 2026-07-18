/* SantizoOS content. This is the file to edit when changing what's on the
   desktop: windows, desktop icons, gallery photos, and the trash.
   js/os.js reads these globals and renders everything.

   A window entry:
     title   window title bar text
     width   base width in px (maximize scales it 1.6x, capped to the desktop)
     x, y    initial position (x is re-clamped to the desktop on load)
     open    whether it starts open
     body    inner HTML of the window body
   Optional:
     file       marks it as a deletable desktop file; value is the trash label
     dockRight  position against the right edge on load, ignoring x
     dockBottom position the window's top edge this many px above the desktop
                bottom on load, ignoring y (keeps layouts working on tall screens)
     stageHeights  [normal, maximized] height for a .stage element in the body
     maxFull    maximize fills the whole desktop (media windows) instead of 1.6x;
                with maxAspect (w/h of the media) + maxChrome (px of non-media
                height) the width is capped so the window still fits the page
*/

var PHOTOS = [];
for (var i = 2; i <= 19; i++) {
  PHOTOS.push('img/hector_santizo_burning_man_' + String(i).padStart(3, '0') + '.jpg');
}

var TRASH_NAME = 'bad ideas';
var TRASH_FIXED = ['make_the_logo_bigger.psd', 'just_use_a_template.html', 'play_it_safe.plan'];

/* Clip players (stage + prev/next + playlist). clipPlayerBody() builds the
   window body; js/os.js and js/mobile.js wire it via initClipPlayer(ns, list).
   Only the first clip's iframe is in the HTML (lazy); switching swaps src. */
function clipPlayerBody(ns, videos) {
  return '<div class="stage stage-video"><iframe id="' + ns + 'Frame" src="' + videos[0].src.replace(/&/g, '&amp;') + '" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="' + videos[0].title + '"></iframe></div>' +
    '<div class="gallery-bar">' +
      '<button type="button" class="nav-btn" id="' + ns + 'Prev" aria-label="Previous clip">◀</button>' +
      '<button type="button" class="nav-btn" id="' + ns + 'Next" aria-label="Next clip">▶</button>' +
      '<span class="gallery-counter" id="' + ns + 'Counter">1 / ' + videos.length + '</span>' +
      '<span class="gallery-note" id="' + ns + 'Title">' + videos[0].title + '</span>' +
    '</div>' +
    videos.map(function (v, i) {
      return '<span class="row row-slim ' + ns + '-row' + (i === 0 ? ' row-active' : '') + '" data-video="' + i + '">' +
        '<span>▸ ' + v.title + '</span><span class="dim">' + v.tag + '</span></span>';
    }).join('');
}

/* App windows: a has.tools app running inside the OS in an iframe, with an
   escape-hatch row to the real thing. data-src (not src): the engine loads
   the app only when the window first opens, at the window's real size, so
   the app's own mobile gate doesn't misfire from a hidden zero-width load.
   Desktop-only: don't add app windows to MOBILE_FEED (phones use links). */
function appWindowBody(name, src) {
  return '<div class="stage stage-app"><iframe data-src="' + src + '" allow="fullscreen; clipboard-write" title="' + name + '"></iframe></div>' +
    '<a class="row row-first" href="' + src + '" target="_blank" rel="noopener"><span>↗ Open full app</span><span class="dim">' + src.replace('https://', '') + '</span></a>';
}

var ANIM_VIDEOS = [
  { title: 'Roboto', tag: 'Plasticity · Unity · C#', src: 'https://player.vimeo.com/video/1056096066?autopause=0&muted=1&loop=1&title=0&byline=0&portrait=0' },
  { title: 'HAS CG Reel', tag: 'art direction · sim · lighting', src: 'https://player.vimeo.com/video/350908783?autopause=0&muted=1&loop=1&title=0&byline=0&portrait=0' },
  { title: 'Star trails', tag: 'concept · art · animation', src: 'https://player.vimeo.com/video/269102770?autopause=0&muted=1&loop=1&title=0&byline=0&portrait=0' },
  { title: 'Evidence of Existence', tag: '360 VR · particles', src: 'https://player.vimeo.com/video/207575582?autopause=0&muted=1&loop=1&title=0&byline=0&portrait=0' },
  { title: 'Visual Alternatives', tag: 'audio-visual · Unity', src: 'https://www.youtube.com/embed/FrM8C7vHTow' },
  { title: 'Real-time interactive app', tag: 'Unity · real-time', src: 'https://player.vimeo.com/video/548921641?autopause=0&muted=1&loop=1&title=0&byline=0&portrait=0' }
];

var XR_VIDEOS = [
  { title: 'HAS Photo Booth', tag: 'MediaPipe · browser', src: 'https://www.youtube.com/embed/1L2anMG2k-8' },
  { title: 'Hand Tracker', tag: 'MediaPipe · JavaScript', src: 'https://www.youtube.com/embed/2WZzjRuMJU0' },
  { title: 'Wrist Interaction', tag: 'tracked transforms', src: 'https://player.vimeo.com/video/989005478?autopause=0&muted=1&loop=1&title=0&byline=0&portrait=0' },
  { title: 'Interactive 3D Calculator', tag: 'gesture math', src: 'https://player.vimeo.com/video/1001763153?autopause=0&muted=1&loop=1&title=0&byline=0&portrait=0' },
  { title: 'Interactive Gauge Control', tag: 'VR/AR dials', src: 'https://player.vimeo.com/video/982232014?autopause=0&muted=1&loop=1&title=0&byline=0&portrait=0' },
  { title: 'Arrow Grid System', tag: 'VR interaction', src: 'https://player.vimeo.com/video/990364072?autopause=0&muted=1&loop=1&title=0&byline=0&portrait=0' },
  { title: 'Pinch Twist Interaction', tag: 'hand gesture', src: 'https://player.vimeo.com/video/990453573?autopause=0&muted=1&loop=1&title=0&byline=0&portrait=0' }
];

var FILE_HINT = '<div class="file-hint">drag this window (or its desktop icon) onto the trash to delete</div>';

var WINDOWS = {

  reel: {
    title: 'Showreel 2026',
    width: 960, x: 40, y: 62, open: true,
    maxFull: true, maxAspect: 16 / 9, maxChrome: 64,
    body:
      /* the shield sits over the iframe so clicks reach the window: focus
         to front, and the video area doubles as a drag handle (the player
         is a chrome-less background loop, so it needs no clicks itself) */
      '<div class="reel-frame"><iframe src="https://player.vimeo.com/video/350908783?autoplay=1&amp;loop=1&amp;background=1&amp;muted=1" loading="lazy" allow="autoplay" title="Reel"></iframe><span class="frame-shield"></span></div>' +
      '<div class="reel-foot"><span>▶ playing · loop</span><span>350908783.mov</span></div>'
  },

  /* defined right after reel so it stacks above it but under about/work */
  hastools: {
    title: 'has.tools · free creative tools',
    width: 640, x: 740, y: 300, dockBottom: 580, open: false, stageHeights: [300, 470], maxFull: true,
    body:
      '<div class="stage"><div class="stage-note">has.tools · showcase still coming soon</div></div>' +
      '<div class="widget-caption">Free browser tools for motion designers, 3D artists, and creative coders. Splay · HAS Lathe · HAS Dither · more.</div>' +
      '<a class="row row-first" href="https://www.has.tools" target="_blank" rel="noopener"><span>🛠 Explore all 7 tools</span><span class="dim">has.tools ↗</span></a>'
  },

  about: {
    title: 'About This Human',
    width: 400, x: 730, y: 110, open: true, dockRight: true,
    body:
      '<div class="prose">' +
        '<div class="headline">Hector Santizo</div>' +
        '<div class="role">3D Motion Designer &amp; Creative Technologist</div>' +
        '<div class="blurb">I design and animate in 3D, build real-time and XR experiences in Unity, and make free tools for creative people. Los Angeles. Complex in, clear out.</div>' +
        '<div class="btn-row">' +
          '<a class="btn" href="mailto:hector@santizo.com">Email</a>' +
        '</div>' +
      '</div>'
  },

  doc: {
    title: 'about_me.txt',
    width: 400, x: 300, y: 150, open: false, file: 'about_me.txt',
    body:
      '<div class="file-text">Hector Augusto Santizo<br>creative technologist &amp; 3D motion designer<br>Los Angeles, CA<br><br>I turn ideas into immersive experiences, blending design, animation, and code: real-time graphics, generative AI, XR.<br><br>From ambiguity to clarity. From prototype to production.<br><br>Also: free creative tools at has.tools, and five years of Burning Man photos in playa_stills.</div>' + FILE_HINT
  },

  work: {
    title: 'Selected Work · 3 items',
    width: 560, x: 110, y: 580, dockBottom: 220, open: true,
    body:
      '<span class="row" data-open="anim"><span>📁 Motion &amp; Animation</span><span class="dim">Unity · CG · immersive</span></span>' +
      '<span class="row" data-open="xr"><span>📁 XR &amp; Interaction</span><span class="dim">hands · gesture · spatial</span></span>' +
      '<span class="row" data-open="hastools"><span>🛠 Creative Tools</span><span class="dim">7 free tools · has.tools</span></span>'
  },

  anim: {
    title: '3d_animation · 6 clips',
    width: 560, x: 340, y: 120, open: false,
    maxFull: true, maxAspect: 16 / 9, maxChrome: 290, stageHeights: [315, 470],
    body: clipPlayerBody('anim', ANIM_VIDEOS)
  },

  xr: {
    title: 'xr_interaction · 7 clips',
    width: 560, x: 400, y: 150, open: false,
    maxFull: true, maxAspect: 16 / 9, maxChrome: 320, stageHeights: [315, 470],
    body: clipPlayerBody('xr', XR_VIDEOS)
  },

  trash: {
    title: 'bad ideas · 3 items',
    width: 360, x: 560, y: 400, open: false,
    body:
      '<div class="trash-list">' +
        TRASH_FIXED.map(function (f) { return '<div class="trash-row">🗎 ' + f + '</div>'; }).join('') +
        '<div id="trashDynamic"></div>' +
        '<div class="trash-hint">click a trashed file to put it back</div>' +
      '</div>'
  },

  bm: {
    title: 'playa_stills · Burning Man',
    width: 480, x: 220, y: 110, open: false, stageHeights: [310, 470], maxFull: true,
    body:
      '<div class="stage"><img id="photoImg" alt="Burning Man photograph by Hector Santizo" loading="lazy"></div>' +
      '<div class="gallery-bar">' +
        '<button type="button" class="nav-btn" id="photoPrev" aria-label="Previous photo">◀</button>' +
        '<button type="button" class="nav-btn" id="photoNext" aria-label="Next photo">▶</button>' +
        '<span class="gallery-counter" id="photoCounter"></span>' +
        '<span class="gallery-note">Black Rock City · 5 years of dust &amp; light</span>' +
      '</div>'
  },

  lathe: {
    title: 'HAS Lathe · 3D vessel modeler',
    width: 960, x: 200, y: 90, open: false, maxFull: true, stageHeights: [520, 520],
    body: appWindowBody('HAS Lathe', 'https://has.tools/apps/lathe/')
  },

  dither: {
    title: 'HAS Dither · node-based dithering',
    width: 960, x: 240, y: 120, open: false, maxFull: true, stageHeights: [520, 520],
    body: appWindowBody('HAS Dither', 'https://has.tools/apps/dither/')
  },

  cabinet: {
    title: 'HAS Cabinet · parametric shelving',
    width: 960, x: 280, y: 150, open: false, maxFull: true, stageHeights: [520, 520],
    body: appWindowBody('HAS Cabinet', 'https://has.tools/apps/cabinet/')
  },

  manifesto: {
    title: 'manifesto.txt',
    width: 360, x: 280, y: 170, open: false, file: 'manifesto.txt',
    body:
      '<div class="file-text">1. ship weird ideas that inspire ✷<br>2. prototype &gt; slide deck: build to inspire<br>3. make tech feel human, make it inspire<br>4. every frame on purpose, every frame to inspire<br>5. when in doubt, add dust and inspire</div>' + FILE_HINT
  },

  notes: {
    title: 'reel_notes.md',
    width: 360, x: 320, y: 230, open: false, file: 'reel_notes.md',
    body:
      '<div class="file-text">00:04, particle swarm opener<br>00:19, hand-tracked UI grab<br>00:31, Unity real-time env<br>00:47, playa time-lapse<br>TODO: recut for 2027, tighter.</div>' + FILE_HINT
  },

  readme: {
    title: 'README.txt',
    width: 380, x: 720, y: 440, open: true, file: 'README.txt',
    body:
      '<div class="file-text">welcome to SantizoOS ✷<br><br>☐ drag any window by its bar (yes, this one)<br>☐ the ❐ button makes videos huge<br>☐ menu up top: reel, work, photos<br>☐ 🏺 🎛 🗄 are real apps, click one<br>☐ drag a file onto the trash, it&#39;s fine<br><br>done? close me with the ✕ up top ↖</div>'
  }

};

/* Desktop icons, top to bottom, bottom-anchored along the right edge.
   id opens that WINDOWS key; href instead opens an external link (shortcut).
   col: 1 puts the icon one column further left (default 0 = rightmost). */
var ICONS = [
  { id: 'bm',        glyph: '🔥', label: 'burning_man' },
  { id: 'manifesto', glyph: '🗎', label: 'manifesto.txt' },
  { id: 'notes',     glyph: '🗎', label: 'reel_notes.md' },
  { id: 'readme',    glyph: '🗎', label: 'README.txt' },
  { id: 'hastools',  glyph: '🛠', label: 'has.tools', col: 1 },
  { id: 'doc',       glyph: '🗎', label: 'about_me.txt', col: 1 },
  { id: 'ig', glyph: '📷', label: 'instagram', href: 'https://www.instagram.com/has_projects/', col: 1 },
  { id: 'yt', glyph: '📺', label: 'youtube', href: 'https://www.youtube.com/@has.studio', col: 1 },
  { id: 'lathe', glyph: '🏺', label: 'HAS Lathe', col: 2 },
  { id: 'dither', glyph: '🎛', label: 'HAS Dither', col: 2 },
  { id: 'cabinet', glyph: '🗄', label: 'HAS Cabinet', col: 2 }
];

/* Mobile feed (≤820px): the same windows rendered as stacked cards, in this
   order. collapsed: true renders the card rolled up (tap the bar to open). */
var MOBILE_FEED = [
  { id: 'reel' },
  { id: 'about' },
  { id: 'doc', collapsed: true },
  { id: 'work' },
  { id: 'hastools' },
  { id: 'bm' },
  { id: 'anim', collapsed: true },
  { id: 'xr', collapsed: true },
  { id: 'manifesto', collapsed: true },
  { id: 'notes', collapsed: true },
  /* readme is desktop-only: its instructions (drag, maximize, trash) don't
     apply to the mobile feed */
  { id: 'trash', collapsed: true }
];
