/* SantizoOS window manager. Content lives in js/site-data.js; this engine
   renders it and handles window dragging, focus, minimize/maximize, desktop
   icons, drag-to-trash with restore, the photo gallery, the menu clock, and
   initial layout. It should rarely need editing to change site content.
   Below 820px it hands off to SantizoMobile (js/mobile.js) instead. */
(function () {
  'use strict';

  /* ---------- clock (runs in both modes) ---------- */

  function tick() {
    var d = new Date();
    var h = d.getHours();
    var m = String(d.getMinutes()).padStart(2, '0');
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    document.getElementById('clock').textContent = h + ':' + m + ' ' + ap;
  }
  tick();
  setInterval(tick, 15000);

  /* ---------- mode boot ---------- */

  var mq = window.matchMedia('(max-width: 820px)');
  /* crossing the breakpoint rebuilds the page in the other mode */
  mq.addEventListener('change', function () { location.reload(); });

  if (mq.matches) {
    document.body.classList.add('mode-mobile');
    SantizoMobile.init();
    return;
  }

  /* ---------- desktop mode ---------- */

  var desk = document.getElementById('desktop');
  var trashTarget = document.getElementById('trashTarget');
  var deskW = 1180;
  var gulpTimer = null;

  var winEls = {};
  var iconEls = {};

  var state = { wins: {}, icons: {}, deleted: {}, photoIndex: 0, topZ: 0 };
  Object.keys(WINDOWS).forEach(function (id, i) {
    var def = WINDOWS[id];
    state.wins[id] = { x: def.x, y: def.y, z: i + 1, open: !!def.open, min: false, max: false };
    if (def.file) state.deleted[id] = false;
    state.topZ = i + 1;
  });
  ICONS.forEach(function (ic) { state.icons[ic.id] = { x: -200, y: 0 }; });

  /* ---------- construction ---------- */

  /* click + Enter/Space keyboard activation for non-native controls */
  function pressable(el, fn) {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.addEventListener('click', fn);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); }
    });
  }

  function buildWin(id) {
    var el = document.createElement('div');
    el.className = 'win';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', WINDOWS[id].title);
    el.innerHTML =
      '<div class="win-bar">' +
        '<button type="button" class="win-btn" data-nodrag data-act="close" title="Close" aria-label="Close window">✕</button>' +
        '<span class="win-title"></span>' +
        '<button type="button" class="win-btn" data-nodrag data-act="min" title="Minimize (roll up)" aria-label="Minimize window">–</button>' +
        '<button type="button" class="win-btn win-btn-max" data-nodrag data-act="max" title="Maximize" aria-label="Maximize window">❐</button>' +
      '</div>' +
      '<div class="win-body">' + WINDOWS[id].body + '</div>';
    el.querySelector('.win-title').textContent = WINDOWS[id].title;
    el.addEventListener('pointerdown', function () { focus(id); });
    el.querySelector('[data-act=close]').addEventListener('click', function () { closeWin(id); });
    el.querySelector('[data-act=min]').addEventListener('click', function () { toggleMin(id); });
    el.querySelector('[data-act=max]').addEventListener('click', function () { toggleMax(id); });
    el.querySelector('.win-bar').addEventListener('pointerdown', function (e) { dragStart(id, e); });
    desk.appendChild(el);
    winEls[id] = el;
  }

  /* icons with href are real links to external sites; the rest open windows */
  function buildIcon(ic) {
    var el;
    if (ic.href) {
      el = document.createElement('a');
      el.href = ic.href;
      el.target = '_blank';
      el.rel = 'noopener';
      el.title = ic.href;
      el.draggable = false; /* our pointer drag, not the browser's link drag */
    } else {
      el = document.createElement('span');
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWin(ic.id); }
      });
    }
    el.className = 'icon';
    el.innerHTML = '<span class="icon-glyph">' + ic.glyph + '</span>' + ic.label;
    el.addEventListener('pointerdown', function (e) { iconDrag(ic, e); });
    desk.appendChild(el);
    iconEls[ic.id] = el;
  }

  /* ---------- rendering ---------- */

  function maxWidth(id) {
    return Math.round(Math.min(WINDOWS[id].width * 1.6, deskW - 48));
  }

  function applyWin(id) {
    var w = state.wins[id];
    var el = winEls[id];
    el.style.display = w.open ? 'block' : 'none';
    el.style.left = Math.round(w.x) + 'px';
    el.style.top = Math.round(w.y) + 'px';
    el.style.zIndex = w.z;
    el.style.width = (w.max ? maxWidth(id) : WINDOWS[id].width) + 'px';
    el.querySelector('.win-body').style.display = w.min ? 'none' : 'block';
    var sh = WINDOWS[id].stageHeights;
    if (sh) el.querySelector('.stage').style.height = (w.max ? sh[1] : sh[0]) + 'px';
  }

  function applyIcon(id) {
    var el = iconEls[id];
    el.style.display = state.deleted[id] ? 'none' : 'flex';
    el.style.left = Math.round(state.icons[id].x) + 'px';
    el.style.top = Math.round(state.icons[id].y) + 'px';
  }

  function applyAll() {
    Object.keys(state.wins).forEach(applyWin);
    Object.keys(state.icons).forEach(applyIcon);
  }

  /* ---------- window behavior ---------- */

  function focus(id) {
    state.topZ += 1;
    state.wins[id].z = state.topZ;
    winEls[id].style.zIndex = state.topZ;
  }

  function openWin(id) {
    if (state.deleted[id]) return;
    state.wins[id].open = true;
    state.wins[id].min = false;
    applyWin(id);
    focus(id);
  }

  function closeWin(id) {
    state.wins[id].open = false;
    applyWin(id);
  }

  function toggleMin(id) {
    state.wins[id].min = !state.wins[id].min;
    applyWin(id);
  }

  function toggleMax(id) {
    var w = state.wins[id];
    w.max = !w.max;
    w.min = false;
    var width = w.max ? maxWidth(id) : WINDOWS[id].width;
    w.x = Math.max(12, Math.min(w.x, deskW - width - 24));
    applyWin(id);
    focus(id);
  }

  /* ---------- trash ---------- */

  function trashCount() {
    return Object.keys(state.deleted).filter(function (id) { return state.deleted[id]; }).length;
  }

  function renderTrash() {
    var dyn = document.getElementById('trashDynamic');
    dyn.innerHTML = '';
    Object.keys(state.deleted).forEach(function (id) {
      if (!state.deleted[id]) return;
      var row = document.createElement('div');
      row.className = 'trash-row trash-restore';
      row.innerHTML = '<span>🗎 ' + WINDOWS[id].file + '</span><span class="dim">put back ↩</span>';
      pressable(row, function () { restoreFile(id); });
      dyn.appendChild(row);
    });
    winEls.trash.querySelector('.win-title').textContent =
      TRASH_NAME + ' · ' + (TRASH_FIXED.length + trashCount()) + ' items';
  }

  function trashFile(id) {
    state.deleted[id] = true;
    state.wins[id].open = false;
    applyWin(id);
    applyIcon(id);
    renderTrash();
    trashTarget.classList.remove('gulp');
    void trashTarget.offsetWidth; /* restart the animation if it is mid-gulp */
    trashTarget.classList.add('gulp');
    clearTimeout(gulpTimer);
    gulpTimer = setTimeout(function () { trashTarget.classList.remove('gulp'); }, 700);
  }

  function restoreFile(id) {
    state.deleted[id] = false;
    applyIcon(id);
    renderTrash();
  }

  function setTrashHot(hot) {
    trashTarget.classList.toggle('hot', hot);
  }

  function overTrash(ev) {
    var r = trashTarget.getBoundingClientRect();
    return ev.clientX >= r.left - 14 && ev.clientX <= r.right + 14 &&
           ev.clientY >= r.top - 14 && ev.clientY <= r.bottom + 14;
  }

  /* ---------- dragging ---------- */

  function dragStart(id, e) {
    if (e.target.closest('[data-nodrag]')) return;
    if (e.target.closest('a')) return;
    e.preventDefault();
    focus(id);
    var w = state.wins[id];
    var sx = e.clientX, sy = e.clientY, ox = w.x, oy = w.y;
    var deletable = !!WINDOWS[id].file;
    var move = function (ev) {
      w.x = ox + (ev.clientX - sx);
      w.y = Math.max(32, oy + (ev.clientY - sy));
      applyWin(id);
      if (deletable) setTrashHot(overTrash(ev));
    };
    var up = function (ev) {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (deletable && overTrash(ev)) {
        w.x = ox;
        w.y = oy;
        trashFile(id);
      }
      setTrashHot(false);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  function iconDrag(icon, e) {
    /* canceling pointerdown would also suppress the native click link icons
       rely on, so only cancel it for window icons */
    if (!icon.href) e.preventDefault();
    var id = icon.id;
    var ic = state.icons[id];
    var sx = e.clientX, sy = e.clientY, ox = ic.x, oy = ic.y;
    var def = WINDOWS[id];
    var deletable = !!(def && def.file);
    var moved = false;
    var move = function (ev) {
      if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 6) moved = true;
      if (!moved) return;
      ic.x = ox + (ev.clientX - sx);
      ic.y = Math.max(34, oy + (ev.clientY - sy));
      applyIcon(id);
      if (deletable) setTrashHot(overTrash(ev));
    };
    var up = function (ev) {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setTrashHot(false);
      if (!moved) {
        /* link icons navigate via their native click; window icons open here */
        if (!icon.href) openWin(id);
        return;
      }
      /* it was a drag: swallow the click that follows so link icons don't navigate */
      if (icon.href) {
        iconEls[id].addEventListener('click', function (ce) {
          ce.preventDefault();
          ce.stopPropagation();
        }, { capture: true, once: true });
      }
      if (deletable && overTrash(ev)) {
        ic.x = ox;
        ic.y = oy;
        trashFile(id);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  /* ---------- photo gallery ---------- */

  function updateGallery() {
    var img = document.getElementById('photoImg');
    if (!img) return;
    img.src = PHOTOS[state.photoIndex];
    document.getElementById('photoCounter').textContent =
      (state.photoIndex + 1) + ' / ' + PHOTOS.length;
  }

  function photoStep(dir) {
    state.photoIndex = (state.photoIndex + dir + PHOTOS.length) % PHOTOS.length;
    updateGallery();
  }

  /* ---------- layout ---------- */

  function fitToDesktop() {
    var W = desk.offsetWidth, H = desk.offsetHeight;
    deskW = W;
    Object.keys(state.wins).forEach(function (id) {
      var def = WINDOWS[id];
      if (def.dockRight) state.wins[id].x = Math.max(24, W - def.width - 48);
      state.wins[id].x = Math.min(state.wins[id].x, Math.max(12, W - def.width - 20));
    });
    /* bottom-anchored columns from the right edge (col 0 rightmost) */
    var cols = {};
    ICONS.forEach(function (ic) {
      var c = ic.col || 0;
      (cols[c] = cols[c] || []).push(ic);
    });
    Object.keys(cols).forEach(function (c) {
      cols[c].forEach(function (ic, i) {
        state.icons[ic.id] = { x: W - 140 - 110 * c, y: H - 220 - 80 * (cols[c].length - 1 - i) };
      });
    });
    applyAll();
  }

  /* ---------- init ---------- */

  Object.keys(WINDOWS).forEach(buildWin);
  ICONS.forEach(buildIcon);

  document.querySelectorAll('[data-open]').forEach(function (el) {
    pressable(el, function () { openWin(el.getAttribute('data-open')); });
  });
  pressable(trashTarget, function () { openWin('trash'); });

  /* Esc closes the topmost open window */
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var top = null;
    Object.keys(state.wins).forEach(function (id) {
      if (state.wins[id].open && (!top || state.wins[id].z > state.wins[top].z)) top = id;
    });
    if (top) closeWin(top);
  });
  var prev = document.getElementById('photoPrev');
  var next = document.getElementById('photoNext');
  if (prev) prev.addEventListener('click', function () { photoStep(-1); });
  if (next) next.addEventListener('click', function () { photoStep(1); });

  renderTrash();
  updateGallery();
  fitToDesktop();
  /* the desktop can measure 0 wide until the page is actually displayed */
  if (!desk.offsetWidth && 'ResizeObserver' in window) {
    var ro = new ResizeObserver(function () {
      if (!desk.offsetWidth) return;
      fitToDesktop();
      ro.disconnect();
    });
    ro.observe(desk);
  }
})();
