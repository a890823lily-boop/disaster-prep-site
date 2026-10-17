(function () {
  'use strict';

  /* =========================================================
   * 岩石繪圖工具：產生各種岩石紋理的 SVG（影片頁與遊戲共用）
   * ========================================================= */

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
  function setId(n) { uid = n; }

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
      case 'pumice': // 浮石：淺色、滿滿氣孔
        t += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="#d9d4ca"/>';
        for (i = 0; i < w * h / 30; i++) {
          s = 0.8 + rand() * 2.6;
          t += '<ellipse cx="' + r1(rx()) + '" cy="' + r1(ry()) + '" rx="' + r1(s) + '" ry="' + r1(s * (0.6 + rand() * 0.4)) + '" fill="#9d978c" stroke="#ece8df" stroke-width=".4"/>';
        }
        break;
      case 'andesite': // 安山岩：灰色細粒底＋零星的斑晶
        t += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="#8b8f95"/>';
        for (i = 0; i < w * h / 9; i++) {
          t += '<circle cx="' + r1(rx()) + '" cy="' + r1(ry()) + '" r=".45" fill="' + (rand() > 0.5 ? '#7a7e84' : '#9da1a7') + '"/>';
        }
        for (i = 0; i < w * h / 110; i++) {
          s = 1.2 + rand() * 1.8;
          x = rx(); y = ry();
          t += '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(s * 1.6) + '" height="' + r1(s * 0.8) + '" transform="rotate(' + Math.round(rand() * 180) + ' ' + r1(x) + ' ' + r1(y) + ')" fill="' + (rand() > 0.35 ? '#f2f0ea' : '#26282b') + '"/>';
        }
        break;
      case 'schist': // 片岩：雲母亮片排成同一方向、波浪紋理
        t += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="#87907f"/>';
        for (y = y0 + 2; y < y0 + h; y += 2.4 + rand() * 1.6) {
          t += '<path d="M' + x0 + ' ' + r1(y) + ' q' + r1(w / 6) + ' ' + r1(rand() * 3 - 1.5) + ' ' + r1(w / 3) + ' 0 t' + r1(w / 3) + ' 0 t' + r1(w / 3) + ' 0" stroke="' + (rand() > 0.5 ? '#c7cdc0' : '#6d7566') + '" stroke-width="' + r1(0.5 + rand() * 0.7) + '" fill="none"/>';
        }
        for (i = 0; i < Math.max(4, w * h / 160); i++) {
          t += sparkle(rx(), ry(), 1.2 + rand() * 1.2, rand() * 2);
        }
        break;
      case 'terrazzo': // 磨石子：平均的碎石片鑲在水泥裡，有筆直的分隔條
        t += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="#a3a39e"/>';
        var tc = ['#f3f1ea', '#3a3a3a', '#c8b393', '#6f7d7d', '#e6dccb'];
        for (i = 0; i < w * h / 7; i++) {
          s = 1 + rand() * 1.1;
          x = rx(); y = ry();
          t += '<path d="M' + r1(x) + ' ' + r1(y - s) + 'l' + r1(s) + ' ' + r1(s * 0.8) + 'l' + r1(-s * 0.6) + ' ' + r1(s) + 'l' + r1(-s * 0.9) + ' ' + r1(-s * 0.5) + 'z" fill="' + tc[Math.floor(rand() * tc.length)] + '"/>';
        }
        t += '<path d="M' + r1(x0 + w * 0.62) + ' ' + y0 + 'V' + (y0 + h) + '" stroke="#c9a54c" stroke-width="' + r1(Math.max(1, w / 60)) + '"/>';
        for (i = 0; i < Math.max(3, w * h / 300); i++) {
          t += sparkle(rx(), ry(), 1 + rand(), rand() * 2);
        }
        break;
      case 'pebblewash': // 洗石子：大小相近的圓石一半露出，周圍是水泥
        t += '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" fill="#8e8d88"/>';
        var pc = ['#4b4f55', '#5d6167', '#2f3236', '#d9d4c8', '#7c7f84'];
        for (i = 0; i < w * h / 16; i++) {
          s = 1.8 + rand() * 1.2;
          x = rx(); y = ry();
          t += '<ellipse cx="' + r1(x) + '" cy="' + r1(y) + '" rx="' + r1(s) + '" ry="' + r1(s * 0.75) + '" fill="' + pc[Math.floor(rand() * pc.length)] + '"/>' +
            '<ellipse cx="' + r1(x - s * 0.3) + '" cy="' + r1(y - s * 0.3) + '" rx="' + r1(s * 0.35) + '" ry="' + r1(s * 0.2) + '" fill="#ffffff44"/>';
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

  window.RockArt = { rock: rock, shell: shell, sparkle: sparkle, r1: r1, rng: rng, setId: setId };
})();
