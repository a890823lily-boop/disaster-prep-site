(function () {
  'use strict';

  /* =========================================================
   * 大地如何變動：五下自然活動二的四節動畫教學影片與問答
   * 2-1 風化與土壤、2-2 流水的作用、2-3 河流地形、2-4 海岸地形
   * 播放器與問答來自 js/lesson-kit.js
   * ========================================================= */

  var Kit = window.LessonKit;
  var Art = window.RockArt;
  var label = Kit.label, tag = Kit.tag, clue = Kit.clue, arrow = Kit.arrow;
  var rock = Art.rock;

  /* ---------- 共用場景元件 ---------- */

  function sky(c) { return '<rect width="320" height="180" fill="' + (c || '#cfe8f7') + '"/>'; }
  function sun(x, y, cls) {
    return '<g class="' + (cls || '') + '"><circle cx="' + x + '" cy="' + y + '" r="12" fill="#facc15"/>' +
      '<path d="M' + x + ' ' + (y - 18) + 'v-5 M' + x + ' ' + (y + 18) + 'v5 M' + (x - 18) + ' ' + y + 'h-5 M' + (x + 18) + ' ' + y + 'h5" stroke="#facc15" stroke-width="2.5" stroke-linecap="round"/></g>';
  }
  function cloud(x, y, extra) {
    return '<g' + (extra || '') + '><ellipse cx="' + x + '" cy="' + y + '" rx="20" ry="9" fill="#fff"/><ellipse cx="' + (x - 12) + '" cy="' + (y + 3) + '" rx="12" ry="7" fill="#fff"/><ellipse cx="' + (x + 13) + '" cy="' + (y + 3) + '" rx="12" ry="7" fill="#fff"/></g>';
  }
  function rain(x0, x1, y) {
    var d = '';
    for (var x = x0; x < x1; x += 12) d += 'M' + x + ' ' + (y + (x % 3) * 4) + ' l-3 8 ';
    return '<g class="rain"><path d="' + d + '" stroke="#3b82c4" stroke-width="2" stroke-linecap="round"/></g>';
  }
  function tree(x, y, s) {
    s = s || 1;
    return '<g><rect x="' + (x - 2 * s) + '" y="' + (y - 18 * s) + '" width="' + (4 * s) + '" height="' + (18 * s) + '" fill="#7a5233"/>' +
      '<circle cx="' + x + '" cy="' + (y - 24 * s) + '" r="' + (11 * s) + '" fill="#4d8f3f"/></g>';
  }
  function card(x, y, w, h, title, color, body, extra) {
    return '<g' + (extra || '') + '><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="#fff" stroke="' + color + '" stroke-width="3"/>' +
      body + '<text x="' + (x + w / 2) + '" y="' + (y + h - 10) + '" text-anchor="middle" font-size="12" font-weight="900" fill="' + color + '">' + title + '</text></g>';
  }
  function emoji(x, y, e, size) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + (size || 20) + '">' + e + '</text>';
  }
  function water(x, y, w, h) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#4b9bcc"/>'; }
  function waves(y, cls) {
    return '<path class="' + (cls || 'wave-move') + '" d="M-20 ' + y + ' q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#e0f2fe" stroke-width="2" fill="none"/>';
  }

  var COL = { weather: '#b45309', water: '#0369a1', river: '#0e7490', coast: '#1d4ed8' };

  /* =========================================================
   * 2-1 風化與土壤
   * ========================================================= */
  var L21 = [
    {
      title: '岩石也會變老？',
      color: COL.weather,
      scene: function () {
        return sky() + '<rect y="140" width="320" height="40" fill="#b9a27f"/>' +
          '<g data-hide="1">' + rock('granite', 160, 112, 130, 70, 4) +
          '<path d="M140 80 L150 100 L144 118 L156 140 M184 86 L178 104 L188 124" stroke="#3b2f20" stroke-width="2.5" fill="none"/>' +
          label(160, 40, '為什麼會裂開？', { size: 13 }) + '</g>' +
          '<g data-s="1" data-hide="2">' + rock('granite', 160, 112, 110, 60, 4) +
          sun(48, 40, 'float') + cloud(120, 36) + rain(100, 150, 50) +
          '<g class="sway">' + emoji(250, 50, '💨', 22) + '</g>' + tree(262, 140, 1.1) +
          label(48, 74, '日曬', { size: 9 }) + label(124, 78, '雨淋', { size: 9 }) + label(250, 74, '風吹', { size: 9 }) + label(224, 132, '生物', { size: 9 }) +
          label(160, 170, '風化作用', { size: 12, bg: COL.weather, color: '#fff' }) + '</g>' +
          '<g data-s="2">' + sky('#fff7ed') +
          card(16, 40, 88, 110, '物理風化', '#b45309', emoji(60, 92, '🧊', 30), ' class="bounce"') +
          card(116, 40, 88, 110, '化學風化', '#0e7490', emoji(160, 92, '🧪', 30), ' class="bounce" style="animation-delay:.2s"') +
          card(216, 40, 88, 110, '生物風化', '#15803d', emoji(260, 92, '🌱', 30), ' class="bounce" style="animation-delay:.4s"') +
          '<text x="160" y="28" text-anchor="middle" font-size="14" font-weight="900" fill="#1f2933">風化的三大類</text></g>' +
          tag('風化', COL.weather);
      },
      lines: [
        '你有沒有發現，路邊的大石頭常常有裂痕，甚至一片一片剝落？堅硬的岩石，為什麼會碎掉呢？',
        '岩石長期受到風吹、日曬、雨淋、溫度變化和生物活動的影響，質地變得脆弱、碎裂，這叫做風化作用。',
        '科學家把風化分成三大類：物理風化、化學風化，和生物風化。'
      ]
    },
    {
      title: '物理風化',
      color: '#b45309',
      scene: function () {
        return sky('#fff7ed') +
          // 洋蔥狀剝落
          '<g data-s="1" data-hide="2"><rect y="140" width="320" height="40" fill="#c8a97e"/>' +
          '<g class="daynight"><g class="day">' + sun(60, 40) + '</g><g class="night">' + emoji(60, 48, '🌙', 22) + '</g></g>' +
          '<ellipse cx="180" cy="112" rx="70" ry="38" fill="#b9a27f"/>' +
          '<path class="peel" d="M118 104 Q180 60 242 104 Q236 92 180 70 Q124 92 118 104 Z" fill="#d6c3a2" stroke="#7a6248"/>' +
          label(180, 60, '受熱膨脹、遇冷收縮，表層剝落', { size: 9 }) + label(60, 80, '日夜溫差', { size: 9 }) + '</g>' +
          // 冰楔
          '<g data-s="2" data-hide="3"><rect width="320" height="180" fill="#e0f2fe"/><rect y="140" width="320" height="40" fill="#e5e7eb"/>' +
          '<path d="M90 140 L110 50 L210 50 L230 140 Z" fill="#9ca3af"/>' +
          '<path class="wedge" d="M160 52 L150 96 L160 140 L170 96 Z" fill="#bfdbfe" stroke="#3b82f6"/>' +
          arrow(146, 96, 124, 96, '#1d4ed8', ' class="push-l"') + arrow(174, 96, 196, 96, '#1d4ed8', ' class="push-r"') +
          label(160, 36, '水結冰，體積變大，把裂縫撐開', { size: 9 }) + label(250, 120, '冰楔作用', { size: 10, bg: '#1d4ed8', color: '#fff' }) + '</g>' +
          // 鹽結晶
          '<g data-s="3"><rect width="320" height="180" fill="#cfe8f7"/>' + water(0, 140, 320, 40) + waves(144) +
          '<path d="M80 140 L100 60 L220 60 L240 140 Z" fill="#a8a29e"/>' +
          '<g class="pop"><path d="M140 70 l6 30 l-4 20 M180 72 l-5 26 l6 22" stroke="#57534e" stroke-width="2" fill="none"/>' +
          '<rect x="141" y="96" width="5" height="5" fill="#fff" stroke="#94a3b8"/><rect x="176" y="98" width="5" height="5" fill="#fff" stroke="#94a3b8"/><rect x="143" y="110" width="4" height="4" fill="#fff" stroke="#94a3b8"/></g>' +
          label(160, 44, '海水的鹽在裂縫中結晶，撐破岩石', { size: 9 }) + '</g>' +
          '<g data-hide="1">' + emoji(160, 100, '🔨', 44) + '</g>' +
          tag('物理風化', '#b45309');
      },
      lines: [
        '物理風化，是岩石被撐開或磨碎，但是成分沒有改變。',
        '白天太陽曬，岩石表面受熱膨脹；晚上變冷又收縮。日復一日，表層就像洋蔥一樣，一層層剝落。',
        '水滲進岩石的裂縫，結冰時體積會變大，把裂縫越撐越開，這叫做冰楔作用。台灣的高山冬天也會發生。',
        '在海邊，海水裡的鹽分在裂縫中結晶，也會像楔子一樣把岩石撐破。'
      ]
    },
    {
      title: '化學風化',
      color: '#0e7490',
      scene: function () {
        return sky('#ecfeff') +
          '<g data-hide="1">' + emoji(160, 100, '🧪', 44) + '</g>' +
          '<g data-s="1" data-hide="2"><rect y="140" width="320" height="40" fill="#c8a97e"/>' + cloud(120, 30) + cloud(200, 36) + rain(100, 220, 46) +
          rock('limestone', 160, 116, 140, 56, 8) +
          '<g class="bubbles"><circle cx="140" cy="96" r="3" fill="#fff" stroke="#67e8f9"/><circle cx="160" cy="92" r="2.5" fill="#fff" stroke="#67e8f9"/><circle cx="180" cy="96" r="3" fill="#fff" stroke="#67e8f9"/></g>' +
          label(160, 164, '石灰岩被弱酸性的雨水慢慢溶解', { size: 9 }) + label(270, 70, '雨水＋二氧化碳＝弱酸', { size: 8 }) + '</g>' +
          '<g data-s="2"><rect y="140" width="320" height="40" fill="#c2410c" opacity=".55"/>' +
          '<ellipse cx="110" cy="112" rx="60" ry="34" fill="#9ca3af"/><ellipse class="rust" cx="110" cy="112" rx="60" ry="34" fill="#b45309"/>' +
          emoji(240, 110, '🔩', 34) + '<text x="240" y="140" text-anchor="middle" font-size="9" fill="#5f6b7a">鐵釘生鏽</text>' +
          label(110, 70, '含鐵的岩石氧化，變成紅褐色', { size: 9 }) + label(160, 166, '紅土就是這樣來的', { size: 9 }) + '</g>' +
          tag('化學風化', '#0e7490');
      },
      lines: [
        '化學風化，是岩石的成分被改變了。',
        '雨水會溶入空氣中的二氧化碳，變成很弱的酸，慢慢溶解石灰岩和大理岩。還記得稀鹽酸冒泡的實驗嗎？就是同樣的道理。',
        '含鐵的岩石遇到水和氧氣，會像鐵釘一樣生鏽，變成紅褐色。很多土壤紅紅的，就是這個原因。'
      ]
    },
    {
      title: '生物風化',
      color: '#15803d',
      scene: function () {
        return sky('#f0fdf4') + '<rect y="140" width="320" height="40" fill="#a3896b"/>' +
          '<g data-hide="3"><path d="M40 140 L70 70 L250 70 L280 140 Z" fill="#a8a29e"/>' +
          '<g data-s="0"><path class="root" d="M160 70 Q156 90 162 110 Q166 124 158 140" stroke="#7a5233" stroke-width="6" fill="none" stroke-linecap="round"/>' + tree(160, 72, 1.3) +
          label(220, 100, '樹根長粗，撐開裂縫', { size: 9 }) + '</g>' +
          '<g data-s="1"><g class="pop"><circle cx="80" cy="96" r="7" fill="#a3e635"/><circle cx="90" cy="104" r="5" fill="#bef264"/><circle cx="96" cy="92" r="4" fill="#84cc16"/></g>' +
          label(88, 124, '地衣分泌酸', { size: 9 }) + '</g></g>' +
          '<g data-s="2" data-hide="3">' + emoji(250, 160, '🐛', 16) + '<path d="M230 162 q10 -6 20 0 t20 0" stroke="#5b4636" stroke-dasharray="3 3" fill="none"/>' + label(250, 176, '小動物鑽洞翻動', { size: 8 }) + '</g>' +
          '<g data-s="3">' + sky('#f0fdf4') +
          card(20, 50, 80, 86, '物理', '#b45309', emoji(60, 96, '🧊', 26)) + card(120, 50, 80, 86, '化學', '#0e7490', emoji(160, 96, '🧪', 26)) + card(220, 50, 80, 86, '生物', '#15803d', emoji(260, 96, '🌱', 26)) +
          '<text x="160" y="160" text-anchor="middle" font-size="12" font-weight="800" fill="#1f2933">三種風化同時發生、互相幫忙</text>' +
          '<path d="M100 93 H120 M200 93 H220" stroke="#1f2933" stroke-width="2" stroke-dasharray="3 3"/></g>' +
          tag('生物風化', '#15803d');
      },
      lines: [
        '生物也會讓岩石風化。樹根鑽進岩石的裂縫，越長越粗，把岩石撐開。',
        '長在岩石上的地衣和苔蘚，會分泌酸性物質，慢慢分解岩石的表面。',
        '在地底下鑽洞的小動物，也會把岩石碎屑翻動、弄碎。',
        '通常這三種風化會同時發生、互相幫忙。例如樹根撐開的裂縫，讓雨水和冰更容易鑽進去。'
      ]
    },
    {
      title: '土壤的形成',
      color: '#78350f',
      scene: function () {
        var layers = [
          ['#3b2a1e', '表土：深色，富含腐植質', 34],
          ['#8a6a4a', '心土：顏色較淺', 30],
          ['#a8916f', '母質層：風化的岩石碎塊', 30],
          ['#6b7280', '岩盤：堅硬的岩石', 26]
        ];
        var y = 40, prof = '';
        layers.forEach(function (L, i) {
          prof += '<g data-s="2" class="slide-in" style="animation-delay:' + (i * 0.2) + 's"><rect x="40" y="' + y + '" width="110" height="' + L[2] + '" fill="' + L[0] + '"/>' +
            '<text x="160" y="' + (y + L[2] / 2 + 4) + '" font-size="9.5" font-weight="700" fill="#1f2933">' + L[1] + '</text></g>';
          y += L[2];
        });
        return sky('#fef3c7') +
          '<g data-hide="2">' + rock('granite', 70, 100, 80, 50, 21) +
          arrow(118, 100, 146, 100, '#78350f') +
          '<g>' + '<circle cx="170" cy="104" r="6" fill="#8a7a6a"/><circle cx="186" cy="110" r="3" fill="#d4b07a"/><circle cx="182" cy="98" r="3.5" fill="#a8916f"/><circle cx="196" cy="104" r="2" fill="#8a6a58"/></g>' +
          label(180, 76, '小石頭・沙・泥', { size: 9 }) +
          '<g data-s="1">' + emoji(250, 104, '🍂', 26) + '<text x="250" y="128" text-anchor="middle" font-size="9" fill="#5f6b7a">生物遺骸分解成腐植質</text>' +
          '<text x="220" y="106" font-size="18" font-weight="900" fill="#78350f">＋</text></g>' +
          '<g data-s="1">' + label(160, 160, '岩石碎屑 ＋ 腐植質 ＝ 土壤', { size: 11, bg: '#78350f', color: '#fff' }) + '</g></g>' +
          '<g data-s="2" data-hide="4">' + prof + '<rect x="40" y="36" width="110" height="5" fill="#4d8f3f"/>' + tree(70, 38, 0.9) + '</g>' +
          '<g data-s="3" data-hide="4">' + label(240, 30, '1 公分要好幾百年！', { size: 10, bg: '#b91c1c', color: '#fff' }) + '</g>' +
          '<g data-s="4">' + sky('#fef3c7') +
          '<circle cx="110" cy="96" r="52" fill="#a8916f"/>' +
          '<path d="M110 96 L110 44 A52 52 0 0 1 158 116 Z" fill="#60a5fa"/>' +
          '<path d="M110 96 L158 116 A52 52 0 0 1 72 132 Z" fill="#e0f2fe"/>' +
          '<path d="M110 96 L72 132 A52 52 0 0 1 62 118 Z" fill="#3b2a1e"/>' +
          '<text x="210" y="62" font-size="10" font-weight="700" fill="#1f2933">■ 礦物（岩石碎屑）45%</text>' +
          '<text x="210" y="82" font-size="10" font-weight="700" fill="#2563eb">■ 水 25%</text>' +
          '<text x="210" y="102" font-size="10" font-weight="700" fill="#64748b">■ 空氣 25%</text>' +
          '<text x="210" y="122" font-size="10" font-weight="700" fill="#3b2a1e">■ 腐植質 5%</text>' +
          '<text x="160" y="166" text-anchor="middle" font-size="11" font-weight="800" fill="#1f2933">植物生長、小動物居住的地方</text></g>' +
          tag('土壤', '#78350f');
      },
      lines: [
        '岩石風化以後，會變成小石頭、沙和泥。',
        '再加上植物和動物的遺骸，被分解成深色的腐植質，混合起來，就變成了土壤。',
        '挖開土壤，會看到一層一層：最上面是深色、富含腐植質的表土；下面是心土；再下面是風化的岩石碎塊，最底下是堅硬的岩盤。',
        '形成一公分厚的土壤，可能要花上好幾百年！所以土壤是非常珍貴的資源。',
        '土壤裡有礦物、腐植質，還有水和空氣，讓植物能生長，也是許多小動物的家。'
      ]
    },
    {
      title: '偵探挑戰',
      color: COL.weather,
      scene: function () {
        return '<rect width="320" height="180" fill="#111827"/>' +
          '<g class="twinkle-all"><circle cx="30" cy="30" r="1" fill="#fff"/><circle cx="290" cy="40" r="1.2" fill="#fff"/><circle cx="250" cy="20" r="1" fill="#fff"/><circle cx="60" cy="140" r="1" fill="#fff"/></g>' +
          '<circle cx="110" cy="96" r="54" fill="#d1d5db"/><circle cx="90" cy="80" r="8" fill="#9ca3af"/><circle cx="128" cy="110" r="11" fill="#9ca3af"/><circle cx="112" cy="70" r="5" fill="#9ca3af"/>' +
          '<text x="110" y="168" text-anchor="middle" font-size="11" font-weight="800" fill="#e5e7eb">月球的「月壤」</text>' +
          '<g data-s="0">' + label(240, 70, '它算是土壤嗎？', { size: 12 }) + label(240, 100, '少了什麼？', { size: 12 }) + '</g>' +
          '<g data-s="1">' + label(240, 140, '🫙 到地形實驗室做實驗！', { size: 9, bg: '#b45309', color: '#fff' }) + '</g>';
      },
      lines: [
        '偵探小挑戰：月球上也有一層細細的岩石碎屑，叫做月壤。它算是土壤嗎？想一想，它少了什麼？',
        '想知道土壤裡藏了什麼，就到地形實驗室，做做看土壤沉降瓶實驗吧！'
      ]
    }
  ];

  var Q21 = [
    { q: '岩石表面像洋蔥一樣一層層剝落，主要是什麼造成的？', options: ['白天熱、晚上冷，岩石反覆膨脹收縮', '雨水的酸把岩石溶解', '小動物啃咬岩石'], answer: 0, explain: '日夜溫差讓岩石表層反覆脹縮，最後一層層剝落，屬於物理風化。' },
    { q: '下列哪一個屬於化學風化？', options: ['樹根把裂縫撐開', '雨水溶解石灰岩', '裂縫裡的水結冰撐開岩石'], answer: 1, explain: '化學風化會改變岩石的成分，例如弱酸性的雨水溶解石灰岩、含鐵岩石生鏽。' },
    { q: '為什麼高山的岩石常因冰楔作用碎裂，熱帶的海邊卻很少？', options: ['高山的岩石比較軟', '高山的溫度常在 0 度上下，水會反覆結冰和融化', '高山的風比較大'], answer: 1, explain: '冰楔作用需要水反覆結冰（體積變大）和融化，溫度常在冰點上下的高山最容易發生。' },
    { q: '土壤是由什麼組成的？', options: ['只有磨碎的岩石', '只有腐爛的落葉', '風化的岩石碎屑、腐植質，還有水和空氣'], answer: 2, explain: '土壤是岩石碎屑加上生物遺骸分解的腐植質，裡面還有水和空氣，植物才能生長。' },
    { q: '挖開土壤，哪一層顏色最深、腐植質最多？', options: ['最上面的表土', '中間的心土', '最下面的岩盤'], answer: 0, explain: '落葉和生物遺骸在地表分解，所以最上面的表土顏色最深、腐植質最多。' },
    { q: '月球表面的「月壤」和地球的土壤，最大的不同是什麼？', options: ['月壤的顆粒比較大', '月壤沒有生物分解形成的腐植質', '月壤的顏色比較深'], answer: 1, explain: '月球沒有生物，也沒有水和空氣造成的化學風化，所以月壤只有岩石碎屑，沒有腐植質。' }
  ];

  /* =========================================================
   * 2-2 流水的作用
   * ========================================================= */
  function slopeScene(drop, x0, label1, deep) {
    var top = 150 - drop;
    var gul = deep ? '<path class="draw" d="M' + (x0 + 10) + ' ' + (top + 6) + ' Q' + (x0 + 40) + ' ' + (top + drop * 0.5) + ' ' + (x0 + 70) + ' 146" stroke="#4b3621" stroke-width="' + (deep ? 5 : 2) + '" fill="none"/>' : '';
    return '<path d="M' + x0 + ' 150 L' + x0 + ' ' + top + ' L' + (x0 + 110) + ' 150 Z" fill="#8a6a4a"/>' + gul +
      '<path class="flow" d="M' + (x0 + 4) + ' ' + (top + 2) + ' L' + (x0 + 106) + ' 148" stroke="#60a5fa" stroke-width="3" stroke-dasharray="6 6" fill="none"/>' +
      label(x0 + 55, top - 10, label1, { size: 9 });
  }

  var L22 = [
    {
      title: '流水大力士',
      color: COL.water,
      scene: function () {
        return sky() + '<path d="M0 150 L80 60 L160 150 Z" fill="#8a7a5a"/>' + cloud(70, 30) + rain(40, 120, 44) +
          '<path class="flow" d="M80 64 Q90 100 110 120 Q130 140 170 150" stroke="#a16207" stroke-width="5" stroke-dasharray="8 6" fill="none"/>' +
          '<rect y="150" width="320" height="30" fill="#c8a97e"/>' +
          '<g data-s="1">' +
          card(180, 40, 40, 80, '侵蝕', '#b91c1c', emoji(200, 80, '⛏️', 18), ' class="bounce"') +
          card(228, 40, 40, 80, '搬運', '#0369a1', emoji(248, 80, '🚚', 18), ' class="bounce" style="animation-delay:.2s"') +
          card(276, 40, 40, 80, '堆積', '#a16207', emoji(296, 80, '🏖️', 18), ' class="bounce" style="animation-delay:.4s"') + '</g>' +
          tag('流水的作用', COL.water);
      },
      lines: [
        '下過大雨後，你有沒有看過泥水從山坡上流下來？流水，是改變大地樣貌的一位大力士。',
        '流水的工作可以分成三個步驟：侵蝕、搬運，和堆積。'
      ]
    },
    {
      title: '侵蝕',
      color: '#b91c1c',
      scene: function () {
        return sky('#fef2f2') + '<rect y="150" width="320" height="30" fill="#c8a97e"/>' +
          '<g data-hide="1">' + slopeScene(90, 100, '流水把泥沙沖走', true) + '</g>' +
          '<g data-s="1" data-hide="2">' + slopeScene(50, 30, '平緩：水流慢', false) + slopeScene(110, 180, '陡峭：水流快、溝較深', true) + '</g>' +
          '<g data-s="2">' + cloud(90, 26) + cloud(170, 22) + cloud(240, 30) + rain(40, 280, 38) + slopeScene(100, 100, '豪雨：侵蝕力更強', true) +
          '<g class="fall-rock"><circle cx="140" cy="80" r="6" fill="#6b5a45"/></g>' + label(260, 120, '山崩・土石流', { size: 10, bg: '#b91c1c', color: '#fff' }) + '</g>' +
          tag('侵蝕', '#b91c1c');
      },
      lines: [
        '侵蝕，是流水把地表的泥沙和石頭沖刷、帶走。',
        '坡度越陡，水流越快，侵蝕的力量就越強，地面會被沖出一條條深溝。',
        '水量越大，侵蝕也越強，所以豪雨特別容易造成山崩和土石流。'
      ]
    },
    {
      title: '搬運',
      color: '#0369a1',
      scene: function () {
        var stones = '';
        var shapes = ['M0 -8 L9 -2 L6 8 L-7 7 L-9 -3 Z', 'M0 -7 Q8 -6 8 0 L4 7 Q-5 8 -8 2 L-6 -5 Z', 'M0 -6 Q7 -6 7 0 Q7 6 0 6 Q-7 6 -7 0 Q-7 -6 0 -6 Z', 'M0 -4 Q5 -4 5 0 Q5 4 0 4 Q-5 4 -5 0 Q-5 -4 0 -4 Z'];
        shapes.forEach(function (d, i) {
          stones += '<path transform="translate(' + (60 + i * 66) + ' 128)" d="' + d + '" fill="#8a7a6a" stroke="#4b3f33"/>';
        });
        return sky('#eff6ff') +
          '<g data-hide="2"><path d="M0 120 Q160 100 320 130 V180 H0 Z" fill="#c8a97e"/><path d="M0 128 Q160 108 320 138 V150 Q160 120 0 140 Z" fill="#4b9bcc"/>' +
          '<g class="roll"><circle cx="40" cy="132" r="5" fill="#6b5a45"/><circle cx="60" cy="130" r="3" fill="#a8916f"/></g>' +
          label(160, 80, '泥沙被流水帶往低處', { size: 10 }) +
          '<g data-s="1">' + label(80, 40, '慢：只搬得動細泥', { size: 9 }) + label(240, 40, '快：連大石頭都推得動', { size: 9, bg: '#0369a1', color: '#fff' }) +
          arrow(120, 56, 200, 56, '#0369a1') + '<text x="160" y="70" text-anchor="middle" font-size="8" fill="#1f2933">水流速度越快 →</text></g></g>' +
          '<g data-s="2"><rect width="320" height="180" fill="#eff6ff"/>' + stones +
          arrow(80, 150, 250, 150, '#0369a1') + '<text x="160" y="168" text-anchor="middle" font-size="9" fill="#1f2933">搬運得越遠 →</text>' +
          label(160, 90, '互相碰撞摩擦：越來越小、越來越圓', { size: 10 }) + '</g>' +
          tag('搬運', '#0369a1');
      },
      lines: [
        '被侵蝕下來的泥沙和石頭，會被流水帶著往低處走，這就是搬運。',
        '水流越快，能搬動的顆粒就越大。湍急的溪水，甚至能推動大石頭。',
        '石頭在搬運途中互相碰撞、摩擦，稜角被磨掉，就變得越來越小、越來越圓。'
      ]
    },
    {
      title: '堆積',
      color: '#a16207',
      scene: function () {
        var layers = '';
        [['#6f655c', 4], ['#d4b07a', 2], ['#8a6a58', 1]].forEach(function (L, i) {
          layers += '<g data-s="1" class="slide-in" style="animation-delay:' + (i * 0.3) + 's"><rect x="200" y="' + (146 - i * 12) + '" width="100" height="12" fill="' + L[0] + '"/></g>';
        });
        return sky('#fffbeb') +
          '<g data-hide="2"><path d="M0 100 L180 140 L320 146 V180 H0 Z" fill="#c8a97e"/><path d="M0 104 L180 142 L320 148 V156 L180 150 L0 112 Z" fill="#4b9bcc"/>' +
          label(80, 70, '水流快', { size: 9 }) + label(250, 110, '水流變慢 → 沉下來', { size: 9 }) + layers +
          '<g data-s="1">' + label(250, 172, '大顆先沉、細泥最後', { size: 9, bg: '#a16207', color: '#fff' }) + '</g></g>' +
          '<g data-s="2"><rect width="320" height="180" fill="#fffbeb"/>' +
          '<path d="M0 30 L120 30 L140 70 L0 90 Z" fill="#7d8a6a"/>' +
          '<path class="grow" d="M136 70 Q190 70 260 150 L60 160 Q100 110 136 70 Z" fill="#d4b07a"/>' +
          '<path d="M130 50 Q138 70 140 72 M140 72 Q170 110 200 150 M140 72 Q140 120 120 158 M140 72 Q200 100 250 140" stroke="#4b9bcc" stroke-width="2.5" fill="none"/>' +
          label(70, 22, '山谷', { size: 9 }) + label(210, 70, '沖積扇', { size: 11, bg: '#a16207', color: '#fff' }) + label(160, 172, '例：宜蘭蘭陽溪沖積扇', { size: 9 }) + '</g>' +
          tag('堆積', '#a16207');
      },
      lines: [
        '當水流變慢，搬不動的泥沙就會沉下來，這就是堆積。',
        '大顆的石頭最先沉下，細細的泥最後才沉，所以堆積物常常依照大小分開排列。',
        '河流流出山谷，坡度突然變緩，泥沙就堆成扇子的形狀，叫做沖積扇。宜蘭的蘭陽溪就有很大的沖積扇。'
      ]
    },
    {
      title: '植物與水土保持',
      color: '#15803d',
      scene: function () {
        var trees = '';
        for (var i = 0; i < 5; i++) trees += tree(186 + i * 18, 80 + i * 14, 0.7);
        return sky('#f0fdf4') + cloud(160, 24) + rain(60, 280, 36) + '<rect y="150" width="320" height="30" fill="#c8a97e"/>' +
          '<path d="M20 150 L20 70 L130 150 Z" fill="#8a6a4a"/><path class="draw" d="M30 80 Q60 110 100 146" stroke="#4b3621" stroke-width="5" fill="none"/>' +
          '<g class="roll"><circle cx="110" cy="148" r="5" fill="#6b5a45"/></g>' + label(75, 60, '裸露：土壤被沖走', { size: 9, bg: '#b91c1c', color: '#fff' }) +
          '<path d="M180 150 L180 70 L290 150 Z" fill="#8a6a4a"/>' + trees +
          '<path d="M186 90 q2 10 -2 16 M222 118 q3 8 -3 14" stroke="#7a5233" stroke-width="2" fill="none"/>' +
          label(240, 60, '有植物：根抓住土壤', { size: 9, bg: '#15803d', color: '#fff' }) +
          '<g data-s="1">' + emoji(70, 120, '🪓', 18) + '</g>' +
          '<g data-s="2">' + label(160, 170, '水土保持：保護山坡上的植物', { size: 10 }) + '</g>' +
          tag('水土保持', '#15803d');
      },
      lines: [
        '如果山坡上長滿植物，根會抓住土壤，葉子和落葉也能減緩雨水的沖刷。',
        '山坡被開發、植物被砍掉，土壤就容易被沖走，大雨時更可能發生土石流。',
        '這就是為什麼我們要保護山坡上的植物，做好水土保持。'
      ]
    },
    {
      title: '科學家的方法',
      color: COL.water,
      scene: function () {
        var row = function (y, items, hl) {
          var out = '';
          items.forEach(function (t, i) {
            out += '<rect x="' + (40 + i * 82) + '" y="' + y + '" width="76" height="24" rx="6" fill="' + (i === hl ? '#fde68a' : '#fff') + '" stroke="#94a3b8"/>' +
              '<text x="' + (78 + i * 82) + '" y="' + (y + 16) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#1f2933">' + t + '</text>';
          });
          return out;
        };
        return sky('#eff6ff') +
          '<text x="160" y="30" text-anchor="middle" font-size="13" font-weight="900" fill="#0369a1">公平測試：一次只改變一個變因</text>' +
          '<text x="20" y="66" font-size="10" font-weight="800" fill="#1f2933">A</text>' + row(50, ['坡度：陡', '水量：中', '有種草'], 2) +
          '<text x="20" y="100" font-size="10" font-weight="800" fill="#1f2933">B</text>' + row(84, ['坡度：陡', '水量：中', '沒種草'], 2) +
          '<g data-s="0">' + label(160, 128, '只有「植物」不同 → 才能比較植物的影響', { size: 9 }) + '</g>' +
          '<g data-s="1">' + label(160, 158, '💧 到地形實驗室的流水侵蝕實驗台試試看！', { size: 9, bg: '#0369a1', color: '#fff' }) + '</g>';
      },
      lines: [
        '想知道是哪個原因造成的差異，要一次只改變一個變因，其他條件都保持一樣，這叫做公平測試。',
        '除了坡度，你還想測試哪些變因？到地形實驗室的流水侵蝕實驗台試試看！'
      ]
    }
  ];

  var Q22 = [
    { q: '流水改變地表的三個作用，正確的順序是？', options: ['堆積 → 侵蝕 → 搬運', '侵蝕 → 搬運 → 堆積', '搬運 → 堆積 → 侵蝕'], answer: 1, explain: '流水先把泥沙沖下來（侵蝕），帶到低處（搬運），水流變慢時沉積下來（堆積）。' },
    { q: '在坡度比較陡的土堆上澆水，會發生什麼事？', options: ['水流較快，侵蝕出較深的溝', '水流較慢，泥沙堆積在坡上', '和平緩的一側完全一樣'], answer: 0, explain: '坡度越陡、水流越快，侵蝕和搬運的力量越強，地面被沖出較深的溝。' },
    { q: '小明想知道「植物能不能減少土壤被沖走」，實驗應該怎麼設計？', options: ['種草的土堆用比較少的水澆', '一個種草放在陡坡，一個不種草放在緩坡', '兩個土堆坡度、水量都相同，只有一個種草'], answer: 2, explain: '公平測試要一次只改變一個變因（有沒有種草），其他條件都相同，才能確定差異是植物造成的。' },
    { q: '為什麼河流上游的石頭比較大，下游比較小？', options: ['上游水流快能搬走小顆粒、只留下大石頭；石頭往下游搬運時也越磨越小', '下游的石頭被人撿走了', '上游下的雨比較大顆'], answer: 0, explain: '水流速度決定能搬動多大的顆粒，石頭在搬運途中也會互相碰撞變小、變圓。' },
    { q: '河流流出山谷，在坡度突然變緩的地方，會形成什麼地形？', options: ['V 形谷', '沖積扇', '海蝕柱'], answer: 1, explain: '坡度變緩、水流變慢，泥沙堆積成扇形的沖積扇，例如宜蘭的蘭陽溪沖積扇。' },
    { q: '山坡地大量開發、砍除植物後，豪雨時最可能增加哪一種災害？', options: ['海嘯', '火山爆發', '土石流'], answer: 2, explain: '失去植物保護的土壤容易被沖走，豪雨時可能形成土石流，所以要做好水土保持。' }
  ];

  /* =========================================================
   * 2-3 河流地形
   * ========================================================= */
  var L23 = [
    {
      title: '一條河的旅程',
      color: COL.river,
      scene: function () {
        return sky() +
          '<path d="M0 40 L60 30 L120 90 L200 130 L320 140 V180 H0 Z" fill="#7d8a6a"/>' +
          '<path d="M20 44 Q60 50 90 80 Q120 110 160 120 Q220 134 320 146" stroke="#4b9bcc" stroke-width="4" fill="none"/>' +
          water(270, 146, 50, 34) +
          '<g class="pop">' + label(84, 58, '上游', { size: 11, bg: '#7c3aed', color: '#fff' }) + '</g>' +
          '<g class="pop" style="animation-delay:.3s">' + label(150, 104, '中游', { size: 11, bg: '#c2410c', color: '#fff' }) + '</g>' +
          '<g class="pop" style="animation-delay:.6s">' + label(240, 124, '下游', { size: 11, bg: '#0369a1', color: '#fff' }) + '</g>' +
          '<text x="300" y="172" text-anchor="end" font-size="9" fill="#e0f2fe">大海</text>' +
          tag('河流地形', COL.river);
      },
      lines: [
        '一條河流從高山流到大海，一路上的樣子都不一樣。我們把它分成上游、中游和下游來看。'
      ]
    },
    {
      title: '上游',
      color: '#7c3aed',
      scene: function () {
        return sky('#f5f3ff') +
          '<g data-hide="3"><path d="M0 30 L140 140 L180 140 L320 30 V180 H0 Z" fill="#7d8a6a"/>' +
          '<path d="M140 140 L160 160 L180 140 Z" fill="#6b7a5a"/><path d="M150 150 Q160 158 170 150" stroke="#4b9bcc" stroke-width="5" fill="none"/>' +
          '<g data-s="0">' + arrow(160, 110, 160, 140, '#7c3aed', ' class="press"') + label(160, 100, '往下切', { size: 9 }) + '</g>' +
          '<g data-s="1">' + label(250, 60, 'V 形河谷', { size: 12, bg: '#7c3aed', color: '#fff' }) + '</g>' +
          '<g data-s="2">' + rock('granite', 128, 150, 26, 14, 31) + rock('andesite', 194, 150, 30, 16, 32) + label(160, 124, '大而不規則的石頭', { size: 9 }) + '</g></g>' +
          '<g data-s="3"><rect width="320" height="180" fill="#dcdcd6"/>' +
          '<path d="M0 0 L110 0 L130 170 L0 170 Z" fill="#c8c8c0"/><path d="M320 0 L210 0 L190 170 L320 170 Z" fill="#c8c8c0"/>' +
          '<path d="M130 170 L190 170" stroke="#4b9bcc" stroke-width="8"/>' +
          arrow(160, 70, 160, 140, '#7c3aed', ' class="press"') + label(160, 60, '河流下切', { size: 9 }) +
          arrow(40, 150, 40, 90, '#b91c1c', ' class="rise-up"') + arrow(280, 150, 280, 90, '#b91c1c', ' class="rise-up"') + label(40, 80, '地殼抬升', { size: 8 }) +
          label(160, 22, '太魯閣峽谷', { size: 11, bg: '#7c3aed', color: '#fff' }) + '</g>' +
          tag('上游', '#7c3aed');
      },
      lines: [
        '上游在山區，地勢陡峭，水流湍急，侵蝕的力量很強。',
        '河水不斷往下切，切出又深又窄的 V 形河谷。',
        '河床上堆滿形狀不規則的大石頭，因為小顆粒都被急流沖走了。',
        '如果河水往下切的同時，地殼也不斷抬升，就會形成像太魯閣那樣又深又陡的峽谷。'
      ]
    },
    {
      title: '中游',
      color: '#c2410c',
      scene: function () {
        var pebbles = '';
        for (var i = 0; i < 14; i++) pebbles += '<ellipse cx="' + (40 + (i * 47) % 240) + '" cy="' + (130 + (i * 13) % 30) + '" rx="' + (5 + i % 3) + '" ry="' + (3.5 + i % 2) + '" fill="' + ['#9ca3af', '#a8a29e', '#d6d3d1'][i % 3] + '" stroke="#6b7280"/>';
        return sky('#fff7ed') +
          '<g data-hide="2"><path d="M0 100 Q160 90 320 100 V180 H0 Z" fill="#a3b18a"/><path d="M0 116 Q160 106 320 116 V170 Q160 160 0 170 Z" fill="#d6cfc2"/>' +
          '<path d="M0 128 Q160 120 320 130" stroke="#4b9bcc" stroke-width="10" fill="none" opacity=".8"/>' +
          '<g data-s="0">' + label(160, 70, '地勢變緩・河道變寬・水流變慢', { size: 9 }) + '</g>' +
          '<g data-s="1">' + pebbles + label(160, 98, '圓圓的鵝卵石', { size: 10, bg: '#c2410c', color: '#fff' }) + '</g></g>' +
          '<g data-s="2"><rect width="320" height="180" fill="#fff7ed"/>' +
          '<path d="M0 20 L130 20 L140 60 L0 80 Z" fill="#7d8a6a"/>' +
          '<path class="grow" d="M138 60 Q200 70 270 150 L50 160 Q100 100 138 60 Z" fill="#d4b07a"/>' +
          '<path d="M138 60 Q170 100 200 150 M138 60 Q140 110 120 160 M138 60 Q200 90 250 140" stroke="#4b9bcc" stroke-width="2.5" fill="none"/>' +
          label(210, 80, '沖積扇', { size: 11, bg: '#c2410c', color: '#fff' }) + '</g>' +
          tag('中游', '#c2410c');
      },
      lines: [
        '到了中游，地勢變緩，河道變寬，水流速度也慢下來。',
        '河床上堆積了許多圓圓的鵝卵石，它們是從上游一路滾下來、被磨圓的。',
        '河流流出山谷時坡度突然變緩，泥沙就堆積成扇形的沖積扇。'
      ]
    },
    {
      title: '下游與出海口',
      color: '#0369a1',
      scene: function () {
        return sky('#eff6ff') +
          '<path d="M0 90 H320 V180 H0 Z" fill="#a9d18e"/>' +
          '<path d="M0 120 Q120 110 200 128 Q250 140 260 150" stroke="#4b9bcc" stroke-width="18" fill="none"/>' +
          water(240, 130, 80, 50) + waves(140) +
          '<g data-s="0">' + label(100, 80, '平坦・寬廣・水流緩慢', { size: 9 }) + '</g>' +
          '<g data-s="1"><path class="grow" d="M240 148 Q260 140 280 152 Q262 162 240 158 Z" fill="#e8d3a0"/><path class="grow" d="M262 134 Q284 128 300 140 Q284 146 262 142 Z" fill="#e8d3a0"/>' +
          label(270, 118, '沙洲・三角洲', { size: 9, bg: '#0369a1', color: '#fff' }) + '</g>' +
          '<g data-s="2">' + label(160, 166, '台灣河流：短、急、泥沙多', { size: 10, bg: '#1f2933', color: '#fff' }) + '</g>' +
          tag('下游', '#0369a1');
      },
      lines: [
        '下游地勢平坦，河道寬廣，水流緩慢，河床和出海口堆積了很多泥沙和小石頭。',
        '河流在出海口堆積泥沙，可能形成沙洲或三角洲。',
        '台灣的河流又短又急，雨又多，河水帶到海裡的泥沙量，在世界上是數一數二的。'
      ]
    },
    {
      title: '曲流',
      color: COL.river,
      scene: function () {
        var bend = 'M0 60 Q60 60 80 100 Q100 150 160 140 Q220 130 230 90 Q240 50 320 60';
        return sky('#a9d18e') +
          '<g data-hide="2"><path d="' + bend + '" stroke="#4b9bcc" stroke-width="14" fill="none"/>' +
          '<path d="M96 116 Q110 130 140 126" stroke="#e8d3a0" stroke-width="8" fill="none"/>' +
          '<g data-s="1">' + label(60, 130, '凹岸：水流快，侵蝕', { size: 9, bg: '#b91c1c', color: '#fff' }) + label(150, 112, '凸岸：水流慢，堆積', { size: 9, bg: '#a16207', color: '#fff' }) +
          arrow(66, 92, 70, 116, '#b91c1c') + '</g></g>' +
          '<g data-s="2" data-hide="3"><path d="M0 60 Q50 50 70 90 Q80 150 130 150 Q170 150 150 110 Q130 70 180 70 Q240 70 320 60" stroke="#4b9bcc" stroke-width="14" fill="none"/>' +
          label(160, 30, '越來越彎……', { size: 11 }) + '</g>' +
          '<g data-s="3"><path d="M70 90 Q80 150 130 150 Q170 150 150 110" stroke="#7aa7c9" stroke-width="12" fill="none"/>' +
          '<path class="draw" d="M0 60 Q50 50 70 90 L150 110 Q170 80 180 70 Q240 70 320 60" stroke="#4b9bcc" stroke-width="14" fill="none"/>' +
          label(110, 166, '牛軛湖', { size: 11, bg: '#0e7490', color: '#fff' }) + label(200, 100, '截彎取直', { size: 9 }) + '</g>' +
          tag('曲流', COL.river);
      },
      lines: [
        '在平坦的地方，河流常常彎彎曲曲，叫做曲流。',
        '彎道外側的凹岸，水流快，河岸被侵蝕；內側的凸岸，水流慢，泥沙堆積。',
        '久而久之，河道變得越來越彎。',
        '當兩個彎道快要碰在一起時，河水會直接截彎取直，留下來的彎曲河段，就變成了牛軛湖。'
      ]
    },
    {
      title: '人與河流',
      color: COL.river,
      scene: function () {
        return sky('#ecfeff') +
          '<path d="M0 80 H320 V180 H0 Z" fill="#cbd5e1"/>' +
          '<path d="M0 120 L320 120" stroke="#4b9bcc" stroke-width="16"/>' +
          '<path d="M0 110 H320 M0 130 H320" stroke="#6b7280" stroke-width="4"/>' +
          '<g fill="#94a3b8"><rect x="30" y="60" width="30" height="40"/><rect x="80" y="50" width="24" height="50"/><rect x="230" y="56" width="34" height="44"/><rect x="280" y="64" width="22" height="36"/></g>' +
          '<path d="M120 150 Q160 176 200 150" stroke="#7aa7c9" stroke-width="8" fill="none" stroke-dasharray="4 3"/>' +
          label(160, 168, '舊河道', { size: 8 }) + label(160, 100, '基隆河截彎取直', { size: 10, bg: '#0e7490', color: '#fff' }) +
          '<g data-s="1">' + label(160, 30, '凹岸還是凸岸？到曲流演變找答案！', { size: 9 }) + '</g>';
      },
      lines: [
        '有些地方用人工截彎取直，讓洪水快點流走，像台北的基隆河。不過，河流也可能想恢復原本彎曲的樣子。',
        '如果要在河邊蓋房子，你會選凹岸還是凸岸呢？到地形實驗室的曲流演變找答案吧！'
      ]
    }
  ];

  var Q23 = [
    { q: '河流上游通常有什麼特色？', options: ['地勢平坦、河道寬廣', '坡陡水急、河谷窄而深、有很多大石頭', '有很多細泥和小石頭'], answer: 1, explain: '上游坡陡水急、侵蝕力強，河水下切成 V 形谷，小顆粒被沖走，只留下大石頭。' },
    { q: '中游河床上圓圓的鵝卵石，為什麼是圓的？', options: ['被人工切割成圓形', '岩漿冷卻時就是圓的', '從上游被搬運時互相碰撞摩擦，稜角被磨掉'], answer: 2, explain: '石頭在搬運途中不斷碰撞、摩擦，稜角被磨掉，搬運得越遠越圓。' },
    { q: '曲流的凹岸和凸岸，哪一邊容易被侵蝕？', options: ['凹岸，因為水流較快', '凸岸，因為水流較快', '兩邊一樣'], answer: 0, explain: '彎道外側的凹岸水流快、侵蝕強；內側的凸岸水流慢，泥沙堆積。' },
    { q: '牛軛湖是怎麼形成的？', options: ['地震讓地面下陷', '曲流太彎，河水截彎取直，留下彎曲的舊河道', '人工挖掘的水池'], answer: 1, explain: '彎道越來越彎，兩個彎道接近時河水截彎取直，被切斷的舊河段就成了牛軛湖。' },
    { q: '台灣河流的特色是什麼？', options: ['又長又平緩，河水很清澈', '一年四季水量都很穩定', '又短又急，河水含沙量高'], answer: 2, explain: '台灣山高、河短、坡陡、雨多，河流又短又急，帶到海裡的泥沙量是世界數一數二的。' },
    { q: '太魯閣峽谷又深又陡，主要是怎麼形成的？', options: ['河流不斷下切侵蝕，加上地殼抬升', '冰河挖掘出來的', '人工開鑿的'], answer: 0, explain: '立霧溪不斷往下切，同時地殼持續抬升，切出又深又陡的峽谷。' }
  ];

  /* =========================================================
   * 2-4 海岸地形
   * ========================================================= */
  function headland(stage) {
    var base = 150;
    var out = '<path d="M0 60 L90 60 L100 ' + base + ' L0 ' + base + ' Z" fill="#a98a66"/>';
    if (stage === 0) out += '<path d="M90 60 L260 66 L274 ' + base + ' L96 ' + base + ' Z" fill="#b08f6a"/><path d="M180 64 L176 100 L182 ' + base + '" stroke="#5b4636" stroke-width="2" fill="none"/>';
    if (stage === 1) out += '<path d="M90 60 L260 66 L274 ' + base + ' L96 ' + base + ' Z" fill="#b08f6a"/><path d="M164 ' + base + ' Q164 112 180 110 Q196 112 196 ' + base + ' Z" fill="#2b2420"/>';
    if (stage === 2) out += '<path d="M90 60 L260 66 L274 ' + base + ' L96 ' + base + ' Z" fill="#b08f6a"/><path d="M150 ' + base + ' Q150 96 182 94 Q214 96 214 ' + base + ' Z" fill="#cfe8f7"/>';
    if (stage === 3) out += '<path d="M90 60 L140 62 L146 ' + base + ' L96 ' + base + ' Z" fill="#b08f6a"/><path d="M220 76 L262 78 L272 ' + base + ' L214 ' + base + ' Z" fill="#b08f6a"/>';
    return out;
  }

  var L24 = [
    {
      title: '海浪的力量',
      color: COL.coast,
      scene: function () {
        return sky() + water(0, 110, 320, 70) + waves(114) + waves(140) +
          '<path d="M200 110 L240 50 L320 50 V110 Z" fill="#a98a66"/>' +
          '<g class="splash"><circle cx="198" cy="100" r="6" fill="#fff"/><circle cx="190" cy="92" r="4" fill="#fff"/></g>' +
          '<path d="M0 110 Q60 100 120 110 L120 116 L0 116 Z" fill="#e8d6a8"/>' +
          '<g data-s="1">' + label(60, 90, '堆積地形', { size: 11, bg: '#a16207', color: '#fff' }) + label(260, 36, '侵蝕地形', { size: 11, bg: COL.coast, color: '#fff' }) + '</g>' +
          tag('海岸地形', COL.coast);
      },
      lines: [
        '海岸每天都受到海浪拍打。波浪也會侵蝕、搬運和堆積，改變海岸的樣子。',
        '海岸地形大致可以分成兩類：堆積地形，和侵蝕地形。'
      ]
    },
    {
      title: '堆積地形',
      color: '#a16207',
      scene: function () {
        return sky('#fffbeb') + water(0, 0, 320, 70) + waves(64) +
          '<path d="M0 70 H320 V180 H0 Z" fill="#e8d6a8"/>' +
          '<path d="M150 180 Q164 120 150 72" stroke="#4b9bcc" stroke-width="10" fill="none"/>' +
          '<g data-s="0">' + arrow(170, 30, 230, 30, '#e0f2fe') + label(240, 16, '河流帶來泥沙', { size: 8 }) + '</g>' +
          '<g data-s="1"><path class="grow" d="M30 110 q20 -16 40 0 q20 -14 40 0 L110 120 L30 120 Z" fill="#d4b07a"/>' + emoji(40, 100, '💨', 14) +
          label(70, 136, '沙丘（桃園草漯）', { size: 9 }) + label(250, 100, '沙灘', { size: 10, bg: '#a16207', color: '#fff' }) + '</g>' +
          '<g data-s="2"><path class="grow" d="M180 50 Q240 40 300 52 Q240 60 180 56 Z" fill="#e8d3a0" stroke="#c8a96b"/>' +
          label(240, 36, '沙洲（新北福隆）', { size: 9, bg: '#a16207', color: '#fff' }) + '</g>' +
          tag('堆積地形', '#a16207');
      },
      lines: [
        '在地勢平坦的海岸，河流帶來的泥沙被波浪搬動。如果帶上岸的泥沙比沖走的多，泥沙就會堆積下來。',
        '泥沙沿著海岸堆成平緩的沙灘；風把沙吹到岸上，堆成沙丘，像桃園的草漯沙丘。',
        '泥沙在海中堆成長條形的沙洲，像新北市的福隆沙洲。'
      ]
    },
    {
      title: '侵蝕地形',
      color: COL.coast,
      scene: function () {
        var tofu = '';
        for (var i = 0; i < 7; i++) tofu += '<rect x="' + (130 + i * 24) + '" y="141" width="20" height="8" fill="#a08b6e" stroke="#6b5a45"/>';
        return sky('#eff6ff') + water(0, 140, 320, 40) + waves(146) +
          '<path d="M0 40 L110 40 L120 140 L0 140 Z" fill="#a98a66"/><path d="M0 36 L110 36 L110 44 L0 44 Z" fill="#7da35a"/>' +
          '<g class="splash"><circle cx="122" cy="132" r="5" fill="#fff"/></g>' +
          '<g data-s="0">' + label(200, 60, '沿著裂縫侵蝕', { size: 9 }) + '</g>' +
          '<g data-s="1"><path d="M110 140 L300 140 L304 148 L110 148 Z" fill="#8f7a5f"/>' + label(60, 24, '海蝕崖', { size: 10, bg: COL.coast, color: '#fff' }) + label(220, 128, '海蝕平臺', { size: 10, bg: COL.coast, color: '#fff' }) + '</g>' +
          '<g data-s="2">' + tofu + label(220, 168, '豆腐岩（野柳）', { size: 9, bg: '#1f2933', color: '#fff' }) + '</g>' +
          tag('侵蝕地形', COL.coast);
      },
      lines: [
        '在波浪力量很強的岩石海岸，海浪不斷拍打岩石，沿著原有的裂縫侵蝕。',
        '岩石崩落後，留下陡峭的海蝕崖；崖腳被磨平，成為海蝕平臺。',
        '海蝕平臺上的岩石被縱橫的裂縫切割，再被侵蝕，就成了一塊塊的豆腐岩，像野柳的豆腐岩。'
      ]
    },
    {
      title: '洞・門・柱',
      color: COL.coast,
      scene: function () {
        var frames = [0, 1, 2, 3].map(function (s, i) {
          return '<g data-s="1" class="pop" style="animation-delay:' + (i * 0.35) + 's"><g style="transform-box:view-box;transform-origin:0 0" transform="translate(' + (8 + i * 78) + ' 40) scale(0.24)">' +
            '<rect width="320" height="180" fill="#cfe8f7"/>' + headland(s) + '<rect y="150" width="320" height="30" fill="#4b9bcc"/></g>' +
            '<text x="' + (8 + i * 78 + 38) + '" y="96" text-anchor="middle" font-size="9" font-weight="800" fill="#1f2933">' + ['岬角', '海蝕洞', '海蝕門', '海蝕柱'][i] + '</text>' +
            (i < 3 ? '<text x="' + (8 + i * 78 + 76) + '" y="64" font-size="10" fill="#1d4ed8">→</text>' : '') + '</g>';
        }).join('');
        return sky('#eff6ff') +
          '<g data-hide="1"><rect width="320" height="180" fill="#cfe8f7"/>' + headland(2) + water(0, 150, 320, 30) + waves(154) + label(182, 80, '同一個岬角，不同的時間', { size: 10 }) + '</g>' +
          frames +
          '<g data-s="2">' + label(160, 140, '金山燭臺雙嶼＝海蝕柱，未來也可能消失', { size: 9, bg: COL.coast, color: '#fff' }) + '</g>' +
          tag('演化順序', COL.coast);
      },
      lines: [
        '海蝕洞、海蝕門和海蝕柱，其實是同一個岬角在不同時間的樣子。',
        '海浪先在岬角的弱點挖出海蝕洞，兩側的洞打通後變成海蝕門，拱頂崩塌後，留下孤立的海蝕柱。',
        '金山的燭臺雙嶼就是海蝕柱。再過很久很久，它也可能被海浪完全侵蝕掉。'
      ]
    },
    {
      title: '岬灣與差異侵蝕',
      color: COL.coast,
      scene: function () {
        return sky('#eff6ff') +
          '<g data-hide="1">' + water(0, 0, 320, 180) +
          '<path d="M0 180 L0 100 L50 100 L70 40 L110 40 L120 110 Q160 130 200 110 L210 40 L250 40 L270 100 L320 100 V180 Z" fill="#a9d18e"/>' +
          '<path d="M120 110 Q160 130 200 110 L200 118 Q160 138 120 118 Z" fill="#e8d6a8"/>' +
          label(90, 60, '硬岩：岬角', { size: 9, bg: '#475569', color: '#fff' }) + label(160, 150, '軟岩：海灣＋沙灘', { size: 9, bg: '#a16207', color: '#fff' }) + label(230, 60, '硬岩：岬角', { size: 9, bg: '#475569', color: '#fff' }) + '</g>' +
          '<g data-s="1">' + water(0, 140, 320, 40) + waves(144) +
          '<path d="M140 140 Q136 110 144 104 Q130 96 138 80 Q156 70 166 86 Q170 100 158 106 Q166 118 162 140 Z" fill="#c9a46c"/>' +
          '<circle cx="152" cy="86" r="12" fill="#8a6a3f" opacity=".35"/>' +
          label(220, 84, '硬的頭部：留下來', { size: 9 }) + label(220, 116, '軟的脖子：被侵蝕', { size: 9 }) + label(230, 44, '女王頭：差異侵蝕', { size: 11, bg: COL.coast, color: '#fff' }) + '</g>' +
          tag('岬灣海岸', COL.coast);
      },
      lines: [
        '硬的岩石比較能抵抗侵蝕，凸出成為岬角；軟的岩石被侵蝕得快，凹進去成為海灣，沙子在灣裡堆積成沙灘。',
        '同樣的道理，野柳女王頭也是硬的頭部被保留下來、軟的脖子被侵蝕變細，這叫做差異侵蝕。'
      ]
    },
    {
      title: '人與海岸',
      color: COL.coast,
      scene: function () {
        var tetra = '';
        for (var i = 0; i < 6; i++) tetra += '<path d="M' + (60 + i * 22) + ' 140 l8 -14 l8 14 z M' + (68 + i * 22) + ' 126 v-6" fill="#9ca3af" stroke="#4b5563"/>';
        return sky('#eff6ff') + water(0, 130, 320, 50) + waves(136) +
          '<rect x="0" y="100" width="320" height="34" fill="#e8d6a8"/>' + tetra +
          '<rect x="230" y="70" width="12" height="70" fill="#6b7280"/>' +
          label(100, 96, '消波塊', { size: 9 }) + label(236, 60, '堤防', { size: 9 }) +
          '<g data-s="0">' + label(160, 30, '保護土地，但可能讓別處海岸後退', { size: 9 }) + '</g>' +
          '<g data-s="1">' + label(160, 170, '⚠️ 小心瘋狗浪，遠離岸邊和消波塊', { size: 9, bg: '#b91c1c', color: '#fff' }) + '</g>' +
          tag('人與海岸', COL.coast);
      },
      lines: [
        '人們在海岸蓋堤防、放消波塊來保護土地，但也可能擋住沙子的移動，讓別處的海岸後退。',
        '到海邊玩要注意瘋狗浪，遠離岸邊和消波塊。到地形實驗室看看突堤效應吧！'
      ]
    }
  ];

  var Q24 = [
    { q: '沙灘、沙丘、沙洲屬於哪一類海岸地形？', options: ['侵蝕地形', '堆積地形', '火山地形'], answer: 1, explain: '它們都是波浪、風把泥沙堆積而成的，屬於堆積地形。' },
    { q: '海蝕洞、海蝕門、海蝕柱的形成順序是？', options: ['海蝕洞 → 海蝕門 → 海蝕柱', '海蝕柱 → 海蝕門 → 海蝕洞', '海蝕門 → 海蝕洞 → 海蝕柱'], answer: 0, explain: '海浪先挖出海蝕洞，兩側打通成海蝕門，拱頂崩塌後留下海蝕柱。' },
    { q: '野柳的豆腐岩一塊塊方方正正，是怎麼形成的？', options: ['古代人切割的', '火山熔岩冷卻收縮', '海水沿著岩石的裂縫（節理）侵蝕'], answer: 2, explain: '岩石原本就有縱橫的裂縫，海水沿著裂縫侵蝕，就切出一塊塊像豆腐的岩石。' },
    { q: '一段海岸同時有硬岩和軟岩，哪一種會凸出成為岬角？', options: ['硬岩，因為比較能抵抗侵蝕', '軟岩，因為比較容易堆積', '兩種都不會'], answer: 0, explain: '硬岩侵蝕得慢而凸出成岬角，軟岩侵蝕得快而凹進成海灣，這是差異侵蝕。' },
    { q: '在海岸蓋了一道伸入海中的突堤，可能造成什麼結果？', options: ['兩側都長出新的沙灘', '一側沙子堆積，另一側海岸被侵蝕後退', '海浪從此完全消失'], answer: 1, explain: '突堤擋住沿岸流帶來的沙子，上游一側堆積、下游一側缺沙而後退，叫做突堤效應。' },
    { q: '到海邊遊玩，下列哪一個行為最安全？', options: ['站在消波塊上拍照', '背對海浪在礁石邊玩水', '遠離岸邊和消波塊，隨時注意浪況'], answer: 2, explain: '瘋狗浪來得又快又猛，消波塊縫隙很深又濕滑，一定要遠離岸邊、注意浪況。' }
  ];

  /* ---------- 課次資料 ---------- */

  var LESSONS = [
    { id: '2-1', name: '風化與土壤', color: COL.weather, chapters: L21, questions: Q21 },
    { id: '2-2', name: '流水的作用', color: COL.water, chapters: L22, questions: Q22 },
    { id: '2-3', name: '河流地形', color: COL.river, chapters: L23, questions: Q23 },
    { id: '2-4', name: '海岸地形', color: COL.coast, chapters: L24, questions: Q24 }
  ];

  /* ---------- 啟動 ---------- */

  function boot() {
    var player = Kit.createPlayer(document.querySelector('.player'), { chapterList: document.querySelector('.chapter-list') });
    var quiz = Kit.createQuiz(document.querySelector('.rq'), {
      messages: ['全部答對！你已經掌握這一節了，到地形實驗室挑戰看看吧！', '很棒！再看一下答錯的題目。', '再看一次影片，再來挑戰！']
    });
    var picker = document.querySelector('.lesson-picker');
    var buttons = [];

    function select(i, focus) {
      var L = LESSONS[i];
      buttons.forEach(function (b, bi) {
        b.setAttribute('aria-selected', String(bi === i));
        b.tabIndex = bi === i ? 0 : -1;
      });
      document.querySelector('#cover-title').textContent = L.id + ' ' + L.name;
      document.querySelector('#quiz-title').textContent = L.id + ' ' + L.name + '・小測驗';
      document.documentElement.style.setProperty('--lesson', L.color);
      player.load(L.chapters);
      quiz.load(L.questions);
      if (focus) buttons[i].focus();
      try { history.replaceState(null, '', '#l' + L.id.replace('-', '')); } catch (e) { /* 忽略 */ }
    }

    LESSONS.forEach(function (L, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lesson-btn';
      b.setAttribute('role', 'tab');
      b.style.setProperty('--c', L.color);
      b.innerHTML = '<span class="lesson-id"></span><span class="lesson-name"></span>';
      b.querySelector('.lesson-id').textContent = L.id;
      b.querySelector('.lesson-name').textContent = L.name;
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % LESSONS.length, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); select((i + LESSONS.length - 1) % LESSONS.length, true); }
      });
      picker.appendChild(b);
      buttons.push(b);
    });

    var m = (location.hash || '').match(/^#l2(\d)$/);
    var start = m ? Math.max(0, Math.min(3, +m[1] - 1)) : 0;
    select(start);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
