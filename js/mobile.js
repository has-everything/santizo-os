/* SantizoOS mobile renderer. Below 820px the desktop metaphor doesn't fit,
   so the same WINDOWS content renders as a stacked feed of collapsible cards.
   Order and initial collapsed state come from MOBILE_FEED in js/site-data.js.
   js/os.js decides which mode boots; this file only defines SantizoMobile. */
var SantizoMobile = {
  init: function () {
    'use strict';
    var feed = document.getElementById('feed');

    /* click + Enter/Space keyboard activation for non-native controls */
    function pressable(el, fn) {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.addEventListener('click', fn);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); }
      });
    }

    function setCollapsed(card, collapsed) {
      card.classList.toggle('collapsed', collapsed);
      card.querySelector('.card-toggle').textContent = collapsed ? '+' : '–';
      card.querySelector('.card-bar').setAttribute('aria-expanded', String(!collapsed));
    }

    MOBILE_FEED.forEach(function (item) {
      var def = WINDOWS[item.id];
      if (!def) return;
      var card = document.createElement('section');
      card.className = 'card' + (item.collapsed ? ' collapsed' : '');
      card.id = 'card-' + item.id;
      card.innerHTML =
        '<div class="card-bar">' +
          '<span class="win-title"></span>' +
          '<span class="card-toggle">' + (item.collapsed ? '+' : '–') + '</span>' +
        '</div>' +
        '<div class="win-body">' + def.body + '</div>';
      card.querySelector('.win-title').textContent = def.title;
      /* desktop-only hints (drag to trash, put back) make no sense in the feed */
      card.querySelectorAll('.file-hint, .trash-hint').forEach(function (el) { el.remove(); });
      var bar = card.querySelector('.card-bar');
      bar.setAttribute('aria-expanded', String(!item.collapsed));
      pressable(bar, function () {
        setCollapsed(card, !card.classList.contains('collapsed'));
      });
      feed.appendChild(card);
    });

    /* menu items and window rows with data-open scroll to that card */
    function reveal(id) {
      var card = document.getElementById('card-' + id);
      if (!card) return;
      setCollapsed(card, false);
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      card.classList.remove('flash');
      void card.offsetWidth; /* restart the flash animation */
      card.classList.add('flash');
    }
    document.querySelectorAll('[data-open]').forEach(function (el) {
      pressable(el, function () { reveal(el.getAttribute('data-open')); });
    });

    /* xr clip player */
    var xrFrame = document.getElementById('xrFrame');
    if (xrFrame) {
      var xrIdx = 0;
      var showClip = function (i) {
        xrIdx = (i + XR_VIDEOS.length) % XR_VIDEOS.length;
        xrFrame.src = XR_VIDEOS[xrIdx].src;
        xrFrame.title = XR_VIDEOS[xrIdx].title;
        document.getElementById('xrCounter').textContent = (xrIdx + 1) + ' / ' + XR_VIDEOS.length;
        document.getElementById('xrTitle').textContent = XR_VIDEOS[xrIdx].title;
        document.querySelectorAll('.xr-row').forEach(function (r, j) {
          r.classList.toggle('row-active', j === xrIdx);
        });
      };
      document.getElementById('xrPrev').addEventListener('click', function () { showClip(xrIdx - 1); });
      document.getElementById('xrNext').addEventListener('click', function () { showClip(xrIdx + 1); });
      document.querySelectorAll('.xr-row').forEach(function (r) {
        pressable(r, function () { showClip(parseInt(r.getAttribute('data-video'), 10)); });
      });
    }

    /* photo gallery */
    var idx = 0;
    function update() {
      document.getElementById('photoImg').src = PHOTOS[idx];
      document.getElementById('photoCounter').textContent = (idx + 1) + ' / ' + PHOTOS.length;
    }
    document.getElementById('photoPrev').addEventListener('click', function () {
      idx = (idx + PHOTOS.length - 1) % PHOTOS.length; update();
    });
    document.getElementById('photoNext').addEventListener('click', function () {
      idx = (idx + 1) % PHOTOS.length; update();
    });
    update();
  }
};
