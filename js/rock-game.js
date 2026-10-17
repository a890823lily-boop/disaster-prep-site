(function () {
  'use strict';

  /* =========================================================
   * 岩石偵探：消失的標本標籤
   * 偵探在四個場景中走動，找到可疑的岩石後用工具蒐集證據，
   * 推理出岩石的家族、名稱與關鍵證據。全部破案後解開最終謎題。
   * ========================================================= */

  var Art = window.RockArt;
  var rock = Art.rock, sparkle = Art.sparkle;

  var STORE_KEY = 'rock-detective-v1';
  var GROUND = 150;
  var VIEW_W = 320;          // 鏡頭寬度；手機上會拉近
  var VIEW_Y = 0;
  var VIEW_H = 180;
  var SPEED = 80;            // 每秒移動距離（SVG 單位）
  var NEAR = 26;             // 靠近多少距離可以互動
  var EFFICIENT_TOOLS = 2;   // 用幾種以內的工具破案可得效率星

  /* ---------- 岩石家族 ---------- */

  var FAMILIES = {
    igneous: { name: '火成岩', color: '#d9480f', hint: '看得到交錯的晶體或氣孔、不分層、不會冒泡，通常和岩漿冷卻有關。' },
    sedimentary: { name: '沉積岩', color: '#a16207', hint: '有分層、顆粒是砂或礫石、或含有化石，通常是一層層堆積形成的。' },
    metamorphic: { name: '變質岩', color: '#7c3aed', hint: '有條紋、片狀，或晶體閃亮又排成同一方向，代表受過高溫高壓。' },
    artificial: { name: '人造石材', color: '#475569', hint: '注意有沒有水泥、筆直的人工線條，以及大小太過平均的石粒。' }
  };
  var FAMILY_ORDER = ['igneous', 'sedimentary', 'metamorphic', 'artificial'];

  /* ---------- 工具 ---------- */

  var TOOLS = [
    { id: 'lens', icon: '🔍', name: '放大鏡', desc: '看顆粒與晶體' },
    { id: 'light', icon: '🔦', name: '側光照射', desc: '看顏色、反光、分層' },
    { id: 'acid', icon: '🧪', name: '滴稀鹽酸', desc: '看會不會冒泡' },
    { id: 'water', icon: '💧', name: '泡水', desc: '看浮沉與吸水' }
  ];

  /* ---------- 岩石標本 ---------- */

  var ROCKS = {
    andesite: {
      name: '安山岩', family: 'igneous', tex: 'andesite', seed: 11,
      options: ['安山岩', '大理岩', '礫岩'], fizz: 'none', floats: false, absorbs: false, shiny: false,
      ev: {
        lens: '灰色細粒的底色裡，零星散布著白色、黑色的小晶體。',
        light: '灰色，不分層，不太反光。',
        acid: '滴上鹽酸，沒有冒泡。',
        water: '咚！沉到水底，沒有吸水。'
      },
      key: ['lens'],
      nameHint: '大理岩會冒泡、礫岩看得到圓圓的小石頭。這塊兩者都沒有，再看看放大鏡下的晶體。',
      explain: '「細粒的底＋零星的大晶體」叫做斑狀組織，代表兩段冷卻：岩漿先在地底慢慢長出一些晶體，再噴出地表快速冷卻。大屯火山群的岩石大多是安山岩。'
    },
    pumice: {
      name: '浮石', family: 'igneous', tex: 'pumice', seed: 12,
      options: ['浮石', '砂岩', '石灰岩'], fizz: 'none', floats: true, absorbs: false, shiny: false,
      ev: {
        lens: '全身都是大大小小的氣孔，像海綿一樣。',
        light: '淺灰白色，拿起來輕得不可思議。',
        acid: '滴上鹽酸，沒有冒泡。',
        water: '它竟然浮在水面上！'
      },
      key: ['water', 'lens'],
      nameHint: '砂岩是一顆顆砂粒、石灰岩會冒泡。會浮在水上的石頭，裡面一定藏了很多什麼？',
      explain: '火山噴發時，充滿氣體的岩漿瞬間冷卻，把無數氣泡封在石頭裡，整塊石頭比水還輕，所以會浮起來。'
    },
    basalt: {
      name: '玄武岩', family: 'igneous', tex: 'basalt', seed: 13,
      options: ['玄武岩', '花崗岩', '頁岩'], fizz: 'none', floats: false, absorbs: false, shiny: false,
      ev: {
        lens: '顆粒非常細，幾乎看不到晶體，還有一些小洞（氣孔）。',
        light: '深灰黑色，不反光，看不到分層。',
        acid: '滴上鹽酸，沒有冒泡。',
        water: '咚！沉到水底。'
      },
      key: ['lens'],
      nameHint: '花崗岩的晶體大到肉眼看得見；頁岩一層一層、容易剝開。這塊晶體細小又有氣孔。',
      explain: '岩漿噴出地表後很快冷卻，礦物來不及長大，所以晶體很細；冷卻時氣體跑出來，留下氣孔。澎湖的柱狀玄武岩就是這樣形成的。'
    },
    sandstone: {
      name: '砂岩', family: 'sedimentary', tex: 'sandstone', seed: 21,
      options: ['砂岩', '頁岩', '花崗岩'], fizz: 'none', floats: false, absorbs: true, shiny: false,
      ev: {
        lens: '一顆一顆的砂粒，大小差不多，摸起來像砂紙。',
        light: '黃褐色，側面看得到一層一層的紋路。',
        acid: '滴上鹽酸，沒有明顯冒泡。',
        water: '冒出一串小氣泡，顏色很快變深──它在吸水！'
      },
      key: ['lens', 'light', 'water'],
      nameHint: '頁岩的顆粒細到看不見；花崗岩是交錯的晶體。這塊的顆粒是什麼？',
      explain: '砂粒在海邊或河邊一層層堆積、壓緊膠結成砂岩。砂粒之間有縫隙，所以會吸水。野柳的岩石大多是砂岩。'
    },
    shale: {
      name: '頁岩', family: 'sedimentary', tex: 'shale', seed: 22,
      options: ['頁岩', '板岩', '玄武岩'], fizz: 'none', floats: false, absorbs: true, shiny: false,
      ev: {
        lens: '顆粒細到看不見，摸起來滑滑的，像乾掉的泥巴。',
        light: '灰黑色、暗暗的不反光，有很薄的層，容易一片片剝開。',
        acid: '滴上鹽酸，沒有冒泡。',
        water: '表面變暗，邊緣有一點變軟、泥化。'
      },
      key: ['light', 'water'],
      nameHint: '板岩和頁岩長得很像，但板岩經過變質，又硬又有微微的光澤，泡水也不會變軟。',
      explain: '頁岩是很細的泥一層層堆積形成的，所以容易沿著層面剝開，泡水會軟化。頁岩受到高溫高壓，就會變成板岩。'
    },
    conglomerate: {
      name: '礫岩', family: 'sedimentary', tex: 'conglomerate', seed: 23,
      options: ['礫岩', '花崗岩', '安山岩'], fizz: 'none', floats: false, absorbs: true, shiny: false,
      ev: {
        lens: '大小不一、圓滾滾的小石頭，被細砂自然黏在一起。',
        light: '有些地方隱約看得出分層。',
        acid: '滴上鹽酸，沒有明顯冒泡。',
        water: '細砂的部分吸了水，顏色變深。'
      },
      key: ['lens'],
      nameHint: '花崗岩、安山岩都是岩漿形成的晶體，不會有圓圓的小石頭。',
      explain: '礫石被河水搬運很遠，一路碰撞磨掉稜角才變圓，最後和砂一起堆積膠結成礫岩。石頭越圓，代表搬運得越遠！'
    },
    limestone: {
      name: '石灰岩', family: 'sedimentary', tex: 'limestone', seed: 24,
      options: ['石灰岩', '大理岩', '浮石'], fizz: 'strong', floats: false, absorbs: false, shiny: false,
      ev: {
        lens: '看得到貝殼和珊瑚的碎片，是古代生物的化石！',
        light: '淺灰白色，暗暗的，不太反光。',
        acid: '滋滋滋──劇烈冒泡！',
        water: '咚！沉到水底。'
      },
      key: ['lens'],
      nameHint: '大理岩也會冒泡！但大理岩經過變質，化石會消失，晶體會變得閃亮。',
      explain: '石灰岩由珊瑚、貝殼的碳酸鈣堆積而成，遇到鹽酸會產生二氧化碳氣泡。有化石、晶體不明顯，就能和大理岩分開。'
    },
    marble: {
      name: '大理岩', family: 'metamorphic', tex: 'marble', seed: 31,
      options: ['大理岩', '石灰岩', '花崗岩'], fizz: 'strong', floats: false, absorbs: false, shiny: true,
      ev: {
        lens: '一顆顆亮晶晶的晶體緊緊排在一起，像方糖，找不到化石。',
        light: '白色帶灰色紋路，轉動時閃閃發亮。',
        acid: '滋滋滋──冒泡了！',
        water: '咚！沉到水底。'
      },
      key: ['lens', 'light'],
      nameHint: '石灰岩也會冒泡喔！冒泡只能說明含碳酸鈣。再看看有沒有化石、晶體亮不亮。',
      explain: '石灰岩被埋到深處，受到高溫高壓，重新結晶成閃亮的大理岩，化石也消失了。兩者都會冒泡，要靠晶體來分辨。太魯閣峽谷就是由大理岩構成。'
    },
    schist: {
      name: '片岩', family: 'metamorphic', tex: 'schist', seed: 32,
      options: ['片岩', '頁岩', '砂岩'], fizz: 'none', floats: false, absorbs: false, shiny: true,
      ev: {
        lens: '許多薄薄的亮片（雲母）朝同一個方向排列。',
        light: '閃閃發亮，有波浪狀的片狀紋理。',
        acid: '滴上鹽酸，沒有冒泡。',
        water: '沉到水底，不會變軟。'
      },
      key: ['lens', 'light'],
      nameHint: '頁岩暗暗的不反光、泡水會軟化；砂岩是一顆顆砂粒。這塊閃閃發亮的片狀紋理是怎麼來的？',
      explain: '泥質的岩石受到更高的溫度和壓力，長出許多雲母，並排成同一方向，就成了閃亮的片岩。'
    },
    gneiss: {
      name: '片麻岩', family: 'metamorphic', tex: 'gneiss', seed: 33,
      options: ['片麻岩', '花崗岩', '礫岩'], fizz: 'none', floats: false, absorbs: false, shiny: false,
      ev: {
        lens: '看得到晶體，但深色和淺色的礦物分開，排成一條一條。',
        light: '黑白相間的粗條紋，像斑馬。',
        acid: '滴上鹽酸，沒有冒泡。',
        water: '咚！沉到水底。'
      },
      key: ['lens', 'light'],
      nameHint: '花崗岩也有晶體，但它的晶體隨意分布、沒有條紋。條紋代表什麼？',
      explain: '片麻岩在非常高的溫度和壓力下形成，礦物分開排成條紋。它和花崗岩一樣有晶體，但花崗岩的晶體沒有方向。'
    },
    granite: {
      name: '花崗岩', family: 'igneous', tex: 'granite', seed: 41,
      options: ['花崗岩', '片麻岩', '礫岩'], fizz: 'none', floats: false, absorbs: false, shiny: true,
      ev: {
        lens: '黑、白、粉紅色的大晶體互相咬合，排列沒有方向。',
        light: '不分層，有些晶體會閃光。',
        acid: '滴上鹽酸，沒有冒泡。',
        water: '咚！沉到水底。'
      },
      key: ['lens'],
      nameHint: '片麻岩的晶體排成條紋；礫岩是圓圓的小石頭。這塊的晶體有沒有方向？',
      explain: '岩漿在地底慢慢冷卻，晶體有時間長大，所以晶體大又沒有方向。花崗岩堅硬耐磨，常被做成校名石和地板。'
    },
    terrazzo: {
      name: '磨石子', family: 'artificial', tex: 'terrazzo', seed: 42,
      options: ['磨石子', '大理岩', '礫岩'], fizz: 'weak', floats: false, absorbs: false, shiny: true,
      ev: {
        lens: '大小很平均的碎石片，鑲在灰色的水泥裡。',
        light: '表面磨得又平又亮，還有一條筆直的金屬分隔條。',
        acid: '灰色水泥的部分微微冒泡。',
        water: '咚！沉到水底。'
      },
      key: ['light', 'lens'],
      nameHint: '大自然做得出筆直的金屬分隔條嗎？碎石為什麼大小這麼平均？',
      explain: '磨石子是把碎石和水泥混合、鋪平後再磨亮的人造石材。大自然不會做出筆直、等距的分隔條，碎石大小也不會這麼平均。'
    },
    pebblewash: {
      name: '洗石子', family: 'artificial', tex: 'pebblewash', seed: 43,
      options: ['洗石子', '礫岩', '砂岩'], fizz: 'weak', floats: false, absorbs: true, shiny: false,
      ev: {
        lens: '大小相近的圓石一半露在外面，周圍是灰色的水泥。',
        light: '表面凹凸粗糙，整片鋪得一模一樣，沒有分層。',
        acid: '灰色水泥的部分微微冒泡。',
        water: '水泥的部分吸了一點水。'
      },
      key: ['lens', 'light'],
      nameHint: '礫岩的礫石大小不一、自然膠結，常有分層。這塊的石頭是用什麼黏住的？',
      explain: '洗石子是水泥還沒乾時，用水把表面的水泥洗掉，讓小石頭露出來。它很像礫岩，但礫岩是天然膠結、大小不一，常有分層。'
    }
  };

  /* ---------- 場景 ---------- */

  var SCENES = [
    {
      id: 'volcano', name: '火山海岸', place: '澎湖・大屯火山', width: 640, pin: [58, 124],
      intro: [
        '這裡是火山活動留下的海岸。遠方是大屯火山，海邊有一整排黑色的石柱。',
        '博士的標本箱裡，有三塊石頭來自這裡。到處走走，靠近可疑的石頭就能調查。漂流木後面好像也藏了東西……'
      ],
      rocks: [
        { id: 'andesite', x: 120 },
        { id: 'pumice', x: 310, hidden: 'driftwood' },
        { id: 'basalt', x: 480 }
      ],
      npcX: 590,
      think: {
        q: '澎湖的玄武岩常常是一根根六角形的石柱，為什麼會這樣？',
        options: ['熔岩冷卻時收縮，裂成柱狀，就像泥巴乾掉會裂開', '古代的人把石頭切成六角形', '海浪把石頭磨成六角形'],
        answer: 0,
        explain: '厚厚的熔岩冷卻收縮時，表面會裂出許多多邊形的裂縫，最省力的形狀接近六角形，裂縫往下延伸就成了「柱狀節理」。'
      }
    },
    {
      id: 'coast', name: '奇岩海岸', place: '北海岸・野柳', width: 680, pin: [218, 26],
      intro: [
        '北海岸的野柳，到處都是被海浪和風雕刻過的奇怪岩石，還有有名的女王頭。',
        '這裡有四塊標本要調查。潮間帶的水池裡，好像有東西在閃……'
      ],
      rocks: [
        { id: 'sandstone', x: 105 },
        { id: 'shale', x: 250 },
        { id: 'conglomerate', x: 430 },
        { id: 'limestone', x: 580, hidden: 'pool' }
      ],
      npcX: 640,
      think: {
        q: '野柳女王頭的「脖子」越來越細，為什麼？',
        options: ['頭部的岩石比較硬，脖子比較軟，被風和海浪侵蝕得比較快', '有遊客偷偷把脖子挖細', '脖子是石灰岩，被雨水溶掉了'],
        answer: 0,
        explain: '女王頭的頭部含有較硬的鈣質結核，比較能抵抗侵蝕；脖子的砂岩較軟，被風化、侵蝕得比較快。這叫做「差異侵蝕」。'
      }
    },
    {
      id: 'gorge', name: '大理石峽谷', place: '花蓮・太魯閣', width: 660, pin: [222, 140],
      intro: [
        '太魯閣峽谷的岩壁又高又陡，立霧溪在谷底奔流。注意落石！',
        '這裡的三塊標本都經歷過地底的高溫高壓。草叢後面好像有一塊條紋石頭。'
      ],
      rocks: [
        { id: 'marble', x: 120 },
        { id: 'schist', x: 330 },
        { id: 'gneiss', x: 530, hidden: 'bush' }
      ],
      npcX: 610,
      think: {
        q: '片岩、片麻岩的礦物為什麼會排成同一個方向？',
        options: ['受到某個方向的強大擠壓，礦物轉向排列', '岩漿流動時把礦物排好', '河水把礦物沖得很整齊'],
        answer: 0,
        explain: '礦物會轉到和擠壓方向垂直的方向排列，就像一疊撲克牌被壓住後會平躺。看到條紋或片狀，就是岩石受過擠壓的證據。'
      }
    },
    {
      id: 'campus', name: '我們的校園', place: '學校', width: 640, pin: [150, 84],
      intro: [
        '最後回到熟悉的校園。校名石、走廊地板、操場邊……你們之前偵查過的地方！',
        '小心，博士說這裡有「冒牌岩石」。天然的岩石，還是人做出來的？用證據說話！'
      ],
      rocks: [
        { id: 'granite', x: 115 },
        { id: 'terrazzo', x: 345 },
        { id: 'pebblewash', x: 525 }
      ],
      npcX: 600,
      think: {
        q: '偵探要怎麼分辨「天然岩石」和「人造石材」？哪個證據最可靠？',
        options: ['出現水泥，以及筆直、等距的人工線條', '石頭有很多種顏色', '摸起來很硬'],
        answer: 0,
        explain: '天然岩石也可能有很多顏色、也很硬，所以那兩個證據分不出來。水泥和筆直的人工線條，才是人造石材獨有的證據。'
      }
    }
  ];

  var FINAL = {
    title: '最終案件：一顆砂粒的時空旅程',
    intro: '博士的筆記只剩最後一頁：一顆石英砂粒，在幾億年裡當過三種岩石。筆記被撕成碎片了，請依照時間順序排好！',
    cards: [
      '🌋 地底的岩漿慢慢冷卻，石英結晶，形成花崗岩',
      '⛰️ 地殼抬升，花崗岩露出地表，被風化成砂',
      '🌊 河流把砂搬到海邊，一層層堆積',
      '🧱 砂被壓緊、膠結，變成砂岩',
      '🔥 砂岩被推到地底深處，在高溫高壓下變成石英岩'
    ],
    families: ['火成岩', '', '', '沉積岩', '變質岩'],
    explain: '同一顆砂粒當過火成岩、沉積岩和變質岩，這就是「岩石循環」。如果石英岩再熔化成岩漿，旅程又會重新開始！'
  };

  var TOTAL_ROCKS = Object.keys(ROCKS).length;
  var MAX_STARS = TOTAL_ROCKS * 3 + SCENES.length + 3;

  /* ---------- 進度存檔 ---------- */

  var state = load();

  function blank() {
    return { solved: {}, revealed: {}, think: {}, thinkDone: {}, final: 0, introSeen: {} };
  }

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.solved) return Object.assign(blank(), s);
    } catch (e) { /* 忽略 */ }
    return blank();
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* 忽略 */ }
  }

  function totalStars() {
    var n = 0;
    Object.keys(state.solved).forEach(function (k) { n += state.solved[k].stars; });
    Object.keys(state.think).forEach(function (k) { if (state.think[k]) n++; });
    return n + (state.final || 0);
  }

  function solvedCount() { return Object.keys(state.solved).length; }

  function sceneSolved(scene) {
    return scene.rocks.every(function (r) { return state.solved[r.id]; });
  }

  /* ---------- 小工具 ---------- */

  function $(sel, root) { return (root || document).querySelector(sel); }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function stars(n, max) {
    return '★★★★'.slice(0, n) + '☆☆☆☆'.slice(0, (max || 3) - n);
  }

  /* ---------- 角色 ---------- */

  function detectiveSVG() {
    return '' +
      '<g class="det-body">' +
        '<g class="leg leg-b"><path d="M-2 -16 L-3 0" stroke="#3b2f2a" stroke-width="4" stroke-linecap="round"/></g>' +
        '<g class="leg leg-f"><path d="M3 -16 L4 0" stroke="#4a3b34" stroke-width="4" stroke-linecap="round"/></g>' +
        '<path d="M-9 -15 L-7 -36 H7 L10 -15 Z" fill="#a0703f"/>' +
        '<path d="M-7 -36 H7 L5 -28 H-5 Z" fill="#8a5c30"/>' +
        '<circle cy="-43" r="7.5" fill="#f2c9a0"/>' +
        '<circle cx="3" cy="-44" r="1.1" fill="#2d2d2d"/>' +
        '<path d="M-9 -46 Q0 -56 9 -46 L11 -45 H-11 Z" fill="#6b5a3a"/>' +
        '<path d="M-6 -50 L6 -50" stroke="#53452c" stroke-width="1.5"/>' +
        '<g class="det-arm"><path d="M4 -32 L13 -26" stroke="#a0703f" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M13 -26 L16 -31" stroke="#5b4636" stroke-width="2"/>' +
          '<circle cx="18" cy="-35" r="5" fill="#cfeaf7" fill-opacity=".7" stroke="#5b4636" stroke-width="2"/></g>' +
      '</g>';
  }

  function npcSVG() {
    return '' +
      '<path d="M-3 -16 L-4 0 M3 -16 L4 0" stroke="#4b5563" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M-9 -15 L-7 -36 H7 L9 -15 Z" fill="#f1f5f9" stroke="#cbd5e1"/>' +
      '<circle cy="-43" r="7.5" fill="#f2c9a0"/>' +
      '<path d="M-6 -40 Q0 -32 6 -40 Q4 -35 0 -34 Q-4 -35 -6 -40 Z" fill="#e5e7eb"/>' +
      '<path d="M-12 -47 H12 L8 -50 Q0 -57 -8 -50 Z" fill="#a3895b"/>' +
      '<path d="M8 -30 L14 -14" stroke="#7a5c3a" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M12 -15 l4 -4 l3 3 z" fill="#64748b"/>';
  }

  /* ---------- 場景繪製 ---------- */

  function ground(w, color) {
    return '<rect y="' + GROUND + '" width="' + w + '" height="30" fill="' + color + '"/>';
  }

  function sceneArt(scene) {
    var w = scene.width;
    switch (scene.id) {
      case 'volcano':
        var cols = '';
        for (var c = 0; c < 9; c++) {
          var hh = 60 + ((c * 37) % 30);
          var cx = 440 + c * 11;
          cols += '<rect x="' + cx + '" y="' + (GROUND - hh) + '" width="11" height="' + hh + '" fill="' + (c % 2 ? '#3c3f45' : '#34373c') + '" stroke="#24262a" stroke-width=".8"/>' +
            '<path d="M' + cx + ' ' + (GROUND - hh) + ' l2 -3 h7 l2 3 z" fill="#54585f"/>';
        }
        return '' +
          '<rect width="' + w + '" height="180" fill="#bfe3f5"/>' +
          '<path d="M10 150 L100 62 H126 L216 150 Z" fill="#8b7d70"/><path d="M100 62 H126 L118 74 H108 Z" fill="#6f6257"/>' +
          '<g class="smoke"><circle cx="112" cy="50" r="7" fill="#e5e7eb"/><circle cx="120" cy="40" r="9" fill="#eef0f2"/><circle cx="110" cy="28" r="11" fill="#f3f4f6"/></g>' +
          '<rect x="370" y="122" width="' + (w - 370) + '" height="58" fill="#4f9fd0"/>' +
          '<path class="wave" d="M370 126 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#e0f2fe" stroke-width="2" fill="none"/>' +
          cols +
          ground(370, '#8a7a66') + '<path d="M360 150 Q420 146 ' + w + ' 152 V180 H360 Z" fill="#e8d6a8"/>' +
          sign(170, '大屯火山步道') + sign(405, '柱狀玄武岩');
      case 'coast':
        return '' +
          '<rect width="' + w + '" height="180" fill="#c6e6f6"/>' +
          '<rect x="450" y="126" width="' + (w - 450) + '" height="54" fill="#4b9bcc"/>' +
          '<path class="wave" d="M450 130 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#e0f2fe" stroke-width="2" fill="none"/>' +
          // 砂岩崖
          '<g><rect x="30" y="72" width="140" height="78" fill="#d7b07a"/>' +
          '<path d="M30 84 H170 M30 96 H170 M30 110 H170 M30 124 H170 M30 138 H170" stroke="#b98d54" stroke-width="2"/>' +
          '<path d="M30 72 Q100 60 170 72" fill="#d7b07a"/></g>' +
          // 頁岩露頭
          '<g><path d="M205 150 V118 Q250 110 295 120 V150 Z" fill="#5d6168"/>' +
          '<path d="M205 124 H295 M205 129 H295 M205 134 H295 M205 139 H295 M205 144 H295" stroke="#454950" stroke-width="1"/></g>' +
          // 女王頭與蕈狀岩
          '<g><path d="M330 150 Q326 128 334 120 Q324 112 330 98 Q346 88 354 104 Q358 116 348 122 Q354 132 350 150 Z" fill="#c9a46c"/>' +
          '<path d="M372 150 Q370 134 376 130 Q362 126 366 116 Q382 108 396 116 Q400 126 386 130 Q390 138 388 150 Z" fill="#c29a62"/></g>' +
          ground(450, '#d9bd8e') + '<path d="M440 150 Q500 146 ' + w + ' 152 V180 H440 Z" fill="#cdb183"/>' +
          sign(300, '女王頭 請勿觸摸');
      case 'gorge':
        var streaks = '';
        for (var s = 0; s < w; s += 26) {
          streaks += '<path d="M' + s + ' 0 Q' + (s + 8) + ' 60 ' + (s + 3) + ' 140" stroke="#b9bcc0" stroke-width="' + (1 + (s % 3)) + '" fill="none" opacity=".6"/>';
        }
        return '' +
          '<rect width="' + w + '" height="180" fill="#dcdcd6"/>' + streaks +
          '<rect x="230" y="0" width="120" height="18" fill="#bfe3f5"/>' +
          '<path d="M372 46 Q420 70 468 46" stroke="#c0392b" stroke-width="3" fill="none"/><path d="M372 46 V58 M468 46 V58 M384 52 V62 M396 56 V64 M408 58 V66 M420 59 V66 M432 58 V66 M444 56 V64 M456 52 V62" stroke="#c0392b" stroke-width="1"/>' +
          '<path d="M260 150 V112 Q280 96 300 112 V150 Z" fill="#3f3f46"/>' +
          ground(w, '#9a958e') +
          '<rect y="168" width="' + w + '" height="12" fill="#6fb6d9"/><path class="wave" d="M0 172 q10 -3 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#e0f2fe" stroke-width="1.5" fill="none"/>' +
          warning(200, '小心落石') + sign(430, '立霧溪');
      case 'campus':
        return '' +
          '<rect width="' + w + '" height="180" fill="#cfe8f7"/>' +
          '<rect x="0" y="50" width="250" height="100" fill="#f4e3c3"/>' +
          '<g fill="#9ccbe8"><rect x="20" y="64" width="26" height="20"/><rect x="62" y="64" width="26" height="20"/><rect x="160" y="64" width="26" height="20"/><rect x="202" y="64" width="26" height="20"/>' +
          '<rect x="20" y="102" width="26" height="20"/><rect x="202" y="102" width="26" height="20"/></g>' +
          '<rect x="0" y="44" width="250" height="8" fill="#c0392b"/>' +
          // 走廊
          '<rect x="270" y="78" width="160" height="8" fill="#8a7b6a"/><rect x="274" y="86" width="6" height="64" fill="#b8ab9a"/><rect x="420" y="86" width="6" height="64" fill="#b8ab9a"/>' +
          '<rect x="270" y="146" width="160" height="6" fill="#a3a39e"/>' +
          // 操場
          '<rect x="460" y="140" width="' + (w - 460) + '" height="12" fill="#c2553f"/><path d="M460 146 H' + w + '" stroke="#fff" stroke-width="1" stroke-dasharray="8 6"/>' +
          '<rect x="610" y="40" width="3" height="110" fill="#9ca3af"/><path d="M613 42 h20 v12 h-20 z" fill="#ef4444"/>' +
          ground(w, '#bdb6a8') +
          sign(205, '校名石') + sign(372, '走廊') + sign(468, '操場步道');
    }
    return '';
  }

  function sign(x, text) {
    var wdt = text.length * 8 + 12;
    return '<g><rect x="' + (x - 1) + '" y="' + (GROUND - 30) + '" width="3" height="30" fill="#7a5c3a"/>' +
      '<rect x="' + (x - wdt / 2) + '" y="' + (GROUND - 44) + '" width="' + wdt + '" height="16" rx="3" fill="#fef3c7" stroke="#7a5c3a"/>' +
      '<text x="' + x + '" y="' + (GROUND - 32.5) + '" text-anchor="middle" font-size="8" font-weight="700" fill="#5b4636">' + text + '</text></g>';
  }

  function warning(x, text) {
    return '<g><rect x="' + (x - 1.5) + '" y="' + (GROUND - 34) + '" width="3" height="34" fill="#555"/>' +
      '<path d="M' + x + ' ' + (GROUND - 62) + ' L' + (x + 16) + ' ' + (GROUND - 34) + ' H' + (x - 16) + ' Z" fill="#facc15" stroke="#1f2933" stroke-width="1.5"/>' +
      '<text x="' + x + '" y="' + (GROUND - 39) + '" text-anchor="middle" font-size="13" font-weight="900">!</text>' +
      '<text x="' + x + '" y="' + (GROUND - 24) + '" text-anchor="middle" font-size="7" font-weight="700" fill="#1f2933">' + text + '</text></g>';
  }

  function cover(type, x) {
    switch (type) {
      case 'driftwood':
        return '<g class="cover" data-x="' + x + '"><path d="M' + (x - 26) + ' ' + (GROUND - 2) + ' q26 -12 52 -4 q4 6 -2 8 q-24 4 -50 2 z" fill="#8b6a4a"/>' +
          '<circle cx="' + (x + 22) + '" cy="' + (GROUND - 5) + '" r="3" fill="#6b4f36"/><path d="M' + (x - 10) + ' ' + (GROUND - 8) + ' l-6 -10" stroke="#8b6a4a" stroke-width="3"/></g>';
      case 'pool':
        return '<g class="cover" data-x="' + x + '"><ellipse cx="' + x + '" cy="' + (GROUND + 2) + '" rx="30" ry="7" fill="#5aa7d6"/>' +
          '<path d="M' + (x - 14) + ' ' + GROUND + ' q-4 -14 2 -20 M' + (x - 6) + ' ' + GROUND + ' q4 -12 -2 -18 M' + (x + 10) + ' ' + GROUND + ' q-3 -12 3 -16" stroke="#3f8f4f" stroke-width="3" fill="none"/></g>';
      case 'bush':
        return '<g class="cover" data-x="' + x + '"><circle cx="' + (x - 12) + '" cy="' + (GROUND - 10) + '" r="13" fill="#4d8f3f"/><circle cx="' + (x + 8) + '" cy="' + (GROUND - 14) + '" r="15" fill="#5ea24d"/>' +
          '<circle cx="' + (x + 20) + '" cy="' + (GROUND - 6) + '" r="10" fill="#4d8f3f"/></g>';
    }
    return '';
  }

  /* ---------- 遊戲主體 ---------- */

  function initGame() {
    var game = $('.game');
    if (!game) return;

    var els = {
      stage: $('.game-stage', game),
      svg: $('.game-stage svg', game),
      hudScene: $('#hud-scene', game),
      hudStars: $('#hud-stars', game),
      hudSolved: $('#hud-solved', game),
      action: $('#ctl-action', game),
      left: $('#ctl-left', game),
      right: $('#ctl-right', game),
      toast: $('.game-toast', game),
      start: $('.game-start', game),
      dialog: $('.game-dialog', game),
      dialogName: $('.game-dialog-name', game),
      dialogText: $('.game-dialog-text', game),
      dialogNext: $('#dialog-next', game),
      map: $('.game-map', game),
      mapSvg: $('.game-map svg', game),
      book: $('.game-book', game),
      inv: $('.game-inv', game),
      think: $('.game-think', game),
      final: $('.game-final', game),
      cert: $('.game-cert', game)
    };

    var scene = null;
    var det = { x: 40, facing: 1, moving: 0, target: null, onArrive: null };
    var keys = {};
    var last = 0;
    var nearTarget = null;
    var detNode, worldNode, promptNode;
    var modalOpen = false;

    /* ===== HUD ===== */
    function updateHud() {
      els.hudStars.textContent = '⭐ ' + totalStars();
      els.hudSolved.textContent = '🪨 ' + solvedCount() + '/' + TOTAL_ROCKS;
      els.hudScene.textContent = scene ? scene.name + '・' + scene.place : '台灣地圖';
    }

    var toastTimer;
    function toast(text) {
      els.toast.textContent = text;
      els.toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { els.toast.hidden = true; }, 2600);
    }

    /* ===== 覆蓋層 ===== */
    function openLayer(layer) {
      [els.map, els.book, els.inv, els.think, els.final, els.cert, els.start].forEach(function (l) {
        if (l !== layer) l.hidden = true;
      });
      layer.hidden = false;
      modalOpen = layer !== null;
      keys = {};
      var focusEl = layer.querySelector('button');
      if (focusEl) focusEl.focus({ preventScroll: true });
    }

    function closeLayers() {
      [els.map, els.book, els.inv, els.think, els.final, els.cert, els.start].forEach(function (l) { l.hidden = true; });
      modalOpen = false;
      els.stage.focus({ preventScroll: true });
    }

    /* ===== 對話 ===== */
    var dialogQueue = [];
    var dialogDone = null;
    function say(name, lines, done) {
      dialogQueue = lines.slice();
      dialogDone = done || null;
      els.dialogName.textContent = name;
      els.dialog.hidden = false;
      nextLine();
      els.dialogNext.focus({ preventScroll: true });
    }
    function nextLine() {
      if (!dialogQueue.length) {
        els.dialog.hidden = true;
        var d = dialogDone;
        dialogDone = null;
        if (d) d();
        return;
      }
      els.dialogText.textContent = dialogQueue.shift();
      els.dialogNext.textContent = dialogQueue.length ? '繼續 ▶' : '開始調查！';
    }
    els.dialogNext.addEventListener('click', nextLine);

    /* ===== 地圖 ===== */
    function renderMap() {
      var allDone = solvedCount() === TOTAL_ROCKS;
      var svg = '' +
        '<rect width="320" height="180" fill="#bfe3f5"/>' +
        '<path d="M206 14 Q232 10 240 30 Q246 60 238 92 Q232 124 214 150 Q200 170 188 172 Q176 160 168 132 Q158 100 166 66 Q174 34 206 14 Z" fill="#a7d08c" stroke="#6b9b54" stroke-width="2"/>' +
        '<path d="M214 40 Q208 80 200 120 Q196 140 190 156" stroke="#7f9b6a" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>' +
        '<circle cx="62" cy="118" r="5" fill="#a7d08c" stroke="#6b9b54"/><circle cx="54" cy="128" r="3" fill="#a7d08c" stroke="#6b9b54"/><circle cx="70" cy="128" r="3.5" fill="#a7d08c" stroke="#6b9b54"/>' +
        '<text x="300" y="168" text-anchor="end" font-size="8" fill="#3b6b8f">太平洋</text><text x="100" y="40" font-size="8" fill="#3b6b8f">台灣海峽</text>';
      els.mapSvg.innerHTML = svg;

      var pins = $('.map-pins', els.map);
      pins.innerHTML = '';
      SCENES.forEach(function (sc) {
        var done = sc.rocks.filter(function (r) { return state.solved[r.id]; }).length;
        var b = el('button', 'map-pin' + (sceneSolved(sc) ? ' done' : ''));
        b.type = 'button';
        b.style.left = (sc.pin[0] / 320 * 100) + '%';
        b.style.top = (sc.pin[1] / 180 * 100) + '%';
        b.innerHTML = '<span class="pin-dot"></span><span class="pin-label"><strong></strong><small></small></span>';
        b.querySelector('strong').textContent = sc.name;
        b.querySelector('small').textContent = sc.place + '・' + done + '/' + sc.rocks.length + (state.thinkDone[sc.id] ? ' 💡' : '');
        b.addEventListener('click', function () { enterScene(sc); });
        pins.appendChild(b);
      });

      var fin = el('button', 'map-pin final' + (allDone ? '' : ' locked') + (state.final ? ' done' : ''));
      fin.type = 'button';
      fin.style.left = (200 / 320 * 100) + '%';
      fin.style.top = (118 / 180 * 100) + '%';
      fin.innerHTML = '<span class="pin-dot"></span><span class="pin-label"><strong>最終案件</strong><small></small></span>';
      fin.querySelector('small').textContent = allDone ? (state.final ? stars(state.final) : '時空旅程') : '🔒 破解全部 ' + TOTAL_ROCKS + ' 塊標本後開啟';
      fin.disabled = !allDone;
      fin.addEventListener('click', openFinal);
      pins.appendChild(fin);

      $('#map-progress', els.map).textContent = '已破解 ' + solvedCount() + ' / ' + TOTAL_ROCKS + ' 塊標本・⭐ ' + totalStars() + ' / ' + MAX_STARS;
    }

    function openMap() {
      els.toast.hidden = true;
      scene = null;
      updateHud();
      renderMap();
      openLayer(els.map);
    }

    /* ===== 進入場景 ===== */
    function enterScene(sc) {
      els.toast.hidden = true;
      scene = sc;
      det.x = 40;
      det.facing = 1;
      det.target = null;
      det.onArrive = null;
      closeLayers();
      renderScene();
      updateHud();
      if (!state.introSeen[sc.id]) {
        state.introSeen[sc.id] = true;
        save();
        say('🧓 地質學家阿岩博士', sc.intro);
      }
    }

    function renderScene() {
      Art.setId(0);
      var w = scene.width;
      var parts = '<g class="world">' + sceneArt(scene);

      scene.rocks.forEach(function (r, i) {
        var R = ROCKS[r.id];
        var hiddenNow = r.hidden && !state.revealed[r.id];
        var solved = state.solved[r.id];
        parts += '<g class="specimen' + (solved ? ' solved' : '') + (hiddenNow ? ' is-hidden' : '') + '" data-rock="' + r.id + '" data-x="' + r.x + '">' +
          '<ellipse cx="' + r.x + '" cy="' + (GROUND + 1) + '" rx="16" ry="3" fill="#00000033"/>' +
          rock(R.tex, r.x, GROUND - 9, 30, 19, R.seed) +
          (solved
            ? '<g class="flag"><path d="M' + (r.x + 10) + ' ' + (GROUND - 18) + ' V' + (GROUND - 38) + '" stroke="#555" stroke-width="1.2"/><path d="M' + (r.x + 10) + ' ' + (GROUND - 38) + ' h14 l-3 4 l3 4 h-14 z" fill="' + FAMILIES[R.family].color + '"/></g>'
            : '<g class="glint">' + sparkle(r.x + 8, GROUND - 16, 3, i * 0.7) + '</g>') +
          '</g>';
        if (r.hidden && !state.revealed[r.id]) parts += cover(r.hidden, r.x);
      });

      if (sceneSolved(scene)) {
        parts += '<g class="npc" data-x="' + scene.npcX + '" transform="translate(' + scene.npcX + ' ' + GROUND + ')">' + npcSVG() +
          (state.thinkDone[scene.id] ? '' : '<g class="npc-mark"><circle cx="0" cy="-64" r="6" fill="#facc15"/><text x="0" y="-60.5" text-anchor="middle" font-size="9" font-weight="900">!</text></g>') + '</g>';
      }

      parts += '<g class="det" transform="translate(' + det.x + ' ' + GROUND + ')">' + detectiveSVG() + '</g>';
      parts += '<g class="prompt" hidden><rect x="-30" y="-14" width="60" height="16" rx="8" fill="#1e3a8a"/><text x="0" y="-3" text-anchor="middle" font-size="8.5" font-weight="700" fill="#fff"></text></g>';
      parts += '</g>';

      setView();
      els.svg.innerHTML = parts;
      worldNode = $('.world', els.svg);
      detNode = $('.det', els.svg);
      promptNode = $('.prompt', els.svg);
      els.svg.setAttribute('aria-label', scene.name + '（' + scene.place + '）。用左右鍵或下方按鈕移動，靠近岩石按空白鍵調查。');
      updateCamera();
      findNear();
    }

    /* ===== 移動與鏡頭 ===== */
    // 窄螢幕把鏡頭拉近（維持 16:9），角色和石頭比較大、比較好點
    function setView() {
      var narrow = els.stage.clientWidth < 560;
      VIEW_W = narrow ? 228 : 320;
      VIEW_H = narrow ? 128 : 180;
      VIEW_Y = narrow ? 52 : 0;
      els.svg.setAttribute('viewBox', '0 ' + VIEW_Y + ' ' + VIEW_W + ' ' + VIEW_H);
    }

    window.addEventListener('resize', function () {
      if (!scene || !worldNode) return;
      setView();
      updateCamera();
    });

    function camX() {
      return Math.max(0, Math.min(det.x - VIEW_W / 2, scene.width - VIEW_W));
    }

    function updateCamera() {
      if (!worldNode) return;
      worldNode.setAttribute('transform', 'translate(' + (-camX()) + ' 0)');
      detNode.setAttribute('transform', 'translate(' + det.x + ' ' + GROUND + ') scale(' + det.facing + ' 1)');
    }

    function targets() {
      var list = [];
      scene.rocks.forEach(function (r) {
        if (r.hidden && !state.revealed[r.id]) {
          list.push({ kind: 'search', x: r.x, rock: r, label: '🌿 搜查' });
        } else {
          list.push({ kind: 'rock', x: r.x, rock: r, label: state.solved[r.id] ? '📒 已破案' : '🔍 調查' });
        }
      });
      if (sceneSolved(scene)) list.push({ kind: 'npc', x: scene.npcX, label: state.thinkDone[scene.id] ? '💬 聊聊' : '💬 談話' });
      return list;
    }

    function findNear() {
      var best = null;
      targets().forEach(function (t) {
        var d = Math.abs(t.x - det.x);
        if (d <= NEAR && (!best || d < Math.abs(best.x - det.x))) best = t;
      });
      nearTarget = best;
      if (best) {
        promptNode.hidden = false;
        promptNode.setAttribute('transform', 'translate(' + best.x + ' ' + (best.kind === 'npc' ? GROUND - 72 : GROUND - 60) + ')');
        promptNode.querySelector('text').textContent = best.label;
        els.action.disabled = false;
        els.action.textContent = best.label;
      } else {
        promptNode.hidden = true;
        els.action.disabled = true;
        els.action.textContent = '靠近石頭';
      }
    }

    function loop(t) {
      var dt = Math.min(0.05, (t - last) / 1000 || 0);
      last = t;
      if (scene && !modalOpen && els.dialog.hidden) {
        var dir = 0;
        if (keys.left) dir -= 1;
        if (keys.right) dir += 1;
        if (dir) det.target = null;
        if (!dir && det.target != null) {
          var diff = det.target - det.x;
          if (Math.abs(diff) < 2) {
            det.target = null;
            var cb = det.onArrive;
            det.onArrive = null;
            if (cb) cb();
          } else {
            dir = diff > 0 ? 1 : -1;
          }
        }
        if (dir) {
          det.facing = dir;
          det.x = Math.max(12, Math.min(scene.width - 12, det.x + dir * SPEED * dt));
          detNode.classList.add('walking');
          updateCamera();
          findNear();
        } else {
          detNode.classList.remove('walking');
        }
      }
      requestAnimationFrame(loop);
    }

    /* ===== 互動 ===== */
    function interact(t) {
      t = t || nearTarget;
      if (!t || modalOpen) return;
      if (t.kind === 'search') {
        state.revealed[t.rock.id] = true;
        save();
        var c = $('.cover[data-x="' + t.rock.x + '"]', els.svg);
        if (c) c.classList.add('moved');
        var s = $('.specimen[data-rock="' + t.rock.id + '"]', els.svg);
        if (s) s.classList.remove('is-hidden');
        toast('🔎 發現了一塊可疑的石頭！');
        setTimeout(findNear, 50);
      } else if (t.kind === 'rock') {
        openInvestigation(t.rock.id, scene);
      } else if (t.kind === 'npc') {
        openThink();
      }
    }

    els.action.addEventListener('click', function () { interact(); });

    function bindHold(btn, key) {
      function on(e) { e.preventDefault(); keys[key] = true; }
      function off() { keys[key] = false; }
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointerleave', off);
      btn.addEventListener('pointercancel', off);
    }
    bindHold(els.left, 'left');
    bindHold(els.right, 'right');

    // 點畫面走過去；點到岩石就走過去並調查
    els.svg.addEventListener('click', function (e) {
      if (!scene || modalOpen || !els.dialog.hidden) return;
      var pt = els.svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      var p = pt.matrixTransform(els.svg.getScreenCTM().inverse());
      var wx = p.x + camX();
      var hit = null;
      targets().forEach(function (t) {
        if (Math.abs(t.x - wx) < 18 && p.y > 90) hit = t;
      });
      det.target = Math.max(12, Math.min(scene.width - 12, hit ? hit.x - 10 * Math.sign(hit.x - det.x || 1) : wx));
      det.onArrive = hit ? function () { findNear(); interact(hit); } : null;
    });

    document.addEventListener('keydown', function (e) {
      if (!game.contains(document.activeElement) && document.activeElement !== document.body) return;
      if (!els.dialog.hidden && (e.key === 'Enter' || e.key === ' ')) {
        if (document.activeElement !== els.dialogNext) { e.preventDefault(); nextLine(); }
        return;
      }
      if (modalOpen) {
        if (e.key === 'Escape') { if (scene) closeLayers(); }
        return;
      }
      if (!scene) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = true; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = true; e.preventDefault(); }
      if ((e.key === ' ' || e.key === 'Enter') && document.activeElement === els.stage) { e.preventDefault(); interact(); }
    });
    document.addEventListener('keyup', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    });

    /* ===== 調查 ===== */
    var inv = null;

    function openInvestigation(id, sc, fromBook) {
      var R = ROCKS[id];
      var prev = state.solved[id];
      inv = { id: id, R: R, scene: sc, fromBook: !!fromBook, used: [], family: null, name: null, key: null, wrong: 0, done: !!prev };

      var box = els.inv;
      var num = Object.keys(ROCKS).indexOf(id) + 1;
      $('.inv-title', box).textContent = prev ? '📒 已破案：' + R.name : '證物 #' + num + '：神祕的石頭';
      $('.inv-sub', box).textContent = '發現地點：' + sc.name + '（' + sc.place + '）';

      drawSpecimen();
      renderTools();
      renderEvidence();
      renderDeduce();
      $('.inv-result', box).hidden = true;
      $('.inv-feedback', box).hidden = true;

      if (prev) {
        // 已破案：直接顯示所有證據與結論，方便複習
        inv.used = TOOLS.map(function (t) { return t.id; });
        renderTools();
        renderEvidence();
        $('.inv-deduce', box).hidden = true;
        showResult(prev.stars, true);
      } else {
        $('.inv-deduce', box).hidden = false;
      }
      openLayer(box);
    }

    function drawSpecimen(tool) {
      var R = inv.R;
      Art.setId(500);
      var svg = $('.inv-specimen svg', els.inv);
      var cx = 120, cy = 78, w = 170, h = 104;
      var out = '<rect width="320" height="150" fill="#f3efe6"/><rect y="118" width="320" height="32" fill="#e3dccd"/>' +
        '<ellipse cx="' + cx + '" cy="' + (cy + h / 2 - 2) + '" rx="' + (w / 2) + '" ry="6" fill="#00000022"/>' +
        '<g class="spec-main">' + rock(R.tex, cx, cy, w, h, R.seed) + '</g>';

      if (tool === 'lens') {
        Art.setId(700);
        out += '<defs><clipPath id="lens-clip"><circle cx="245" cy="62" r="46"/></clipPath></defs>' +
          '<g class="anim-lens"><g clip-path="url(#lens-clip)"><rect x="199" y="16" width="92" height="92" fill="#f3efe6"/>' +
          '<g style="transform-box:view-box;transform-origin:0 0" transform="translate(245 62) scale(3.2) translate(' + (-cx - 12) + ' ' + (-cy + 4) + ')">' + rock(R.tex, cx, cy, w, h, R.seed) + '</g></g>' +
          '<circle cx="245" cy="62" r="46" fill="none" stroke="#5b4636" stroke-width="6"/><path d="M212 96 L190 124" stroke="#5b4636" stroke-width="9" stroke-linecap="round"/>' +
          '<path d="M' + (cx + 12) + ' ' + (cy - 4) + ' L203 70" stroke="#5b4636" stroke-width="1" stroke-dasharray="3 3"/></g>';
      } else if (tool === 'light') {
        out += '<defs><linearGradient id="beam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff7b0" stop-opacity=".85"/><stop offset="1" stop-color="#fff7b0" stop-opacity="0"/></linearGradient></defs>' +
          '<g class="anim-light"><path d="M8 8 L60 0 L' + (cx + 80) + ' ' + (cy + 40) + ' L' + (cx - 60) + ' ' + (cy + 50) + ' Z" fill="url(#beam)"/>' +
          '<rect x="0" y="0" width="34" height="18" rx="4" fill="#374151" transform="rotate(25 17 9)"/></g>';
        if (R.shiny) {
          for (var i = 0; i < 9; i++) out += sparkle(cx - 60 + ((i * 47) % 120), cy - 35 + ((i * 29) % 70), 4, i * 0.25);
        }
      } else if (tool === 'acid') {
        out += '<g class="anim-acid"><rect x="' + (cx - 6) + '" y="0" width="12" height="22" rx="3" fill="#e5e7eb" stroke="#9ca3af"/>' +
          '<path d="M' + (cx - 3) + ' 22 L' + cx + ' 32 L' + (cx + 3) + ' 22 Z" fill="#9ca3af"/>' +
          '<ellipse class="drop" cx="' + cx + '" cy="36" rx="3" ry="4" fill="#93c5fd"/></g>' +
          '<ellipse cx="' + cx + '" cy="' + (cy - 20) + '" rx="16" ry="6" fill="#93c5fd" opacity=".55" class="wet"/>';
        var n = R.fizz === 'strong' ? 18 : R.fizz === 'weak' ? 5 : 0;
        for (var b = 0; b < n; b++) {
          out += '<circle class="bubble" style="animation-delay:' + (0.9 + (b % 6) * 0.25) + 's" cx="' + (cx - 14 + (b * 7) % 28) + '" cy="' + (cy - 20) + '" r="' + (1.4 + (b % 3)) + '" fill="#fff" stroke="#93c5fd"/>';
        }
      } else if (tool === 'water') {
        var top = R.floats;
        out = '<rect width="320" height="150" fill="#f3efe6"/><rect y="118" width="320" height="32" fill="#e3dccd"/>' +
          '<g class="spec-main" opacity=".35">' + rock(R.tex, cx, cy, w, h, R.seed) + '</g>' +
          '<rect x="200" y="20" width="90" height="110" rx="6" fill="#ffffff55" stroke="#94a3b8" stroke-width="3"/>' +
          '<rect x="203" y="48" width="84" height="79" fill="#7dd3fc" opacity=".55"/>' +
          '<path class="wave" d="M203 48 q7 -3 14 0 t14 0 t14 0 t14 0 t14 0 t14 0" stroke="#e0f2fe" stroke-width="1.5" fill="none"/>';
        Art.setId(800);
        out += '<g class="' + (top ? 'anim-float' : 'anim-sink') + '">' + rock(R.tex, 245, 0, 40, 26, R.seed) + '</g>';
        if (R.absorbs) {
          for (var q = 0; q < 8; q++) {
            out += '<circle class="bubble" style="animation-delay:' + (1 + q * 0.3) + 's" cx="' + (232 + (q * 5) % 26) + '" cy="112" r="1.6" fill="#fff"/>';
          }
        }
      }
      svg.innerHTML = out;
    }

    function renderTools() {
      var wrap = $('.inv-tools', els.inv);
      wrap.innerHTML = '';
      TOOLS.forEach(function (t) {
        var b = el('button', 'tool-btn');
        b.type = 'button';
        var used = inv.used.indexOf(t.id) >= 0;
        if (used) b.classList.add('used');
        b.innerHTML = '<span class="tool-icon"></span><span class="tool-name"></span><small></small>';
        b.querySelector('.tool-icon').textContent = t.icon;
        b.querySelector('.tool-name').textContent = t.name;
        b.querySelector('small').textContent = used ? '已使用' : t.desc;
        b.addEventListener('click', function () { useTool(t.id); });
        wrap.appendChild(b);
      });
      var n = inv.used.length;
      $('.inv-toolcount', els.inv).textContent = inv.done ? '' :
        '已使用 ' + n + ' 種工具' + (n <= EFFICIENT_TOOLS ? '（' + EFFICIENT_TOOLS + ' 種以內破案可得效率星 ⭐）' : '（超過 ' + EFFICIENT_TOOLS + ' 種，拿不到效率星了）');
    }

    function useTool(id) {
      if (inv.used.indexOf(id) < 0) {
        inv.used.push(id);
        renderTools();
        renderEvidence(id);
        renderDeduce();
      }
      drawSpecimen(id);
    }

    function renderEvidence(fresh) {
      var list = $('.inv-evidence', els.inv);
      list.innerHTML = '';
      if (!inv.used.length) {
        list.appendChild(el('li', 'ev-empty', '還沒有證據。先想想：哪一種工具最能幫你分辨？'));
        return;
      }
      inv.used.forEach(function (tid) {
        var t = TOOLS.filter(function (x) { return x.id === tid; })[0];
        var li = el('li', 'ev-card' + (fresh === tid ? ' fresh' : ''));
        li.appendChild(el('span', 'ev-tool', t.icon + ' ' + t.name));
        li.appendChild(el('span', 'ev-text', inv.R.ev[tid]));
        if (!inv.done) {
          var pick = el('button', 'ev-pick', inv.key === tid ? '★ 關鍵證據' : '設為關鍵證據');
          pick.type = 'button';
          pick.setAttribute('aria-pressed', String(inv.key === tid));
          pick.addEventListener('click', function () {
            inv.key = tid;
            renderEvidence();
            renderDeduce();
          });
          li.appendChild(pick);
        }
        list.appendChild(li);
      });
    }

    function renderDeduce() {
      var box = $('.inv-deduce', els.inv);
      var fam = $('.deduce-family', box);
      var nm = $('.deduce-name', box);
      fam.innerHTML = '';
      nm.innerHTML = '';
      FAMILY_ORDER.forEach(function (f) {
        var b = el('button', 'choice-chip', FAMILIES[f].name);
        b.type = 'button';
        b.style.setProperty('--c', FAMILIES[f].color);
        b.setAttribute('aria-pressed', String(inv.family === f));
        b.addEventListener('click', function () { inv.family = f; renderDeduce(); });
        fam.appendChild(b);
      });
      if (!inv.nameOrder) inv.nameOrder = shuffle(inv.R.options);
      inv.nameOrder.forEach(function (n) {
        var b = el('button', 'choice-chip', n);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(inv.name === n));
        b.addEventListener('click', function () { inv.name = n; renderDeduce(); });
        nm.appendChild(b);
      });
      var keyLabel = $('.deduce-key', box);
      if (inv.key) {
        var t = TOOLS.filter(function (x) { return x.id === inv.key; })[0];
        keyLabel.textContent = t.icon + ' ' + t.name + '：' + inv.R.ev[inv.key];
        keyLabel.classList.remove('missing');
      } else {
        keyLabel.textContent = inv.used.length ? '在上面的證據卡按「設為關鍵證據」' : '先用工具蒐集證據';
        keyLabel.classList.add('missing');
      }
      var submit = $('#inv-submit', box);
      submit.disabled = !(inv.family && inv.name && inv.key);
    }

    $('#inv-submit', els.inv).addEventListener('click', function () {
      var R = inv.R;
      var fb = $('.inv-feedback', els.inv);
      var msg = null;
      if (inv.family !== R.family) {
        msg = '❌ 家族不對。重新看看證據的線索：' + FAMILIES[R.family].hint;
      } else if (inv.name !== R.name) {
        msg = '❌ 家族對了，但名稱不對。' + R.nameHint;
      } else if (R.key.indexOf(inv.key) < 0) {
        msg = '🤔 結論正確！但「' + TOOLS.filter(function (x) { return x.id === inv.key; })[0].name + '」的證據，其他選項的岩石也可能有，不能證明就是它。換一個更有說服力的證據！';
      }
      if (msg) {
        inv.wrong++;
        fb.textContent = msg;
        fb.hidden = false;
        fb.classList.remove('shake');
        void fb.offsetWidth;
        fb.classList.add('shake');
        return;
      }
      fb.hidden = true;
      var s = 3;
      if (inv.wrong > 0) s--;
      if (inv.used.length > EFFICIENT_TOOLS) s--;
      s = Math.max(1, s);
      state.solved[inv.id] = { stars: s, tools: inv.used.length };
      save();
      inv.done = true;
      $('.inv-deduce', els.inv).hidden = true;
      renderEvidence();
      renderTools();
      showResult(s, false);
      updateHud();
    });

    function showResult(s, review) {
      var R = inv.R;
      var res = $('.inv-result', els.inv);
      res.hidden = false;
      res.style.setProperty('--c', FAMILIES[R.family].color);
      $('.res-stars', res).textContent = stars(s);
      $('.res-name', res).textContent = R.name;
      $('.res-family', res).textContent = FAMILIES[R.family].name;
      $('.res-explain', res).textContent = R.explain;
      var notes = [];
      if (!review) {
        notes.push(inv.wrong ? '有修正推理（-1 ⭐）' : '一次就推理成功 ⭐');
        notes.push(inv.used.length <= EFFICIENT_TOOLS ? '只用 ' + inv.used.length + ' 種工具，效率滿分 ⭐' : '用了 ' + inv.used.length + ' 種工具（-1 ⭐）');
      }
      $('.res-notes', res).textContent = notes.join('・');
      $('#inv-close', els.inv).textContent = review ? '關閉' : '收進案件簿 📒';
    }

    $('#inv-close', els.inv).addEventListener('click', function () {
      if (inv.fromBook) { openBook(); return; }
      var finishedNow = inv.scene && sceneSolved(inv.scene) && !state.thinkDone[inv.scene.id];
      closeLayers();
      renderScene();
      if (finishedNow) {
        toast('🎉 這一區的標本全部破案！阿岩博士有話要說。');
      }
      if (solvedCount() === TOTAL_ROCKS && !state.final) {
        setTimeout(function () { toast('🗺️ 全部標本破案！回地圖挑戰最終案件。'); }, 2800);
      }
    });

    /* ===== 博士的思考題 ===== */
    function openThink() {
      var T = scene.think;
      var box = els.think;
      $('.think-q', box).textContent = T.q;
      var opts = $('.think-options', box);
      opts.innerHTML = '';
      var fb = $('.think-feedback', box);
      fb.hidden = true;
      var answered = !!state.thinkDone[scene.id];
      var tries = 0;
      shuffle(T.options.map(function (o, i) { return { o: o, i: i }; })).forEach(function (item) {
        var b = el('button', 'think-option', item.o);
        b.type = 'button';
        if (answered && item.i === T.answer) b.classList.add('is-correct');
        b.disabled = answered;
        b.addEventListener('click', function () {
          tries++;
          if (item.i === T.answer) {
            b.classList.add('is-correct');
            Array.prototype.forEach.call(opts.children, function (x) { x.disabled = true; });
            var first = tries === 1;
            state.think[scene.id] = first;
            state.thinkDone[scene.id] = true;
            save();
            fb.textContent = (first ? '💡 正確！獲得博士的智慧星 ⭐　' : '💡 答對了！（第一次就答對才有智慧星）　') + T.explain;
            fb.hidden = false;
            updateHud();
          } else {
            b.classList.add('is-wrong');
            b.disabled = true;
          }
        });
        opts.appendChild(b);
      });
      if (answered) {
        fb.textContent = '💡 ' + T.explain;
        fb.hidden = false;
      }
      openLayer(box);
    }

    $('#think-close', els.think).addEventListener('click', function () {
      closeLayers();
      renderScene();
    });

    /* ===== 案件簿 ===== */
    function openBook() {
      var grid = $('.book-grid', els.book);
      grid.innerHTML = '';
      Art.setId(900);
      FAMILY_ORDER.forEach(function (f) {
        var ids = Object.keys(ROCKS).filter(function (k) { return ROCKS[k].family === f; });
        var col = el('section', 'book-family');
        col.style.setProperty('--c', FAMILIES[f].color);
        var solvedHere = ids.filter(function (k) { return state.solved[k]; }).length;
        col.appendChild(el('h4', null, FAMILIES[f].name + '　' + solvedHere + '/' + ids.length));
        ids.forEach(function (k) {
          var R = ROCKS[k];
          var s = state.solved[k];
          var card = el('button', 'book-card' + (s ? '' : ' unknown'));
          card.type = 'button';
          card.disabled = !s;
          card.innerHTML = '<svg viewBox="0 0 60 36" aria-hidden="true">' + (s ? rock(R.tex, 30, 18, 52, 30, R.seed) : '<text x="30" y="24" text-anchor="middle" font-size="18" fill="#9ca3af">？</text>') + '</svg><span class="book-name"></span><span class="book-stars"></span>';
          card.querySelector('.book-name').textContent = s ? R.name : '尚未破案';
          card.querySelector('.book-stars').textContent = s ? stars(s.stars) : '';
          card.addEventListener('click', function () {
            var sc = SCENES.filter(function (x) { return x.rocks.some(function (r) { return r.id === k; }); })[0];
            openInvestigation(k, sc, true);
          });
          col.appendChild(card);
        });
        grid.appendChild(col);
      });
      $('#book-summary', els.book).textContent = '已破解 ' + solvedCount() + ' / ' + TOTAL_ROCKS + ' 塊標本・⭐ ' + totalStars() + ' / ' + MAX_STARS;
      openLayer(els.book);
    }

    /* ===== 最終案件 ===== */
    function openFinal() {
      var box = els.final;
      var order = [];
      var mistakes = 0;
      $('.final-intro', box).textContent = FINAL.intro;
      var slots = $('.final-slots', box);
      var pool = $('.final-pool', box);
      var fb = $('.final-feedback', box);
      fb.hidden = true;
      $('#final-done', box).hidden = true;

      function render() {
        slots.innerHTML = '';
        for (var i = 0; i < FINAL.cards.length; i++) {
          var li = el('li', 'final-slot' + (order[i] != null ? ' filled' : ''));
          li.appendChild(el('span', 'slot-num', String(i + 1)));
          li.appendChild(el('span', 'slot-text', order[i] != null ? FINAL.cards[order[i]] : '？'));
          if (order[i] != null && FINAL.families[i]) li.appendChild(el('span', 'slot-tag', FINAL.families[i]));
          slots.appendChild(li);
        }
      }

      pool.innerHTML = '';
      shuffle(FINAL.cards.map(function (c, i) { return i; })).forEach(function (ci) {
        var b = el('button', 'final-card', FINAL.cards[ci]);
        b.type = 'button';
        b.addEventListener('click', function () {
          if (ci === order.length) {
            order.push(ci);
            b.disabled = true;
            b.classList.add('placed');
            render();
            if (order.length === FINAL.cards.length) {
              var s = mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1;
              state.final = Math.max(state.final || 0, s);
              save();
              updateHud();
              fb.textContent = '🎉 時空旅程完成！' + stars(s) + '　' + FINAL.explain;
              fb.className = 'final-feedback ok';
              fb.hidden = false;
              $('#final-done', box).hidden = false;
            }
          } else {
            mistakes++;
            b.classList.remove('shake');
            void b.offsetWidth;
            b.classList.add('shake');
            fb.textContent = '時間順序不對喔。想一想：第 ' + (order.length + 1) + ' 步之前，砂粒必須先經歷什麼？';
            fb.className = 'final-feedback bad';
            fb.hidden = false;
          }
        });
        pool.appendChild(b);
      });
      render();
      openLayer(box);
    }

    $('#final-done', els.final).addEventListener('click', openCert);

    function openCert() {
      var total = totalStars();
      var title = total >= MAX_STARS - 5 ? '岩石神探' : total >= MAX_STARS * 0.65 ? '資深岩石偵探' : '見習岩石偵探';
      $('.cert-title', els.cert).textContent = title;
      $('.cert-stars', els.cert).textContent = '⭐ ' + total + ' / ' + MAX_STARS;
      var counts = FAMILY_ORDER.map(function (f) {
        var ids = Object.keys(ROCKS).filter(function (k) { return ROCKS[k].family === f; });
        return FAMILIES[f].name + ' ' + ids.length + ' 塊';
      });
      $('.cert-detail', els.cert).textContent = '你用證據破解了 ' + TOTAL_ROCKS + ' 塊標本（' + counts.join('、') + '），還排出了岩石循環的時空旅程。';
      openLayer(els.cert);
    }

    /* ===== 按鈕 ===== */
    $('#hud-map', game).addEventListener('click', openMap);
    $('#hud-book', game).addEventListener('click', openBook);
    $('#map-book', game).addEventListener('click', openBook);
    Array.prototype.forEach.call(game.querySelectorAll('[data-close]'), function (b) {
      b.addEventListener('click', function () {
        if (scene) closeLayers(); else openMap();
      });
    });
    $('#cert-map', game).addEventListener('click', openMap);
    $('#game-start-btn', game).addEventListener('click', function () {
      els.start.hidden = true;
      if (solvedCount() > 0) { openMap(); return; }
      say('🧓 地質學家阿岩博士', [
        '偵探，你來得正好！我的標本箱翻倒了，' + TOTAL_ROCKS + ' 塊岩石標本的標籤全部弄丟了。',
        '這些標本來自台灣四個地方。請你到現場調查，用工具蒐集證據，替每塊岩石找回名字。',
        '記住：好偵探不靠猜！工具用得越少、推理越精準，得到的星星越多。'
      ], openMap);
    });
    $('#game-reset', game).addEventListener('click', function () {
      var btn = this;
      if (btn.dataset.confirm !== '1') {
        btn.dataset.confirm = '1';
        btn.textContent = '確定要清除所有進度？再按一次';
        setTimeout(function () { btn.dataset.confirm = ''; btn.textContent = '重新開始'; }, 4000);
        return;
      }
      state = blank();
      save();
      btn.dataset.confirm = '';
      btn.textContent = '重新開始';
      renderMap();
      updateHud();
      $('#game-start-btn', game).textContent = '▶ 開始調查';
      toast('已清除進度，從頭開始調查！');
    });

    var fullBtn = $('#hud-full', game);
    if (!(game.requestFullscreen || game.webkitRequestFullscreen)) {
      fullBtn.hidden = true;
    } else {
      fullBtn.addEventListener('click', function () {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
          var p = (game.requestFullscreen || game.webkitRequestFullscreen).call(game);
          if (p && p.catch) p.catch(function () {});
        }
      });
    }

    // 開始畫面：有進度就顯示「繼續」
    if (solvedCount() > 0) {
      $('#game-start-btn', game).textContent = '▶ 繼續調查（已破解 ' + solvedCount() + ' 塊）';
    }

    updateHud();
    renderMap();
    openLayer(els.start);
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }
})();
