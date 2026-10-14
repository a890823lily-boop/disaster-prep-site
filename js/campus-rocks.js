(function () {
  'use strict';

  /* =========================================================
   * 我們的校園岩石：學生在「校園岩石偵查站」記錄的觀察與照片
   * 資料整理自偵查站的記錄（2026 年 10 月 14 日）。
   * ========================================================= */

  var SPOTS = [
    {
      color: '#be123c',
      location: '鋼琴步道',
      use: '仁愛國小紀念碑',
      photos: [
        { src: 'images/rocks/spot1-1.jpg', alt: '鋼琴步道旁的紀念碑石，整塊石頭的樣子' },
        { src: 'images/rocks/spot1-2.jpg', alt: '紀念碑石表面近照，有白色紋路' }
      ],
      obs: { grain: '看得到', layer: '沒有', surface: ['粗糙'], pattern: '' },
      other: '石頭旁有紋路、白紋，但不確定是否是自然造成',
      guess: '不確定',
      think: '白色的紋路是岩石本來就有的礦物條紋，還是後來附著的青苔或污漬？靠近看、用手摸摸看：紋路是長在石頭裡面，還是只在表面？'
    },
    {
      color: '#1d4ed8',
      location: '靠近操場旁邊的地板',
      use: '地板',
      photos: [
        { src: 'images/rocks/spot2-3.jpg', alt: '操場旁的地板全景' },
        { src: 'images/rocks/spot2-2.jpg', alt: '地板近照，許多深色小石頭' },
        { src: 'images/rocks/spot2-1.jpg', alt: '地板近照，細小的斑點' }
      ],
      obs: { grain: '看得到', layer: '沒有', surface: ['粗糙'], pattern: '斑點' },
      other: '由許多石頭組成',
      guess: '沉積岩',
      think: '很多小石頭黏在一起，看起來很像礫岩。不過，這些小石頭是自然膠結在一起的，還是工人用水泥把石頭鋪上去的？找找看有沒有接縫或水泥的痕跡。'
    },
    {
      color: '#c2410c',
      location: '文史走廊',
      use: '地板',
      photos: [
        { src: 'images/rocks/spot3-3.jpg', alt: '文史走廊的地板全景，一格一格的' },
        { src: 'images/rocks/spot3-1.jpg', alt: '走廊地板近照，有許多小斑點' },
        { src: 'images/rocks/spot3-2.jpg', alt: '走廊地板近照，表面光滑會反光' }
      ],
      obs: { grain: '看得到', layer: '沒有', surface: ['光滑', '會反光'], pattern: '斑點' },
      other: '',
      guess: '不確定',
      think: '表面光滑又會反光，是天然石材磨亮的，還是把碎石和水泥混在一起再磨亮的「磨石子」地板？看看斑點的大小和顏色是不是很平均，地板上有沒有一格一格的分隔條。'
    }
  ];

  var OBS_LABELS = [['grain', '顆粒'], ['layer', '分層'], ['surface', '表面'], ['pattern', '花紋']];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function initCampus() {
    var list = document.querySelector('.campus-list');
    if (!list) return;

    var dialog = document.querySelector('.photo-dialog');
    var dialogImg = dialog && dialog.querySelector('img');
    var dialogCap = dialog && dialog.querySelector('.photo-dialog-cap');

    function openPhoto(photo, title) {
      if (!dialog || !dialog.showModal) {
        window.open(photo.src, '_blank');
        return;
      }
      dialogImg.src = photo.src;
      dialogImg.alt = photo.alt;
      dialogCap.textContent = title + '：' + photo.alt;
      dialog.showModal();
    }

    if (dialog) {
      dialog.querySelector('.photo-dialog-close').addEventListener('click', function () { dialog.close(); });
      dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    }

    SPOTS.forEach(function (spot, i) {
      var title = '偵查點 ' + (i + 1);
      var card = el('article', 'campus-card');
      card.style.setProperty('--c', spot.color);

      var head = el('header', 'campus-head');
      head.appendChild(el('span', 'campus-num', title));
      head.appendChild(el('h3', null, spot.location));
      card.appendChild(head);

      // 照片
      var current = 0;
      var main = el('button', 'campus-main');
      main.type = 'button';
      var mainImg = el('img');
      mainImg.loading = 'lazy';
      main.appendChild(mainImg);
      main.appendChild(el('span', 'campus-zoom', '點一下放大'));
      main.addEventListener('click', function () { openPhoto(spot.photos[current], title); });
      card.appendChild(main);

      var thumbs = el('div', 'campus-thumbs');
      function show(k) {
        current = k;
        mainImg.src = spot.photos[k].src;
        mainImg.alt = spot.photos[k].alt;
        main.setAttribute('aria-label', '放大照片：' + spot.photos[k].alt);
        Array.prototype.forEach.call(thumbs.children, function (t, ti) {
          t.setAttribute('aria-pressed', String(ti === k));
        });
      }
      spot.photos.forEach(function (photo, k) {
        var t = el('button', 'campus-thumb');
        t.type = 'button';
        t.setAttribute('aria-label', '第 ' + (k + 1) + ' 張照片：' + photo.alt);
        var ti = el('img');
        ti.src = photo.src;
        ti.alt = '';
        ti.loading = 'lazy';
        t.appendChild(ti);
        t.addEventListener('click', function () { show(k); });
        thumbs.appendChild(t);
      });
      card.appendChild(thumbs);
      show(0);

      // 基本資料
      var facts = el('dl', 'campus-facts');
      [['地點', spot.location], ['用途', spot.use]].forEach(function (f) {
        facts.appendChild(el('dt', null, f[0]));
        facts.appendChild(el('dd', null, f[1]));
      });
      card.appendChild(facts);

      // 觀察
      var obs = el('div', 'campus-obs');
      obs.appendChild(el('p', 'campus-label', '我們觀察到'));
      var chips = el('ul', 'campus-chips');
      OBS_LABELS.forEach(function (o) {
        var v = spot.obs[o[0]];
        var values = Array.isArray(v) ? v : (v ? [v] : []);
        if (!values.length) return;
        var li = el('li');
        li.appendChild(el('span', 'chip-k', o[1]));
        li.appendChild(document.createTextNode(values.join('、')));
        chips.appendChild(li);
      });
      obs.appendChild(chips);
      if (spot.other) obs.appendChild(el('p', 'campus-other', '「' + spot.other + '」'));
      card.appendChild(obs);

      // 猜測
      var guess = el('p', 'campus-guess');
      guess.appendChild(el('span', 'campus-label', '我們猜它是'));
      guess.appendChild(el('strong', spot.guess === '不確定' ? 'guess-unsure' : 'guess-yes',
        spot.guess === '不確定' ? '還在調查中' : spot.guess));
      card.appendChild(guess);

      // 一起想一想
      var think = el('div', 'campus-think');
      think.appendChild(el('p', 'campus-label', '🤔 一起想一想'));
      think.appendChild(el('p', null, spot.think));
      card.appendChild(think);

      list.appendChild(card);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCampus);
  } else {
    initCampus();
  }
})();
