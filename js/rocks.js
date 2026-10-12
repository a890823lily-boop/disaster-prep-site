(function () {
  'use strict';

  /* =========================================================
   * 認識岩石：動畫教學影片（SVG 動畫 + 字幕 + 語音旁白）與互動問答
   * 每個章節有一個場景，旁白每播一句就推進一個步驟（step），
   * 場景中標記 data-s="n" 的元素在第 n 步出現，data-hide="n" 的元素在第 n 步消失。
   * ========================================================= */

  var SEC_PER_CHAR = 0.23;   // 沒有語音時，每個字的字幕顯示時間
  var LINE_GAP = 0.7;        // 每句之間的停頓（秒）

  /* ---------- 繪圖工具 ---------- */

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function r1(n) { return Math.round(n * 10) / 10; }

  // 不規則的石頭外形（平滑封閉曲線）
  function blobPath(cx, cy, w, h, rand) {
    var pts = [];
    var n = 9;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      var k = 0.86 + rand() * 0.14;
      pts.push([cx + Math.cos(a) * w / 2 * k, cy + Math.sin(a) * h / 2 * k]);
    }
    var d = '';
    for (var j = 0; j < n; j++) {
      var p0 = pts[(j - 1 + n) % n], p1 = pts[j], p2 = pts[(j + 1) % n], p3 = pts[(j + 2) % n];
      if (j === 0) d += 'M' + r1(p1[0]) + ' ' + r1(p1[1]);
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += 'C' + r1(c1x) + ' ' + r1(c1y) + ' ' + r1(c2x) + ' ' + r1(c2y) + ' ' + r1(p2[0]) + ' ' + r1(p2[1]);
    }
    return d + 'Z';
  }

  var uid = 0;

  // 各種岩石的紋理樣本
  function rock(type, cx, cy, w, h, seed) {
    var rand = rng(seed || 7);
    var id = 'rk' + (++uid);
    var x0 = cx - w / 2, y0 = cy - h / 2;
    var shape = blobPath(cx, cy, w, h, rand);
    var t = '';
    var i, x, y, s;

    function rx() { return x0 + rand() * w; }
    function ry() { return y0 + rand() * h; }

    switch (type) {
      case 'granite': // 花崗岩：黑、白、粉紅色的大晶體
        t += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="#d8d2c8"/>';
        var gc = ['#2b2b2b', '#2b2b2b', '#e9a596', '#f7f5f0', '#9a9590', '#e9a596'];
        for (i = 0; i < w * h / 22; i++) {
          s = 1.5 + rand() * 3.2;
          x = rx(); y = ry();
          t += '<path d="M' + r1(x) + ' ' + r1(y - s) + 'l' + r1(s) + ' ' + r1(s * 0.7) + 'l' + r1(-s * 0.4) + ' ' + r1(s) +
            'l' + r1(-s * 1.1) + ' ' + r1(-s * 0.3) + 'z" fill="' + gc[Math.floor(rand() * gc.length)] + '"/>';
        }
        break;
      case 'basalt': // 玄武岩：深色、細小、有氣孔
        t += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="#3c3e43"/>';
        for (i = 0; i < w * h / 8; i++) {
          t += '<circle cx="' + r1(rx()) + '" cy="' + r1(ry()) + '" r="' + r1(0.4 + rand() * 0.6) + '" fill="#5a5d63"/>';
        }
        for (i = 0; i < w * h / 260; i++) {
          s = 1.2 + rand() * 2;
          x = rx(); y = ry();
          t += '<ellipse cx="' + r1(x) + '" cy="' + r1(y) + '" rx="' + r1(s) + '" ry="' + r1(s * 0.8) + '" fill="#1c1d20" stroke="#676a70" stroke-width=".5"/>';
        }
        break;
      case 'sandstone': // 砂岩：黃褐色、分層、細砂粒
        var sb = ['#d9b47c', '#ccA46a', '#e3c48f', '#d2ab72'];
        for (i = 0; i < 7; i++) {
          t += '<rect x="' + x0 + '" y="' + r1(y0 + i * h / 7) + '" width="' + w + '" height="' + r1(h / 7 + 1) + '" fill="' + sb[i % 4] + '"/>';
        }
        for (i = 0; i < w * h / 6; i++) {
          t += '<circle cx="' + r1(rx()) + '" cy="' + r1(ry()) + '" r=".5" fill="' + (rand() > 0.5 ? '#a8834e' : '#f1dcb4') + '"/>';
        }
        break;
      case 'shale': // 頁岩：灰色、很細、薄層
        t += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="#6c7076"/>';
        for (y = y0 + 2; y < y0 + h; y += 2.6 + rand() * 1.6) {
          t += '<path d="M' + x0 + ' ' + r1(y) + 'h' + w + '" stroke="' + (rand() > 0.5 ? '#585c61' : '#80848a') + '" stroke-width="' + r1(0.6 + rand() * 0.8) + '"/>';
        }
        break;
      case 'conglomerate': // 礫岩：小石頭被砂黏在一起
        t += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="#b8a07c"/>';
        var cc = ['#7d7a75', '#a5634a', '#e2dccf', '#5b5f63', '#c9b48d'];
        for (i = 0; i < w * h / 90; i++) {
          s = 3 + rand() * 5;
          t += '<ellipse cx="' + r1(rx()) + '" cy="' + r1(ry()) + '" rx="' + r1(s) + '" ry="' + r1(s * (0.6 + rand() * 0.3)) +
            '" fill="' + cc[Math.floor(rand() * cc.length)] + '" stroke="#00000022"/>';
        }
        break;
      case 'limestone': // 石灰岩：淺色、有貝殼
        t += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="#e5dfcd"/>';
        for (i = 0; i < w * h / 10; i++) {
          t += '<circle cx="' + r1(rx()) + '" cy="' + r1(ry()) + '" r=".5" fill="#c9c1a9"/>';
        }
        for (i = 0; i < Math.max(2, w * h / 500); i++) {
          t += shell(rx(), ry(), 3 + rand() * 3, rand() * 60 - 30);
        }
        break;
      case 'marble': // 大理岩：白色、灰色紋路、亮亮的
        t += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="#f3f1ec"/>';
        for (i = 0; i < 4; i++) {
          y = ry();
          t += '<path d="M' + x0 + ' ' + r1(y) + ' q' + r1(w * 0.25) + ' ' + r1(rand() * 20 - 10) + ' ' + r1(w * 0.5) + ' ' + r1(rand() * 10 - 5) +
            ' t' + r1(w * 0.5) + ' ' + r1(rand() * 10 - 5) + '" stroke="#a9adb3" stroke-width="' + r1(0.5 + rand()) + '" fill="none" opacity=".8"/>';
        }
        for (i = 0; i < Math.max(3, w * h / 300); i++) {
          t += sparkle(rx(), ry(), 1.5 + rand() * 1.5, rand() * 2);
        }
        break;
      case 'slate': // 板岩：深灰色、一片一片
        t += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="#4a5562"/>';
        for (y = y0 + 4; y < y0 + h; y += 5 + rand() * 3) {
          t += '<path d="M' + x0 + ' ' + r1(y) + 'h' + w + '" stroke="#3a434e" stroke-width="1.2"/>';
          t += '<path d="M' + x0 + ' ' + r1(y + 1.2) + 'h' + w + '" stroke="#6a7685" stroke-width=".6"/>';
        }
        break;
      case 'gneiss': // 條紋狀的變質岩
        t += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="#d6cfc3"/>';
        for (y = y0 + 3; y < y0 + h; y += 6 + rand() * 4) {
          t += '<path d="M' + x0 + ' ' + r1(y) + ' q' + r1(w / 4) + ' ' + r1(rand() * 6 - 3) + ' ' + r1(w / 2) + ' 0 t' + r1(w / 2) + ' 0" stroke="#3a3a3a" stroke-width="' + r1(1.5 + rand() * 2) + '" fill="none"/>';
        }
        break;
    }

    return '<g><clipPath id="' + id + '"><path d="' + shape + '"/></clipPath>' +
      '<g clip-path="url(#' + id + ')">' + t + '</g>' +
      '<path d="' + shape + '" fill="none" stroke="#00000055" stroke-width="1.2"/></g>';
  }

  function shell(x, y, s, rot) {
    return '<g transform="translate(' + r1(x) + ' ' + r1(y) + ') rotate(' + r1(rot) + ')">' +
      '<path d="M0 0 L' + r1(-s) + ' ' + r1(-s * 1.1) + ' Q0 ' + r1(-s * 1.8) + ' ' + r1(s) + ' ' + r1(-s * 1.1) + ' Z" fill="#f6f1e2" stroke="#9c8f6e" stroke-width=".6"/>' +
      '<path d="M0 0 L' + r1(-s * 0.5) + ' ' + r1(-s * 1.4) + ' M0 0 L0 ' + r1(-s * 1.5) + ' M0 0 L' + r1(s * 0.5) + ' ' + r1(-s * 1.4) + '" stroke="#9c8f6e" stroke-width=".5"/></g>';
  }

  function sparkle(x, y, s, delay) {
    return '<path class="twinkle" style="animation-delay:' + r1(delay) + 's" d="M' + r1(x) + ' ' + r1(y - s) + 'L' + r1(x + s * 0.3) + ' ' + r1(y - s * 0.3) +
      'L' + r1(x + s) + ' ' + r1(y) + 'L' + r1(x + s * 0.3) + ' ' + r1(y + s * 0.3) + 'L' + r1(x) + ' ' + r1(y + s) + 'L' + r1(x - s * 0.3) + ' ' + r1(y + s * 0.3) +
      'L' + r1(x - s) + ' ' + r1(y) + 'L' + r1(x - s * 0.3) + ' ' + r1(y - s * 0.3) + 'Z" fill="#fff"/>';
  }

  function label(x, y, text, opts) {
    opts = opts || {};
    var size = opts.size || 9;
    var w = text.length * size + 10;
    return '<g' + (opts.attrs || '') + '><rect x="' + r1(x - w / 2) + '" y="' + r1(y - size) + '" width="' + r1(w) + '" height="' + r1(size + 7) + '" rx="4" fill="' +
      (opts.bg || '#ffffffdd') + '"/><text x="' + x + '" y="' + r1(y + 1.5) + '" text-anchor="middle" font-size="' + size + '" font-weight="700" fill="' +
      (opts.color || '#1f2933') + '">' + text + '</text></g>';
  }

  function tag(text, color) {
    return '<g><rect x="10" y="10" width="' + (text.length * 13 + 18) + '" height="22" rx="11" fill="' + color + '"/>' +
      '<text x="19" y="26" font-size="13" font-weight="800" fill="#fff">' + text + '</text></g>';
  }

  function clue(text, color, s) {
    return '<g data-s="' + s + '" class="pop"><rect x="20" y="138" width="280" height="32" rx="10" fill="' + color + '"/>' +
      '<text x="160" y="159" text-anchor="middle" font-size="11.5" font-weight="800" fill="#fff">🔍 ' + text + '</text></g>';
  }

  function arrow(x1, y1, x2, y2, color, extra) {
    var a = Math.atan2(y2 - y1, x2 - x1), hs = 6;
    return '<g' + (extra || '') + '><path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + color + '" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M' + x2 + ' ' + y2 + 'L' + r1(x2 - hs * Math.cos(a - 0.5)) + ' ' + r1(y2 - hs * Math.sin(a - 0.5)) + 'L' + r1(x2 - hs * Math.cos(a + 0.5)) + ' ' +
      r1(y2 - hs * Math.sin(a + 0.5)) + 'Z" fill="' + color + '"/></g>';
  }

  var C = { igneous: '#d9480f', sedimentary: '#a16207', metamorphic: '#7c3aed', sky: '#cfe8f7' };

  /* ---------- 章節與旁白 ---------- */

  var CHAPTERS = [
    {
      title: '開場',
      scene: function () {
        return '' +
          '<rect width="320" height="180" fill="#fff7e6"/>' +
          // 標題卡
          '<g data-hide="1">' +
            rock('granite', 70, 120, 70, 46, 3) + rock('sandstone', 160, 128, 64, 40, 5) + rock('marble', 250, 120, 70, 46, 9) +
            '<text x="160" y="62" text-anchor="middle" font-size="26" font-weight="900" fill="#1e3a8a">岩石偵探出動！</text>' +
            '<g class="float"><circle cx="284" cy="40" r="13" fill="#bfe3f5" stroke="#1e3a8a" stroke-width="4"/><path d="M293 50 L306 63" stroke="#1e3a8a" stroke-width="6" stroke-linecap="round"/></g>' +
          '</g>' +
          // 校園
          '<g data-s="1" data-hide="2">' +
            '<rect width="320" height="180" fill="' + C.sky + '"/><rect y="138" width="320" height="42" fill="#9fcf87"/>' +
            '<rect x="170" y="40" width="140" height="98" fill="#f4e3c3"/><g fill="#9ccbe8"><rect x="184" y="54" width="22" height="18"/><rect x="218" y="54" width="22" height="18"/><rect x="252" y="54" width="22" height="18"/>' +
            '<rect x="184" y="88" width="22" height="18"/><rect x="252" y="88" width="22" height="18"/></g><rect x="220" y="96" width="24" height="42" fill="#a8774e"/>' +
            '<g class="glow">' + rock('granite', 82, 122, 92, 40, 11) + label(82, 124, '校名石', { size: 10 }) + '</g>' +
            '<g class="glow">' + '<rect x="212" y="134" width="40" height="4" fill="#cfc6b8"/><rect x="216" y="130" width="32" height="4" fill="#ddd5c8"/>' + label(232, 156, '樓梯台階', { size: 8 }) + '</g>' +
          '</g>' +
          // 三大家族
          '<g data-s="2">' +
            '<text x="160" y="34" text-anchor="middle" font-size="15" font-weight="900" fill="#1f2933">岩石三大家族</text>' +
            '<g class="bounce" style="animation-delay:0s"><rect x="18" y="48" width="88" height="112" rx="12" fill="#fff" stroke="' + C.igneous + '" stroke-width="3"/>' + rock('granite', 62, 92, 60, 40, 21) + '<text x="62" y="146" text-anchor="middle" font-size="15" font-weight="900" fill="' + C.igneous + '">火成岩</text></g>' +
            '<g class="bounce" style="animation-delay:.25s"><rect x="116" y="48" width="88" height="112" rx="12" fill="#fff" stroke="' + C.sedimentary + '" stroke-width="3"/>' + rock('sandstone', 160, 92, 60, 40, 22) + '<text x="160" y="146" text-anchor="middle" font-size="15" font-weight="900" fill="' + C.sedimentary + '">沉積岩</text></g>' +
            '<g class="bounce" style="animation-delay:.5s"><rect x="214" y="48" width="88" height="112" rx="12" fill="#fff" stroke="' + C.metamorphic + '" stroke-width="3"/>' + rock('gneiss', 258, 92, 60, 40, 23) + '<text x="258" y="146" text-anchor="middle" font-size="15" font-weight="900" fill="' + C.metamorphic + '">變質岩</text></g>' +
          '</g>';
      },
      lines: [
        '各位岩石偵探，大家好！今天我們要出發去校園，尋找藏在身邊的岩石。',
        '其實岩石到處都有：校門口的校名石、走廊的地板、樓梯的台階，很多都是岩石做的。',
        '地球上的岩石有好多種，科學家依照它們「怎麼形成的」，把岩石分成三大家族。',
        '分別是火成岩、沉積岩，還有變質岩。我們一個一個來認識！'
      ],
      steps: [0, 1, 2, 2]
    },
    {
      title: '火成岩',
      color: C.igneous,
      scene: function () {
        return '' +
          '<rect width="320" height="180" fill="' + C.sky + '"/>' +
          // 火山剖面
          '<g data-hide="3">' +
            '<rect y="110" width="320" height="70" fill="#8a6a4a"/><rect y="150" width="320" height="30" fill="#6b4f36"/>' +
            '<path d="M60 110 L140 40 H180 L260 110 Z" fill="#7b6a5c"/>' +
            '<g data-s="1"><ellipse class="magma-glow" cx="160" cy="162" rx="60" ry="14" fill="#ff6a00"/>' +
            '<path class="magma-rise" d="M152 160 Q156 110 150 70 Q160 60 170 70 Q164 110 168 160 Z" fill="#ff7b1a"/>' +
            label(240, 168, '岩漿', { bg: '#ff6a00', color: '#fff' }) + '</g>' +
            '<g data-s="2"><g class="erupt"><circle cx="152" cy="30" r="5" fill="#ff8f1f"/><circle cx="168" cy="24" r="4" fill="#ffb02e"/><circle cx="160" cy="16" r="6" fill="#ff6a00"/></g>' +
            '<path class="lava" d="M142 42 Q120 70 104 96 Q98 106 92 110 L110 110 Q122 84 150 50 Z" fill="#ff6a00"/>' +
            '<path class="lava" d="M178 42 Q200 70 214 98 L226 110 L208 110 Q196 84 170 50 Z" fill="#ff6a00"/>' +
            label(80, 92, '冷卻凝固', { size: 8 }) + '</g>' +
          '</g>' +
          // 比較：地表快冷 vs 地底慢冷
          '<g data-s="3">' +
            '<rect width="320" height="180" fill="#fff4ea"/>' +
            '<g><rect x="12" y="38" width="144" height="96" rx="10" fill="#fff" stroke="#e8d3c2"/>' +
            '<text x="84" y="52" text-anchor="middle" font-size="11" font-weight="800" fill="' + C.igneous + '">噴出地表・很快冷卻</text>' +
            rock('basalt', 84, 76, 90, 36, 31) + '<text x="84" y="106" text-anchor="middle" font-size="9" fill="#5f6b7a">晶體很小，看不到顆粒</text>' +
            '<g data-s="4">' + label(84, 124, '玄武岩・澎湖', { size: 10, bg: '#3c3e43', color: '#fff' }) + '</g></g>' +
            '<g data-s="5"><rect x="164" y="38" width="144" height="96" rx="10" fill="#fff" stroke="#e8d3c2"/>' +
            '<text x="236" y="52" text-anchor="middle" font-size="11" font-weight="800" fill="' + C.igneous + '">在地底・慢慢冷卻</text>' +
            rock('granite', 236, 76, 90, 36, 32) + '<text x="236" y="106" text-anchor="middle" font-size="9" fill="#5f6b7a">看得到一顆顆晶體</text>' +
            '<g data-s="6">' + label(236, 124, '花崗岩・金門', { size: 10, bg: '#9a5b4b', color: '#fff' }) + '</g></g>' +
            clue('看得到晶體顆粒、不分層 → 可能是火成岩', C.igneous, 7) +
          '</g>' +
          tag('火成岩', C.igneous);
      },
      lines: [
        '第一個家族：火成岩。「火成」的意思，就是跟火山、岩漿有關。',
        '在地底深處，溫度非常高，岩石會熔化成又熱又燙的岩漿。',
        '岩漿冷卻、凝固以後，就變成了火成岩。',
        '如果岩漿噴出地表，很快就冷卻了，礦物來不及長大，晶體很小，幾乎看不到顆粒。',
        '這種岩石常常黑黑的，有時候還有小氣孔，像澎湖的玄武岩。',
        '如果岩漿在地底慢慢冷卻，礦物有很多時間長大，就能看到一顆一顆的晶體。',
        '例如花崗岩，有黑、白、粉紅色的顆粒，常被做成校名石和地板。金門就有很多花崗岩。',
        '偵探小提示：看到一顆一顆的晶體、不會分層，就可能是火成岩！'
      ]
    },
    {
      title: '沉積岩',
      color: C.sedimentary,
      scene: function () {
        var layers = '';
        var lc = ['#c9a46c', '#e0c089', '#b8915c', '#d8b47c'];
        for (var i = 0; i < 4; i++) {
          layers += '<rect class="settle" data-s="2" style="transition-delay:' + (i * 0.5) + 's" x="190" y="' + (164 - i * 9) + '" width="130" height="9" fill="' + lc[i] + '"/>';
        }
        return '' +
          '<rect width="320" height="180" fill="' + C.sky + '"/>' +
          // 山、河、海的剖面
          '<g data-hide="5">' +
            '<path d="M0 120 L50 50 L100 110 L130 92 L190 130 H0 Z" fill="#7d8a6a"/>' +
            '<path d="M0 130 H190 L320 130 V180 H0 Z" fill="#a08a6a"/>' +
            '<rect x="180" y="110" width="140" height="62" fill="#5aa7d6" opacity=".85"/>' +
            '<path d="M60 112 Q110 118 140 124 T190 128" stroke="#5aa7d6" stroke-width="5" fill="none"/>' +
            layers +
            '<g data-s="1"><g class="rain">' +
              '<path d="M30 20 l-4 10 M50 14 l-4 10 M70 22 l-4 10 M90 16 l-4 10 M110 24 l-4 10" stroke="#3b82c4" stroke-width="2" stroke-linecap="round"/></g>' +
              '<g class="roll"><circle cx="80" cy="112" r="2.5" fill="#6b5a45"/><circle cx="92" cy="115" r="1.6" fill="#8a7458"/><circle cx="72" cy="113" r="1.2" fill="#b39a74"/></g>' +
              label(60, 150, '礫石・砂・泥', { size: 9 }) + '</g>' +
            '<g data-s="3">' + arrow(255, 98, 255, 126, '#1f2933', ' class="press"') + arrow(225, 98, 225, 126, '#1f2933', ' class="press"') + arrow(285, 98, 285, 126, '#1f2933', ' class="press"') +
              label(255, 92, '壓緊・黏在一起', { size: 8 }) + '</g>' +
            '<g data-s="4" class="pop">' + shell(232, 160, 5, -10) + shell(280, 152, 4, 20) + label(256, 170, '化石', { size: 8 }) + '</g>' +
          '</g>' +
          // 沉積岩樣本
          '<g data-s="5" data-hide="7">' +
            '<rect width="320" height="180" fill="#fbf4e6"/>' +
            rock('conglomerate', 46, 66, 66, 40, 41) + '<text x="46" y="102" text-anchor="middle" font-size="11" font-weight="800">礫岩</text><text x="46" y="113" text-anchor="middle" font-size="8" fill="#5f6b7a">小石頭</text>' +
            rock('sandstone', 124, 66, 66, 40, 42) + '<text x="124" y="102" text-anchor="middle" font-size="11" font-weight="800">砂岩</text><text x="124" y="113" text-anchor="middle" font-size="8" fill="#5f6b7a">砂</text>' +
            rock('shale', 202, 66, 66, 40, 43) + '<text x="202" y="102" text-anchor="middle" font-size="11" font-weight="800">頁岩</text><text x="202" y="113" text-anchor="middle" font-size="8" fill="#5f6b7a">泥</text>' +
            rock('limestone', 280, 66, 66, 40, 44) + '<text x="280" y="102" text-anchor="middle" font-size="11" font-weight="800">石灰岩</text><text x="280" y="113" text-anchor="middle" font-size="8" fill="#5f6b7a">貝殼、珊瑚</text>' +
            '<g data-s="6" class="pop"><rect x="70" y="120" width="180" height="52" rx="10" fill="#fff" stroke="#e5d6b8"/>' +
              '<path d="M96 166 Q94 150 100 146 Q90 140 96 128 Q108 120 114 132 Q116 142 108 146 Q112 152 110 166 Z" fill="#c9a46c"/>' +
              '<path d="M84 166 H130" stroke="#7a9cb8" stroke-width="3"/>' +
              '<text x="186" y="142" text-anchor="middle" font-size="11" font-weight="800">野柳女王頭</text><text x="186" y="158" text-anchor="middle" font-size="9" fill="#5f6b7a">砂岩被海浪和風雕刻</text></g>' +
          '</g>' +
          // 分層岩石與落石
          '<g data-s="7">' +
            '<rect width="320" height="180" fill="' + C.sky + '"/>' +
            '<path d="M0 40 L170 150 H0 Z" fill="#b8915c"/>' +
            '<path d="M0 62 L136 150 M0 84 L102 150 M0 106 L68 150 M0 128 L34 150" stroke="#8a6a3f" stroke-width="2.5"/>' +
            '<rect y="150" width="320" height="30" fill="#6b7280"/><path d="M0 165 H320" stroke="#fff" stroke-width="2" stroke-dasharray="14 10"/>' +
            '<g class="fall-rock"><path d="M120 108 l12 -6 l10 6 l-4 10 l-14 2 z" fill="#8a6a3f"/></g>' +
            '<g><rect x="230" y="70" width="4" height="80" fill="#555"/><path d="M232 40 L262 88 H202 Z" fill="#facc15" stroke="#1f2933" stroke-width="2"/><text x="232" y="80" text-anchor="middle" font-size="22" font-weight="900">!</text></g>' +
            label(232, 104, '小心落石', { size: 10, bg: '#1f2933', color: '#fff' }) +
            clue('看到分層、砂粒、小石頭或化石 → 可能是沉積岩', C.sedimentary, 8) +
          '</g>' +
          tag('沉積岩', C.sedimentary);
      },
      lines: [
        '第二個家族：沉積岩。它是一層一層「堆」出來的。',
        '風吹、雨打、河水沖刷，會把山上的岩石慢慢磨碎，變成礫石、砂和泥。',
        '河水把它們帶到湖泊或大海，沉到水底，一層又一層堆積起來。',
        '經過很長很長的時間，上面越堆越重，把下面的沉積物壓緊、黏在一起，就變成了沉積岩。',
        '沉積物裡如果有貝殼或生物，就可能變成化石，所以化石大多藏在沉積岩裡。',
        '依照顆粒大小，有礫岩、砂岩、頁岩；由貝殼和珊瑚形成的，叫做石灰岩。',
        '北海岸野柳的女王頭，就是砂岩被海浪和風慢慢雕刻出來的。',
        '要注意，有分層的岩石，在大雨或地震時，比較容易沿著層和層之間滑落，所以經過山邊要小心落石。',
        '偵探小提示：看到分層、有砂粒或小石頭，甚至有化石，就可能是沉積岩！'
      ]
    },
    {
      title: '變質岩',
      color: C.metamorphic,
      scene: function () {
        return '' +
          '<rect width="320" height="180" fill="#f1ecfb"/>' +
          '<g data-hide="4">' +
            '<rect y="40" width="320" height="140" fill="#9b8a76"/><rect y="100" width="320" height="80" fill="#7a6a58"/>' +
            '<g data-s="1"><rect class="heat" y="150" width="320" height="30" fill="#ff5a1f"/>' +
              '<g class="squeeze-l">' + arrow(40, 104, 104, 104, '#1f2933') + '</g><g class="squeeze-r">' + arrow(280, 104, 216, 104, '#1f2933') + '</g>' +
              label(160, 64, '高溫 + 高壓', { size: 11, bg: '#7c3aed', color: '#fff' }) + '</g>' +
            '<g data-hide="2">' + rock('granite', 160, 106, 90, 44, 51) + '</g>' +
            '<g data-s="2" class="morph">' + rock('gneiss', 160, 106, 100, 36, 52) + label(160, 140, '礦物重新排列，出現條紋', { size: 8 }) + '</g>' +
            '<g data-s="3" class="pop"><rect x="16" y="46" width="76" height="46" rx="8" fill="#fff"/>' +
              '<g class="clay"><ellipse cx="54" cy="72" rx="14" ry="14" fill="#e08a5a"/><path d="M42 68 h24 M42 74 h24" stroke="#c46d3f" stroke-width="1.5" opacity="0"/></g>' +
              '<text x="54" y="88" text-anchor="middle" font-size="7.5" fill="#5f6b7a">像黏土被壓扁</text></g>' +
          '</g>' +
          '<g data-s="4">' +
            '<rect width="320" height="180" fill="#f7f4fd"/>' +
            rock('limestone', 62, 56, 70, 34, 61) + '<text x="62" y="86" text-anchor="middle" font-size="10" font-weight="800">石灰岩</text>' +
            arrow(108, 56, 146, 56, C.metamorphic) +
            rock('marble', 194, 56, 70, 34, 62) + '<text x="194" y="86" text-anchor="middle" font-size="10" font-weight="800">大理岩</text>' +
            label(272, 60, '花蓮太魯閣', { size: 9, bg: '#7c3aed', color: '#fff' }) +
            '<g data-s="5">' +
              rock('shale', 62, 106, 70, 28, 63) + '<text x="62" y="132" text-anchor="middle" font-size="10" font-weight="800">頁岩</text>' +
              arrow(108, 106, 146, 106, C.metamorphic) +
              rock('slate', 194, 106, 70, 28, 64) + '<text x="194" y="132" text-anchor="middle" font-size="10" font-weight="800">板岩</text>' +
              '<g><path d="M246 106 L272 90 L298 106 Z" fill="#4a5562"/><path d="M252 102 L272 90 M292 102 L272 90" stroke="#6a7685" stroke-width="1"/>' +
              '<rect x="252" y="106" width="40" height="20" fill="#5b6672"/><rect x="266" y="112" width="12" height="14" fill="#3a434e"/>' +
              '<text x="272" y="134" text-anchor="middle" font-size="8" fill="#5f6b7a">石板屋</text></g>' +
            '</g>' +
            clue('看到條紋、片狀，或亮亮會反光 → 可能是變質岩', C.metamorphic, 6) +
          '</g>' +
          tag('變質岩', C.metamorphic);
      },
      lines: [
        '第三個家族：變質岩。「變質」就是改變了原本的樣子。',
        '當岩石被推到地底深處，受到很高的溫度和很大的壓力擠壓，',
        '岩石並沒有熔化，但是裡面的礦物重新排列、長大，就變成了全新的岩石。',
        '就像一團黏土被用力壓扁，會變得扁扁的、出現條紋一樣。',
        '例如石灰岩變質，會變成大理岩。花蓮太魯閣有很多大理岩，常做成地板和桌面。',
        '頁岩變質，會變成板岩，可以剝成一片一片的。原住民的石板屋，就是用板岩蓋的。',
        '偵探小提示：看到條紋、片狀，或是亮亮會反光的，就可能是變質岩！'
      ]
    },
    {
      title: '岩石循環',
      scene: function () {
        return '' +
          '<rect width="320" height="180" fill="#f4f7fb"/>' +
          '<text x="160" y="22" text-anchor="middle" font-size="13" font-weight="900" fill="#1f2933">岩石循環</text>' +
          '<g class="node"><circle cx="160" cy="52" r="24" fill="#fff" stroke="' + C.igneous + '" stroke-width="3"/><text x="160" y="56" text-anchor="middle" font-size="11" font-weight="900" fill="' + C.igneous + '">火成岩</text></g>' +
          '<g class="node"><circle cx="262" cy="140" r="24" fill="#fff" stroke="' + C.sedimentary + '" stroke-width="3"/><text x="262" y="144" text-anchor="middle" font-size="11" font-weight="900" fill="' + C.sedimentary + '">沉積岩</text></g>' +
          '<g class="node"><circle cx="58" cy="140" r="24" fill="#fff" stroke="' + C.metamorphic + '" stroke-width="3"/><text x="58" y="144" text-anchor="middle" font-size="11" font-weight="900" fill="' + C.metamorphic + '">變質岩</text></g>' +
          '<g data-s="3"><circle cx="160" cy="118" r="16" fill="#ff7b1a"/><text x="160" y="122" text-anchor="middle" font-size="9" font-weight="900" fill="#fff">岩漿</text></g>' +
          '<g data-s="1" class="draw">' + arrow(184, 62, 244, 118, C.sedimentary) + label(236, 84, '風化・堆積', { size: 8 }) + '</g>' +
          '<g data-s="2" class="draw">' + arrow(236, 146, 84, 146, C.metamorphic) + label(160, 162, '高溫・高壓', { size: 8 }) + '</g>' +
          '<g data-s="3" class="draw">' + arrow(80, 128, 142, 120, '#ff7b1a') + arrow(160, 100, 160, 80, C.igneous) + label(96, 112, '熔化', { size: 8 }) + label(190, 92, '冷卻', { size: 8 }) + '</g>' +
          '<g data-s="4" class="pop">' + label(258, 26, '要花上幾百萬年！', { size: 9, bg: '#1e3a8a', color: '#fff' }) + '</g>';
      },
      lines: [
        '三大家族並不是永遠不變的。岩石會不斷改變身分，這就叫做岩石循環。',
        '火成岩被風化、搬運、堆積，可以變成沉積岩；',
        '沉積岩受到高溫高壓，可以變成變質岩；',
        '變質岩如果熔化成岩漿，冷卻以後，又會變回火成岩。',
        '這個循環要花上幾百萬年，比恐龍的時代還要久遠喔！'
      ]
    },
    {
      title: '偵探任務',
      scene: function () {
        var items = [
          ['👀', '看顆粒', '看得到一顆顆晶體或砂粒嗎？'],
          ['📚', '看分層', '有一層一層的紋路嗎？'],
          ['✋', '摸表面', '粗糙、光滑，還是會反光？'],
          ['🔎', '看花紋', '斑點、條紋，還是都沒有？']
        ];
        var out = '<rect width="320" height="180" fill="#eef6ff"/>' +
          '<text x="160" y="24" text-anchor="middle" font-size="14" font-weight="900" fill="#1e3a8a">岩石偵探四招</text>';
        items.forEach(function (it, i) {
          var y = 34 + i * 25;
          out += '<g data-s="' + (i + 1) + '" data-hide="5" class="slide-in"><rect x="30" y="' + y + '" width="260" height="21" rx="8" fill="#fff" stroke="#c9dcf2"/>' +
            '<text x="44" y="' + (y + 15) + '" font-size="11">' + it[0] + '</text>' +
            '<text x="62" y="' + (y + 15) + '" font-size="11" font-weight="900" fill="#1e3a8a">第' + '一二三四'.charAt(i) + '招 ' + it[1] + '</text>' +
            '<text x="150" y="' + (y + 15) + '" font-size="8.5" fill="#5f6b7a">' + it[2] + '</text></g>';
        });
        out += '<g data-s="5" data-hide="6">' +
          '<g class="pop"><circle cx="70" cy="80" r="26" fill="#dcfce7"/><text x="70" y="88" text-anchor="middle" font-size="22">📷</text><text x="70" y="124" text-anchor="middle" font-size="10" font-weight="800" fill="#15803d">拍照記錄 ✓</text></g>' +
          '<g class="pop" style="animation-delay:.2s"><circle cx="160" cy="80" r="26" fill="#fee2e2"/><text x="160" y="88" text-anchor="middle" font-size="22">🔨</text><text x="160" y="124" text-anchor="middle" font-size="10" font-weight="800" fill="#b91c1c">不敲打 ✗</text></g>' +
          '<g class="pop" style="animation-delay:.4s"><circle cx="250" cy="80" r="26" fill="#fee2e2"/><text x="250" y="88" text-anchor="middle" font-size="22">🧗</text><text x="250" y="124" text-anchor="middle" font-size="10" font-weight="800" fill="#b91c1c">不攀爬、不舔 ✗</text></g>' +
          '<text x="160" y="150" text-anchor="middle" font-size="9.5" fill="#1f2933">先寫下證據，不急著查名稱</text></g>' +
          '<g data-s="6" class="pop"><text x="160" y="96" text-anchor="middle" font-size="22" font-weight="900" fill="#1e3a8a">小測驗，挑戰開始！</text>' +
          '<g class="float"><circle cx="160" cy="132" r="13" fill="#bfe3f5" stroke="#1e3a8a" stroke-width="4"/><path d="M169 142 L182 155" stroke="#1e3a8a" stroke-width="6" stroke-linecap="round"/></g></g>';
        return out;
      },
      lines: [
        '好，偵探們，準備出任務了！到校園觀察岩石時，請用這四招。',
        '第一招，看顆粒：看不看得到一顆一顆的晶體或砂粒？',
        '第二招，看分層：有沒有一層一層的紋路？',
        '第三招，摸表面：是粗糙、光滑，還是亮亮會反光？',
        '第四招，看花紋：有斑點、條紋，還是都沒有？',
        '記得，先拍照，寫下你看到的證據，不要急著查名稱。也不要敲打、攀爬或舔石頭喔！',
        '準備好了嗎？我們先來挑戰小測驗，看看你是不是合格的岩石偵探！'
      ]
    }
  ];

  /* ---------- 問答題 ---------- */

  var QUESTIONS = [
    {
      q: '這塊岩石看得到一顆一顆黑、白、粉紅色的晶體，它最可能是哪一類？',
      rock: 'granite',
      options: ['火成岩', '沉積岩', '變質岩'],
      answer: 0,
      explain: '看得到一顆顆晶體，是岩漿在地底慢慢冷卻形成的火成岩，這塊是花崗岩。'
    },
    {
      q: '岩漿噴出地表、很快冷卻，形成的岩石會有什麼特徵？',
      options: ['晶體很小，幾乎看不到顆粒', '晶體很大，一顆一顆很明顯', '一層一層的分層'],
      answer: 0,
      explain: '冷卻得很快，礦物來不及長大，所以晶體很小，例如澎湖的玄武岩。'
    },
    {
      q: '這塊岩石有一層一層的紋路，摸起來像砂紙，它最可能是哪一類？',
      rock: 'sandstone',
      options: ['火成岩', '沉積岩', '變質岩'],
      answer: 1,
      explain: '分層加上砂粒，是砂一層層堆積、壓緊形成的沉積岩，這塊是砂岩。'
    },
    {
      q: '在岩石裡發現了貝殼化石，這塊岩石最可能是哪一類？',
      rock: 'limestone',
      options: ['火成岩', '沉積岩', '變質岩'],
      answer: 1,
      explain: '生物被沉積物埋起來才會變成化石，所以化石大多藏在沉積岩裡。'
    },
    {
      q: '變質岩是怎麼形成的？',
      options: ['岩漿冷卻凝固', '砂和泥一層層堆積', '岩石受到高溫高壓，但沒有熔化'],
      answer: 2,
      explain: '岩石在地底受到高溫高壓，礦物重新排列，但沒有熔化，就變成變質岩。'
    },
    {
      q: '這塊岩石白白的、有灰色紋路、亮亮會反光，花蓮太魯閣有很多。它是？',
      rock: 'marble',
      options: ['大理岩', '玄武岩', '礫岩'],
      answer: 0,
      explain: '大理岩是石灰岩變質形成的變質岩，常被做成地板和桌面。'
    },
    {
      q: '原住民石板屋用的「板岩」，是由哪一種岩石變質而來的？',
      rock: 'slate',
      options: ['花崗岩', '頁岩', '玄武岩'],
      answer: 1,
      explain: '頁岩受到高溫高壓變成板岩，可以剝成一片一片，適合蓋石板屋。'
    },
    {
      q: '下大雨時，經過有分層岩石的山邊道路，要特別注意什麼？',
      options: ['落石', '火山爆發', '海水倒灌'],
      answer: 0,
      explain: '有分層的岩石容易沿著層和層之間滑落，大雨或地震時要小心落石。'
    },
    {
      q: '到校園偵查岩石時，哪一種做法是正確的？',
      options: ['用石頭敲下一小塊帶回家', '爬到高處的大石頭上看', '拍照，寫下看到和摸到的證據'],
      answer: 2,
      explain: '岩石偵探要先記錄證據，不敲打、不攀爬，也不舔石頭。'
    }
  ];

  /* ---------- 影片播放器 ---------- */

  function $(sel, root) { return (root || document).querySelector(sel); }

  function fmt(sec) {
    sec = Math.max(0, Math.round(sec));
    return Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2);
  }

  function initPlayer() {
    var player = $('.player');
    if (!player) return;

    var els = {
      stage: $('.player-stage', player),
      svg: $('.player-stage svg', player),
      sub: $('.subtitle', player),
      cover: $('.player-cover', player),
      end: $('.player-end', player),
      play: $('#vp-play', player),
      progress: $('.vp-progress', player),
      fill: $('.vp-fill', player),
      marks: $('.vp-marks', player),
      time: $('#vp-time', player),
      voice: $('#vp-voice', player),
      subs: $('#vp-subs', player),
      full: $('#vp-full', player),
      chapters: $('.chapter-list')
    };

    // 展開成一句一句的時間軸
    var timeline = [];
    var total = 0;
    CHAPTERS.forEach(function (ch, ci) {
      ch.lines.forEach(function (text, li) {
        var dur = text.length * SEC_PER_CHAR + LINE_GAP;
        timeline.push({ ch: ci, step: ch.steps ? ch.steps[li] : li, text: text, start: total, dur: dur });
        total += dur;
      });
    });

    var idx = 0;
    var currentChapter = -1;
    var playing = false;
    var lineStartedAt = 0;
    var timer = null;
    var fallback = null;
    var raf = null;
    var token = 0;

    /* 語音旁白 */
    var synth = window.speechSynthesis;
    var voice = null;
    var voiceOn = false;

    function pickVoice() {
      if (!synth) return;
      var list = synth.getVoices();
      var prefs = [/zh[-_]TW/i, /zh[-_]Hant/i, /cmn/i, /zh[-_]CN/i, /^zh$/i];
      for (var p = 0; p < prefs.length && !voice; p++) {
        for (var i = 0; i < list.length; i++) {
          if (prefs[p].test(list[i].lang) && !/HK|yue/i.test(list[i].lang)) { voice = list[i]; break; }
        }
      }
      if (voice && !els.voice.dataset.touched) setVoice(true);
      els.voice.hidden = !voice;
    }

    function setVoice(on) {
      voiceOn = on && !!voice;
      els.voice.setAttribute('aria-pressed', String(voiceOn));
      els.voice.textContent = voiceOn ? '🔊 旁白' : '🔇 旁白';
    }

    if (synth) {
      pickVoice();
      if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);
    }
    els.voice.hidden = !voice;

    els.voice.addEventListener('click', function () {
      els.voice.dataset.touched = '1';
      setVoice(!voiceOn);
      if (playing) playLine(idx);
    });

    els.subs.addEventListener('click', function () {
      var on = els.subs.getAttribute('aria-pressed') !== 'true';
      els.subs.setAttribute('aria-pressed', String(on));
      player.classList.toggle('no-subs', !on);
    });

    /* 章節按鈕與進度條標記 */
    CHAPTERS.forEach(function (ch, ci) {
      var first = timeline.filter(function (l) { return l.ch === ci; })[0];
      var mark = document.createElement('span');
      mark.style.left = (first.start / total * 100) + '%';
      els.marks.appendChild(mark);

      if (els.chapters) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chapter-btn';
        btn.innerHTML = '<span class="chapter-time">' + fmt(first.start) + '</span><span></span>';
        btn.lastChild.textContent = ch.title;
        if (ch.color) btn.style.setProperty('--c', ch.color);
        btn.addEventListener('click', function () {
          seek(timeline.indexOf(first));
          player.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        els.chapters.appendChild(btn);
      }
    });

    function showChapter(ci) {
      if (ci === currentChapter) return;
      currentChapter = ci;
      uid = 0;
      els.svg.innerHTML = CHAPTERS[ci].scene();
      els.svg.setAttribute('aria-label', '第 ' + (ci + 1) + ' 章：' + CHAPTERS[ci].title);
      if (els.chapters) {
        Array.prototype.forEach.call(els.chapters.children, function (b, i) {
          b.classList.toggle('current', i === ci);
        });
      }
    }

    function applyStep(step) {
      Array.prototype.forEach.call(els.svg.querySelectorAll('[data-s]'), function (el) {
        el.classList.toggle('on', +el.getAttribute('data-s') <= step);
      });
      Array.prototype.forEach.call(els.svg.querySelectorAll('[data-hide]'), function (el) {
        el.classList.toggle('gone', +el.getAttribute('data-hide') <= step);
      });
    }

    function clearTimers() {
      clearTimeout(timer);
      clearTimeout(fallback);
      token++;
      if (synth) synth.cancel();
    }

    function render(i) {
      var line = timeline[i];
      showChapter(line.ch);
      applyStep(line.step);
      els.sub.textContent = line.text;
    }

    function playLine(i) {
      clearTimers();
      idx = i;
      render(i);
      lineStartedAt = performance.now();
      var line = timeline[i];
      var my = token;

      if (voiceOn && synth) {
        var u = new SpeechSynthesisUtterance(line.text);
        u.voice = voice;
        u.lang = voice.lang;
        u.rate = 0.95;
        u.onend = function () {
          if (my !== token) return;
          timer = setTimeout(next, LINE_GAP * 1000);
        };
        u.onerror = u.onend;
        synth.speak(u);
        // 有些瀏覽器不會觸發 onend，避免卡住
        fallback = setTimeout(function () { if (my === token) next(); }, (line.dur * 2 + 4) * 1000);
      } else {
        timer = setTimeout(next, line.dur * 1000);
      }
    }

    function next() {
      if (idx < timeline.length - 1) {
        playLine(idx + 1);
      } else {
        finish();
      }
    }

    function tick() {
      var line = timeline[idx];
      var elapsed = playing ? Math.min((performance.now() - lineStartedAt) / 1000, line.dur) : 0;
      var t = line.start + elapsed;
      els.fill.style.width = (t / total * 100) + '%';
      els.time.textContent = fmt(t) + ' / ' + fmt(total);
      els.progress.setAttribute('aria-valuenow', Math.round(t));
      raf = requestAnimationFrame(tick);
    }

    function setPlaying(on) {
      playing = on;
      player.classList.toggle('is-playing', on);
      els.play.textContent = on ? '❚❚' : '▶';
      els.play.setAttribute('aria-label', on ? '暫停' : '播放');
    }

    function play() {
      els.cover.hidden = true;
      els.end.hidden = true;
      setPlaying(true);
      playLine(idx);
      if (!raf) tick();
    }

    function pause() {
      clearTimers();
      setPlaying(false);
    }

    function finish() {
      clearTimers();
      setPlaying(false);
      els.end.hidden = false;
      els.fill.style.width = '100%';
    }

    function seek(i) {
      idx = Math.max(0, Math.min(i, timeline.length - 1));
      els.cover.hidden = true;
      els.end.hidden = true;
      if (playing) {
        playLine(idx);
      } else {
        render(idx);
        if (!raf) tick();
      }
    }

    els.play.addEventListener('click', function () { playing ? pause() : play(); });
    $('#vp-start', player).addEventListener('click', play);
    $('#vp-replay', player).addEventListener('click', function () { idx = 0; play(); });
    els.stage.addEventListener('click', function (e) {
      if (e.target.closest('button')) return;
      if (els.cover.hidden && els.end.hidden) playing ? pause() : play();
    });

    function seekFromEvent(e) {
      var rect = els.progress.getBoundingClientRect();
      var t = (e.clientX - rect.left) / rect.width * total;
      for (var i = timeline.length - 1; i >= 0; i--) {
        if (timeline[i].start <= t) { seek(i); return; }
      }
    }
    els.progress.addEventListener('click', seekFromEvent);
    els.progress.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); seek(idx + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); seek(idx - 1); }
    });

    player.addEventListener('keydown', function (e) {
      if (e.key === ' ' && e.target === player) {
        e.preventDefault();
        playing ? pause() : play();
      }
    });

    /* 全螢幕（投影上課用） */
    var canFull = player.requestFullscreen || player.webkitRequestFullscreen;
    if (!canFull) {
      els.full.hidden = true;
    } else {
      els.full.addEventListener('click', function () {
        var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
        if (fsEl) {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
          (player.requestFullscreen || player.webkitRequestFullscreen).call(player);
        }
      });
    }

    // 離開頁面時停止語音
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && playing) pause();
    });

    $('#vp-total', player).textContent = '約 ' + Math.round(total / 60) + ' 分鐘';
    render(0);
    els.sub.textContent = '按下播放開始觀看';
    tick();
  }

  /* ---------- 互動問答 ---------- */

  function initRockQuiz() {
    var root = $('.rq');
    if (!root) return;

    var els = {
      start: $('.rq-start', root),
      play: $('.rq-play', root),
      end: $('.rq-end', root),
      progress: $('#rq-progress', root),
      bar: $('.rq-bar span', root),
      q: $('.rq-q', root),
      img: $('.rq-img', root),
      options: $('.rq-options', root),
      feedback: $('.rq-feedback', root),
      fbTitle: $('.rq-fb-title', root),
      fbText: $('.rq-fb-text', root),
      next: $('#rq-next', root),
      score: $('#rq-score', root),
      stars: $('.rq-stars', root),
      msg: $('#rq-msg', root),
      review: $('.rq-review', root)
    };

    var i = 0, score = 0, wrong = [];

    function show(view) {
      els.start.hidden = view !== 'start';
      els.play.hidden = view !== 'play';
      els.end.hidden = view !== 'end';
    }

    function start() {
      i = 0; score = 0; wrong = [];
      show('play');
      render();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function render() {
      var item = QUESTIONS[i];
      els.progress.textContent = '第 ' + (i + 1) + ' / ' + QUESTIONS.length + ' 題';
      els.bar.style.width = (i / QUESTIONS.length * 100) + '%';
      els.q.textContent = item.q;
      els.feedback.hidden = true;

      if (item.rock) {
        uid = 1000 + i * 10;
        els.img.innerHTML = '<svg viewBox="0 0 160 90" role="img" aria-label="岩石照片示意圖">' + rock(item.rock, 80, 45, 140, 76, 100 + i) + '</svg>';
        els.img.hidden = false;
      } else {
        els.img.hidden = true;
        els.img.innerHTML = '';
      }

      els.options.innerHTML = '';
      item.options.forEach(function (text, oi) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'rq-option';
        b.innerHTML = '<span class="rq-key">' + 'ABC'.charAt(oi) + '</span><span></span>';
        b.lastChild.textContent = text;
        b.addEventListener('click', function () { answer(oi); });
        els.options.appendChild(b);
      });
    }

    function answer(oi) {
      var item = QUESTIONS[i];
      var ok = oi === item.answer;
      if (ok) score++; else wrong.push(item);

      Array.prototype.forEach.call(els.options.children, function (b, bi) {
        b.disabled = true;
        if (bi === item.answer) b.classList.add('is-correct');
        if (bi === oi && !ok) b.classList.add('is-wrong');
      });

      els.feedback.hidden = false;
      els.feedback.className = 'rq-feedback ' + (ok ? 'ok' : 'bad');
      els.fbTitle.textContent = ok ? '⭕ 答對了！' : '❌ 再想想！正確答案是「' + item.options[item.answer] + '」';
      els.fbText.textContent = item.explain;
      els.next.textContent = i < QUESTIONS.length - 1 ? '下一題 →' : '看成績';
      els.next.focus({ preventScroll: true });
    }

    function next() {
      i++;
      if (i < QUESTIONS.length) {
        render();
        els.q.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        finish();
      }
    }

    function finish() {
      show('end');
      var total = QUESTIONS.length;
      els.score.textContent = score + ' / ' + total;
      var stars = score === total ? 3 : score >= total - 2 ? 2 : score >= total / 2 ? 1 : 0;
      els.stars.textContent = '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars);
      els.msg.textContent =
        stars === 3 ? '全部答對！你是合格的岩石偵探，出發去校園偵查吧！' :
        stars === 2 ? '很棒！再看一下答錯的題目，就可以出發了。' :
        '再看一次影片，複習三大岩石家族，再來挑戰！';

      els.review.innerHTML = '';
      wrong.forEach(function (item) {
        var li = document.createElement('li');
        var t = document.createElement('strong');
        t.textContent = item.q;
        var a = document.createElement('span');
        a.textContent = '答案：' + item.options[item.answer] + '。' + item.explain;
        li.appendChild(t);
        li.appendChild(a);
        els.review.appendChild(li);
      });
      els.review.hidden = !wrong.length;
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    $('#rq-start', root).addEventListener('click', start);
    // 影片結束畫面的「開始問答」
    var toQuiz = $('#vp-to-quiz');
    if (toQuiz) toQuiz.addEventListener('click', function () {
      if (!els.start.hidden) start();
    });
    $('#rq-again', root).addEventListener('click', start);
    els.next.addEventListener('click', next);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPlayer();
    initRockQuiz();
  });
})();
