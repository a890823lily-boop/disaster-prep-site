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
  var HEARTS = 3;            // 每區的偵探信譽值
  var ACID_DROPS = 3;        // 每區的稀鹽酸滴數

  // 每區的工具補給：每塊標本 2 次，再多 2 次備用
  function toolBudget(sc) { return sc.rocks.length * 2 + 2; }

  /* ---------- 岩石家族 ---------- */

  var FAMILIES = {
    igneous: { name: '火成岩', color: '#d9480f', hint: '看得到交錯的晶體或氣孔、不分層、不會冒泡，通常和岩漿冷卻有關。' },
    sedimentary: { name: '沉積岩', color: '#a16207', hint: '有分層、顆粒是砂或礫石、或含有化石，通常是一層層堆積形成的。' },
    metamorphic: { name: '變質岩', color: '#7c3aed', hint: '有條紋、片狀，或晶體閃亮又排成同一方向，代表受過高溫高壓。' },
    artificial: { name: '人造石材', color: '#475569', hint: '注意有沒有水泥、筆直的人工線條，以及大小太過平均的石粒。' },
    weathering: { name: '風化', color: '#b45309', hint: '先確認水流或海浪有沒有直接作用。水碰不到的地方，可能是溫差、鹽結晶或生物造成的風化。' },
    erosion: { name: '侵蝕', color: '#b91c1c', hint: '水流或海浪很強、地形被挖深、河岸或崖壁後退，都是侵蝕的證據。' },
    deposition: { name: '堆積', color: '#a16207', hint: '水流或浪變弱、有泥沙堆積、地形越長越大，都是堆積的證據。' }
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

  /* ---------- 地形案件（溪流探險、岬灣海岸） ---------- */

  var LAND_FAMILY_ORDER = ['weathering', 'erosion', 'deposition'];

  var LAND_TOOLS = [
    { id: 'scope', icon: '🔭', name: '望遠鏡', desc: '觀察整體形狀' },
    { id: 'float', icon: '🎈', name: '放浮標', desc: '測水流或浪的強弱' },
    { id: 'sieve', icon: '🧺', name: '採樣篩', desc: '看堆積物大小、圓度' },
    { id: 'photo', icon: '📷', name: '老照片', desc: '比較過去和現在' }
  ];

  function toolsFor(R) { return R.kind === 'land' ? LAND_TOOLS : TOOLS; }
  function toolById(id) { return TOOLS.concat(LAND_TOOLS).filter(function (t) { return t.id === id; })[0]; }

  // 地形插圖（320×150），past=true 時畫出老照片中的樣子
  var LANDVIEW = {
    vvalley: function (past) {
      var b = past ? 112 : 128;
      return '<rect width="320" height="150" fill="#cfe8f7"/>' +
        '<path d="M0 18 L146 ' + b + ' L174 ' + b + ' L320 18 V150 H0 Z" fill="#7d8a6a"/>' +
        '<path d="M60 70 L90 64 M230 64 L262 72 M40 40 L70 50" stroke="#5f6b4f" stroke-width="2"/>' +
        '<path d="M146 ' + b + ' Q160 ' + (b + 10) + ' 174 ' + b + '" stroke="#4b9bcc" stroke-width="6" fill="none"/>' +
        '<path d="M140 ' + (b + 6) + ' l8 -8 l9 4 l-2 8 z M170 ' + (b + 8) + ' l6 -9 l8 6 l-4 6 z" fill="#8a7a6a" stroke="#4b3f33"/>';
    },
    exfol: function (past) {
      return '<rect width="320" height="150" fill="#fdf6e3"/><rect y="112" width="320" height="38" fill="#c8a97e"/>' +
        '<path d="M250 150 Q270 136 320 134 V150 Z" fill="#4b9bcc"/>' +
        '<ellipse cx="140" cy="84" rx="78" ry="40" fill="#b9a27f"/>' +
        '<path d="M70 82 Q140 30 210 82 M84 84 Q140 46 196 84" stroke="#8a7458" stroke-width="2" fill="none"/>' +
        (past ? '' : '<path d="M66 80 Q140 34 214 80 L208 70 Q140 26 72 70 Z" fill="#d6c3a2" stroke="#7a6248" transform="translate(6 -6) rotate(-4 140 60)"/>' +
          '<path d="M60 118 q10 -6 20 0 M206 120 q8 -6 18 0 M100 122 q8 -5 16 0" stroke="#8a7458" stroke-width="3" fill="none"/>');
    },
    fan: function (past) {
      var r = past ? 70 : 100;
      return '<rect width="320" height="150" fill="#cfe8f7"/><path d="M0 50 L80 10 L130 40 L190 6 L320 40 V150 H0 Z" fill="#a9d18e"/>' +
        '<path d="M110 20 L130 40 L150 22" fill="#7d8a6a"/>' +
        '<path d="M130 40 L' + (130 - r * 0.9) + ' ' + (40 + r) + ' Q130 ' + (40 + r * 1.15) + ' ' + (130 + r * 0.9) + ' ' + (40 + r) + ' Z" fill="#d4b07a"/>' +
        '<path d="M130 40 Q120 80 100 ' + (40 + r) + ' M130 40 Q134 90 130 ' + (40 + r) + ' M130 40 Q150 80 168 ' + (40 + r * 0.95) + '" stroke="#4b9bcc" stroke-width="2.5" fill="none"/>';
    },
    cutbank: function (past) {
      var bulge = past ? 40 : 66;
      return '<rect width="320" height="150" fill="#a9d18e"/>' +
        '<path d="M0 40 Q' + (150 + bulge) + ' 20 ' + (170 + bulge) + ' 75 Q' + (150 + bulge) + ' 130 0 110" stroke="#4b9bcc" stroke-width="24" fill="none"/>' +
        '<path d="M' + (182 + bulge) + ' 40 Q' + (196 + bulge) + ' 75 ' + (182 + bulge) + ' 112" stroke="#7a5233" stroke-width="5" fill="none"/>' +
        '<path d="M' + (186 + bulge) + ' 60 l8 -3 M' + (188 + bulge) + ' 80 l9 1 M' + (186 + bulge) + ' 98 l8 3" stroke="#5b4636" stroke-width="1.5"/>' +
        '<path d="M60 64 Q' + (110 + bulge * 0.5) + ' 66 ' + (110 + bulge * 0.6) + ' 75 Q' + (110 + bulge * 0.5) + ' 84 60 86 Z" fill="#e8d3a0"/>' +
        '<text x="' + (230 + bulge * 0.4) + '" y="20" text-anchor="middle" font-size="10" font-weight="800" fill="#1f2933">↓ 這一側</text>';
    },
    delta: function (past) {
      var s = past ? 0.6 : 1;
      return '<rect width="320" height="150" fill="#4b9bcc"/><path d="M0 0 H130 L110 150 H0 Z" fill="#a9d18e"/>' +
        '<path d="M110 75 L' + (110 + 120 * s) + ' ' + (75 - 60 * s) + ' Q' + (110 + 150 * s) + ' 75 ' + (110 + 120 * s) + ' ' + (75 + 60 * s) + ' Z" fill="#e8d3a0"/>' +
        '<path d="M0 75 H110 M110 75 L' + (110 + 110 * s) + ' ' + (75 - 40 * s) + ' M110 75 L' + (110 + 130 * s) + ' 75 M110 75 L' + (110 + 110 * s) + ' ' + (75 + 40 * s) + '" stroke="#3f8fd0" stroke-width="5" fill="none"/>';
    },
    beach: function () {
      return '<rect width="320" height="150" fill="#4b9bcc"/>' +
        '<path d="M0 150 V40 L50 30 L80 100 Q160 126 240 100 L270 30 L320 40 V150 Z" fill="#a9d18e"/>' +
        '<path d="M80 100 Q160 126 240 100 L236 112 Q160 140 84 112 Z" fill="#e8d6a8"/>' +
        '<path d="M100 96 q12 -4 24 0 t24 0 t24 0 t24 0" stroke="#e0f2fe" stroke-width="2" fill="none"/>' +
        '<path d="M44 34 q8 -6 16 0 M262 34 q8 -6 16 0" stroke="#fff" stroke-width="3" fill="none"/>';
    },
    seastack: function (past) {
      var out = '<rect width="320" height="150" fill="#cfe8f7"/><rect y="118" width="320" height="32" fill="#4b9bcc"/>' +
        '<path d="M0 40 L90 40 L100 118 L0 118 Z" fill="#a98a66"/>';
      if (past) out += '<path d="M90 40 L270 46 L282 118 L96 118 Z" fill="#b08f6a"/><path d="M150 118 Q150 70 184 68 Q218 70 218 118 Z" fill="#cfe8f7"/>';
      else out += '<path d="M90 40 L130 42 L138 118 L96 118 Z" fill="#b08f6a"/><path d="M220 56 L262 58 L272 118 L214 118 Z" fill="#b08f6a"/>' +
        '<path d="M160 118 l10 -8 l12 4 l6 4 z M190 118 l8 -6 l10 6 z" fill="#8f7a5f"/>';
      return out + '<path d="M0 124 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#e0f2fe" stroke-width="2" fill="none"/>';
    },
    tofu: function (past) {
      var gap = past ? 2 : 5, out = '<rect width="320" height="150" fill="#cfe8f7"/><rect y="40" width="320" height="110" fill="#5b6672"/>';
      for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 8; c++) {
          out += '<rect x="' + (10 + c * 38 + gap / 2) + '" y="' + (46 + r * 26 + gap / 2) + '" width="' + (38 - gap) + '" height="' + (26 - gap) + '" fill="#a08b6e" stroke="#7a6a52"/>';
        }
      }
      return out;
    },
    honeycomb: function (past) {
      var out = '<rect width="320" height="150" fill="#cfe8f7"/><rect y="118" width="320" height="32" fill="#c8a97e"/>' +
        '<path d="M50 118 Q40 60 100 40 Q180 24 240 50 Q290 76 270 118 Z" fill="#d4b07a"/>';
      var n = past ? 12 : 30;
      for (var i = 0; i < n; i++) {
        var x = 80 + (i * 53) % 170, y = 56 + (i * 29) % 54, r = past ? 2.5 + (i % 3) : 3.5 + (i % 4) * 1.4;
        out += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + r + '" ry="' + (r * 0.8) + '" fill="#8a6a3f" stroke="#f1dcb4" stroke-width=".8"/>';
      }
      return out;
    }
  };

  var LAND_CASES = {
    vvalley: {
      kind: 'land', name: 'V 形谷', family: 'erosion', icon: '⛰️',
      options: ['V 形谷', '沖積扇', '三角洲'], flow: 'fast', floatPath: [150, 120, 290, 128], grain: 'boulder',
      ev: {
        scope: '兩側山壁又陡又高，河谷又深又窄，像英文字母 V。',
        float: '浮標一下就被沖走了，水流非常湍急。',
        sieve: '幾乎沒有細沙，只有稜角分明的大石頭。',
        photo: '比較 50 年前的照片，河床又往下切深了一些。'
      },
      key: ['scope', 'photo'],
      nameHint: '沖積扇和三角洲都是泥沙堆出來的平緩地形，這裡卻又深又陡。',
      explain: '上游坡陡水急，河水不斷往下侵蝕（下切），切出又深又窄的 V 形谷。細顆粒都被急流沖走，只剩下大石頭。'
    },
    exfol: {
      kind: 'land', name: '洋蔥狀剝落', family: 'weathering', icon: '🧅',
      options: ['洋蔥狀剝落', '海蝕洞', '鵝卵石'], flow: 'none', floatPath: [280, 142, 300, 142], grain: 'flakes',
      ev: {
        scope: '一顆巨大的岩石，表面像洋蔥一樣，一層層翹起、剝落。',
        float: '浮標只能放在遠處的溪水裡。這顆石頭在高處，水根本碰不到它。',
        sieve: '石頭旁邊散落一片片薄薄的岩片，彎曲的形狀和石頭表面一樣。',
        photo: '老照片裡外層還很完整，現在已經剝落了一層。'
      },
      key: ['float', 'scope'],
      nameHint: '海蝕洞是海浪打出來的洞，鵝卵石是被水磨圓的石頭。這顆石頭水碰不到，表面一層層剝落。',
      explain: '這顆石頭碰不到水，所以不是流水侵蝕！白天受熱膨脹、晚上冷卻收縮，表層一層層剝落，是物理風化（課本 2-1）。'
    },
    fan: {
      kind: 'land', name: '沖積扇', family: 'deposition', icon: '🪭',
      options: ['沖積扇', '三角洲', 'V 形谷'], flow: 'slow', floatPath: [130, 50, 120, 120], grain: 'gradient',
      ev: {
        scope: '在山谷的出口，泥沙堆成像打開的扇子一樣的形狀。',
        float: '水流到這裡突然變慢，分成好幾條小溪往外流。',
        sieve: '靠近山谷口是粗礫石，越往外顆粒越細。',
        photo: '老照片裡扇形的範圍比較小，現在越堆越大了。'
      },
      key: ['scope', 'sieve'],
      nameHint: '三角洲在河流出海的地方；這裡是在山谷的出口，而且顆粒比較粗。',
      explain: '河流流出山谷，坡度突然變緩、水流變慢，帶來的泥沙堆成扇形。大顆的先沉在扇頂，細的被帶到扇緣，這叫分選作用。'
    },
    cutbank: {
      kind: 'land', name: '曲流凹岸', family: 'erosion', icon: '↪️',
      options: ['曲流凹岸', '曲流凸岸', '沖積扇'], flow: 'fast', floatPath: [60, 40, 220, 72], grain: 'roots',
      ev: {
        scope: '河道在這裡大轉彎。這一側的河岸又陡又直，像被挖掉了一塊。',
        float: '浮標被沖向這一側的河岸，速度很快。',
        sieve: '岸邊沒有沙子堆積，只看到被沖刷露出來的樹根。',
        photo: '比較老照片，這一側的河岸每年都往外退了好幾公尺。'
      },
      key: ['float', 'photo', 'sieve'],
      nameHint: '凸岸在彎道內側，水流慢、會堆積沙洲；這一側水流快、河岸一直後退。',
      explain: '彎道外側的凹岸水流快，不斷侵蝕河岸，河岸後退、變陡；內側的凸岸水流慢，泥沙堆積成沙洲。'
    },
    delta: {
      kind: 'land', name: '三角洲', family: 'deposition', icon: '🔺',
      options: ['三角洲', '沖積扇', '海蝕平臺'], flow: 'slow', floatPath: [20, 75, 200, 75], grain: 'mud',
      ev: {
        scope: '河流出海的地方，堆出一片三角形的低平陸地，河道分成好幾條。',
        float: '河水流進大海後幾乎停住，水變得很混濁。',
        sieve: '全是很細的泥和沙，摸起來滑滑的。',
        photo: '老照片中的陸地比較小，現在一年一年往海裡延伸。'
      },
      key: ['scope', 'sieve', 'photo'],
      nameHint: '沖積扇在山谷出口、顆粒比較粗；海蝕平臺是岩石被海浪磨平的。這裡在河口，顆粒很細。',
      explain: '河流到了出海口，水流幾乎停止，最細的泥沙沉積下來，形成三角洲。台灣河流泥沙多，但海浪強，泥沙常被推成沙洲。'
    },
    beach: {
      kind: 'land', name: '沙灘', family: 'deposition', icon: '🏖️',
      options: ['沙灘', '海蝕平臺', '豆腐岩'], flow: 'slow', floatPath: [160, 90, 160, 108], grain: 'sand',
      ev: {
        scope: '位在兩個岬角中間的海灣裡，是一大片平緩的沙。',
        float: '海灣裡的浪比較小，浪花輕輕把浮標推上岸。',
        sieve: '細細的沙粒，大小差不多，還有一些貝殼碎片。',
        photo: '老照片裡沙灘的範圍差不多，夏天大一點、冬天小一點。'
      },
      key: ['float', 'scope', 'sieve'],
      nameHint: '海蝕平臺和豆腐岩都是岩石被侵蝕形成的，這裡卻是一大片沙。',
      explain: '硬的岩石凸出成岬角，浪的能量集中打在岬角；海灣裡浪小，沙子堆積成沙灘，形成「岬灣海岸」。'
    },
    seastack: {
      kind: 'land', name: '海蝕柱', family: 'erosion', icon: '🗿',
      options: ['海蝕柱', '海蝕門', '海蝕洞'], flow: 'fast', floatPath: [300, 126, 230, 120], grain: 'blocks',
      ev: {
        scope: '一根孤立的岩柱站在海裡，已經和陸地分開了。',
        float: '浪很大，不斷拍打岩柱的底部。',
        sieve: '岩柱附近的海底有很多大石塊，像是從上方崩落下來的。',
        photo: '100 年前的老照片裡，這裡竟然是一座拱門！'
      },
      key: ['photo', 'scope'],
      nameHint: '海蝕門中間有洞、兩端還連在一起；海蝕洞是崖壁上的洞。這根岩柱已經孤立了。',
      explain: '海浪先挖出海蝕洞，兩側打通成海蝕門，拱頂崩落後剩下孤立的海蝕柱。老照片就是演化順序最好的證據！'
    },
    honeycomb: {
      kind: 'land', name: '蜂窩岩', family: 'weathering', icon: '🐝',
      options: ['蜂窩岩', '豆腐岩', '海蝕洞'], flow: 'none', floatPath: [300, 138, 310, 138], grain: 'salt',
      ev: {
        scope: '岩石表面布滿一個個小圓洞，像蜂窩一樣。',
        float: '這塊岩石在高處，平常浪打不到，只有強風吹來的浪花水沫。',
        sieve: '小洞裡面有亮晶晶的白色鹽結晶。',
        photo: '老照片裡的洞比較小、也比較少。'
      },
      key: ['sieve', 'float'],
      nameHint: '豆腐岩是直線切成的方格；海蝕洞是浪打出來的大洞。這些小洞裡有鹽結晶……',
      explain: '浪花把海水濺到岩石上，水分蒸發後，鹽在小孔裡結晶，把岩石撐碎，洞越來越大，形成蜂窩岩。這是鹽造成的物理風化（課本 2-1）！'
    },
    tofu: {
      kind: 'land', name: '豆腐岩', family: 'erosion', icon: '🧈',
      options: ['豆腐岩', '蜂窩岩', '沙灘'], flow: 'fast', floatPath: [40, 72, 300, 72], grain: 'gravel',
      ev: {
        scope: '海蝕平臺上的岩石，被切成一塊塊方方正正的格子。',
        float: '漲潮時海水灌進格子間的縫隙，退潮時又快速流出來。',
        sieve: '縫隙裡卡著小石子和沙，被海水來回沖刷。',
        photo: '和老照片比，格子間的縫隙越來越寬、越來越深。'
      },
      key: ['scope', 'float', 'photo'],
      nameHint: '蜂窩岩是一個個小圓洞，豆腐岩是直線切出的方格。',
      explain: '岩石原本就有兩組交叉的節理（裂縫），海水沿著節理反覆侵蝕，把岩石切成像豆腐一樣的方塊。'
    }
  };

  Object.keys(LAND_CASES).forEach(function (k) {
    LAND_CASES[k].view = LANDVIEW[k];
    ROCKS[k] = LAND_CASES[k];
  });

  function isRockCase(id) { return ROCKS[id].kind !== 'land'; }

  /* ---------- 場景 ---------- */

  var SCENES = [
    {
      id: 'volcano', name: '火山海岸', place: '澎湖・大屯火山', width: 640, pin: [58, 124],
      intro: [
        '這裡是火山活動留下的海岸。遠方是大屯火山，海邊有一整排黑色的石柱。',
        '博士的標本箱裡，有三塊石頭來自這裡。到處走走，靠近可疑的石頭就能調查。漂流木後面好像也藏了東西……',
        '⚠️ 注意：火山會噴出有毒氣體！看到步道出現紅色警示區，要趕快離開。'
      ],
      hazard: { type: 'gas', zone: [18, 228], every: [10, 15], warn: 4 },
      event: { type: 'bombs' },
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
        '這裡有四塊標本要調查。潮間帶的水池裡，好像有東西在閃……',
        '⚠️ 注意：潮水正在上漲！潮間帶被淹沒之前一定要破案。到海邊要隨時注意潮汐，漲潮時不要逗留。'
      ],
      hazard: { type: 'tide', duration: 240, flood: 450 },
      event: { type: 'wave', safeX: 320 },
      rocks: [
        { id: 'sandstone', x: 105 },
        { id: 'shale', x: 250 },
        { id: 'conglomerate', x: 430 },
        { id: 'limestone', x: 580, hidden: 'pool' }
      ],
      npcX: 185,
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
        '這裡的三塊標本都經歷過地底的高溫高壓。草叢後面好像有一塊條紋石頭。',
        '⚠️ 注意：落石警報響起時，要馬上躲進隧道或防落石棚！'
      ],
      hazard: { type: 'rockfall', shelters: [[252, 308, '隧道'], [440, 500, '防落石棚']], every: [10, 14], warn: 4.5 },
      event: { type: 'rain' },
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
        '小心，博士說這裡有「冒牌岩石」。天然的岩石，還是人做出來的？用證據說話！',
        '⚠️ 今天學校在做地震演練！一感覺到搖晃，就要立刻按「趴下掩護」，不要再走動。'
      ],
      hazard: { type: 'quake', every: [13, 19], react: 3 },
      event: { type: 'aftershock' },
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
    },
    {
      id: 'river', name: '溪流探險', place: '從山谷到出海口', width: 760, pin: [230, 96],
      intro: [
        '這條溪從高山一路流到大海。上游、中游、下游的地形都不一樣，它們是怎麼形成的？',
        '這一區調查的不是岩石，而是「地形」！工具換成望遠鏡、浮標、採樣篩和老照片。要判斷是侵蝕、堆積，還是風化造成的。',
        '⚠️ 注意：上游下大雨時溪水會暴漲！聽到警報，要馬上跑到高處的避難平臺。'
      ],
      hazard: { type: 'flood', shelters: [[150, 190, '高處平臺'], [395, 435, '堤防樓梯'], [560, 600, '高灘地']], every: [11, 15], warn: 4.5 },
      event: { type: 'rain' },
      rocks: [
        { id: 'vvalley', x: 100 },
        { id: 'exfol', x: 225 },
        { id: 'fan', x: 330 },
        { id: 'cutbank', x: 485, hidden: 'bush' },
        { id: 'delta', x: 680 }
      ],
      npcX: 625,
      think: {
        q: '颱風過後，台灣的河水常常變得非常混濁，河床也常常改道。為什麼？',
        options: ['河流短而急、雨量大，大量泥沙被沖刷、搬運，堆積後改變了河道', '工廠排放了大量污水', '河水被太陽曬熱了'],
        answer: 0,
        explain: '颱風帶來豪雨，水量大、流速快，侵蝕和搬運都變強，河水挾帶大量泥沙；水流變慢時泥沙堆積，就可能堵住舊河道、讓河流改道。'
      }
    },
    {
      id: 'cape', name: '岬灣海岸', place: '東北角・鼻頭角', width: 700, pin: [228, 48],
      intro: [
        '東北角的海岸，岬角和海灣一個接著一個。有的地方被海浪侵蝕，有的地方在堆積。',
        '小心！這裡有一個案件是「風化」造成的，不是海浪。要找出決定性的證據。',
        '⚠️ 潮水正在上漲，海蝕平臺上的案件要在淹沒前完成！看到瘋狗浪要遠離岸邊。'
      ],
      hazard: { type: 'tide', duration: 240, flood: 500 },
      event: { type: 'wave', safeX: 380 },
      rocks: [
        { id: 'beach', x: 110 },
        { id: 'seastack', x: 300 },
        { id: 'honeycomb', x: 425 },
        { id: 'tofu', x: 580 }
      ],
      npcX: 200,
      think: {
        q: '岬灣海岸的「岬角」會越來越短，「海灣」裡的沙灘卻能保留下來。為什麼？',
        options: ['浪的能量集中打在岬角，海灣裡浪小、沙子容易堆積', '海灣的沙子都是人搬來的', '岬角的岩石最軟'],
        answer: 0,
        explain: '海浪靠近岸邊時會轉向，能量集中在凸出的岬角，所以岬角被侵蝕、慢慢後退；海灣裡的浪分散變弱，沙子就堆積成沙灘。'
      }
    }
  ];

  /* ---------- 科學小百科：稀鹽酸測試 ---------- */

  var ACID_INFO = '' +
    '<p>滴稀鹽酸看冒不冒泡，是在檢查石頭<strong>含不含碳酸鈣</strong>（方解石的主要成分，常來自古代的貝殼、珊瑚）。</p>' +
    '<p class="info-formula">碳酸鈣 ＋ 鹽酸 → 氯化鈣 ＋ 水 ＋ <strong>二氧化碳（氣泡）</strong></p>' +
    '<ul class="info-list">' +
      '<li><span class="fizz-tag strong">劇烈冒泡</span>石灰岩（沉積岩）、大理岩（變質岩）：主要成分就是碳酸鈣</li>' +
      '<li><span class="fizz-tag weak">微微冒泡</span>磨石子、洗石子、水泥：水泥裡含有鈣的成分</li>' +
      '<li><span class="fizz-tag none">不冒泡</span>花崗岩、玄武岩、砂岩、頁岩、片岩、片麻岩：主要是石英、長石、雲母，不含碳酸鈣</li>' +
    '</ul>' +
    '<p class="info-key">💡 <strong>冒泡只能告訴你「成分」，不能告訴你「家族」！</strong>石灰岩和大理岩都會冒泡，因為大理岩就是石灰岩變質而來，成分一樣。要分辨它們，得再找其他證據：石灰岩常有化石、晶體不明顯；大理岩的化石消失了，晶體閃亮像方糖。</p>' +
    '<p>🌧️ 生活中的例子：酸雨會慢慢溶蝕大理石雕像；石灰岩洞和鐘乳石，也是微酸的雨水花幾萬年溶解石灰岩形成的。</p>' +
    '<p class="info-safety">🥽 真的做實驗時：用 5～10% 的稀鹽酸、戴護目鏡、由老師操作。也可以改用比較安全的<strong>白醋</strong>，氣泡較小，要用放大鏡觀察。先刮一點粉末再滴會更明顯，實驗後用清水沖乾淨。</p>';

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
  var ROCK_IDS = Object.keys(ROCKS).filter(function (k) { return ROCKS[k].kind !== 'land'; });
  var MAX_STARS = TOTAL_ROCKS * 3 + SCENES.length + 3;

  /* ---------- 進度存檔 ---------- */

  var state = load();

  function blank() {
    return { solved: {}, revealed: {}, think: {}, thinkDone: {}, final: 0, introSeen: {}, runs: {}, practice: false, muted: false };
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

  function solvedCount() { return Object.keys(state.solved).filter(function (k) { return ROCKS[k]; }).length; }
  function rocksDone() { return ROCK_IDS.every(function (k) { return state.solved[k]; }); }

  // 每區的挑戰狀態：信譽值、工具補給、已蒐集的證據、潮位
  function newRun(sc, retry) {
    return { hearts: HEARTS, tools: toolBudget(sc), acid: ACID_DROPS, evidence: {}, tide: 0, retry: !!retry };
  }

  function getRun(sc) {
    if (!state.runs[sc.id]) state.runs[sc.id] = newRun(sc, false);
    return state.runs[sc.id];
  }

  function sceneSolved(scene) {
    return scene.rocks.every(function (r) { return state.solved[r.id]; });
  }

  /* ---------- 音效（Web Audio 即時合成，不需要音檔） ---------- */

  var Sound = (function () {
    var ctx = null, master = null, noiseBuf = null, muted = false;

    function init() {
      if (ctx) return;
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.35;
        master.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        var d = noiseBuf.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { ctx = null; }
    }

    function ok() { return ctx && !muted; }

    function tone(f, dur, o) {
      o = o || {};
      var t = ctx.currentTime + (o.delay || 0);
      var osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(f, t);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(master);
      osc.start(t); osc.stop(t + dur + 0.05);
    }

    function noise(dur, o) {
      o = o || {};
      var t = ctx.currentTime + (o.delay || 0);
      var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noiseBuf; src.loop = true;
      f.type = o.filter || 'lowpass';
      f.frequency.setValueAtTime(o.freq || 1000, t);
      if (o.freqTo) f.frequency.exponentialRampToValueAtTime(o.freqTo, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t + (o.attack || 0.01));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t); src.stop(t + dur + 0.05);
    }

    var SFX = {
      step: function () { noise(0.05, { freq: 700, vol: 0.06 }); },
      click: function () { tone(660, 0.06, { type: 'square', vol: 0.08 }); },
      lens: function () { tone(880, 0.15, { to: 1400, vol: 0.12 }); },
      light: function () { tone(1200, 0.25, { type: 'triangle', vol: 0.08 }); tone(1800, 0.2, { type: 'triangle', vol: 0.05, delay: 0.08 }); },
      drip: function () { tone(900, 0.15, { to: 300, vol: 0.15 }); },
      fizz: function () { SFX.drip(); noise(1.4, { filter: 'highpass', freq: 3500, vol: 0.12, attack: 0.2, delay: 0.5 }); },
      fizzWeak: function () { SFX.drip(); noise(0.6, { filter: 'highpass', freq: 4000, vol: 0.05, attack: 0.1, delay: 0.5 }); },
      plop: function () { noise(0.25, { freq: 500, vol: 0.2 }); tone(320, 0.25, { to: 110, vol: 0.18, delay: 0.05 }); },
      discover: function () { tone(784, 0.1, { vol: 0.15 }); tone(1175, 0.2, { vol: 0.15, delay: 0.1 }); },
      correct: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.16, { type: 'triangle', vol: 0.16, delay: i * 0.09 }); }); },
      wrong: function () { tone(220, 0.4, { type: 'sawtooth', to: 110, vol: 0.12 }); },
      alarm: function () { for (var i = 0; i < 4; i++) tone(i % 2 ? 680 : 980, 0.22, { type: 'square', vol: 0.07, delay: i * 0.22 }); },
      beat: function () { tone(70, 0.12, { vol: 0.35 }); tone(60, 0.12, { vol: 0.25, delay: 0.16 }); },
      hit: function () { noise(0.35, { freq: 400, vol: 0.5 }); tone(110, 0.35, { to: 40, vol: 0.35 }); },
      rumble: function () { noise(2.6, { freq: 140, vol: 0.55, attack: 0.3 }); },
      whistle: function () { tone(1600, 1.2, { to: 350, vol: 0.08 }); },
      boom: function () { noise(0.7, { freq: 300, vol: 0.55 }); tone(80, 0.6, { to: 30, vol: 0.4 }); },
      wave: function () { noise(2.6, { filter: 'bandpass', freq: 300, freqTo: 1200, vol: 0.35, attack: 1.4 }); },
      rain: function () { noise(4, { filter: 'highpass', freq: 2000, vol: 0.1, attack: 0.8 }); },
      safe: function () { tone(660, 0.12, { vol: 0.12 }); tone(880, 0.18, { vol: 0.12, delay: 0.1 }); },
      levelup: function () { tone(330, 0.2, { type: 'square', vol: 0.08 }); tone(440, 0.2, { type: 'square', vol: 0.08, delay: 0.2 }); tone(554, 0.3, { type: 'square', vol: 0.08, delay: 0.4 }); },
      fail: function () { [392, 330, 262, 196].forEach(function (f, i) { tone(f, 0.3, { type: 'triangle', vol: 0.16, delay: i * 0.22 }); }); },
      fanfare: function () { [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) { tone(f, i === 5 ? 0.5 : 0.14, { type: 'triangle', vol: 0.16, delay: i * 0.12 }); }); }
    };

    return {
      init: init,
      play: function (name) {
        if (!ok()) return;
        if (ctx.state === 'suspended') ctx.resume();
        try { SFX[name](); } catch (e) { /* 忽略 */ }
      },
      setMuted: function (m) { muted = m; }
    };
  })();

  function buzz(pattern) {
    if (state.muted) return;
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* 忽略 */ }
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
          '<g><rect x="440" y="104" width="60" height="7" fill="#6b7280"/><path d="M440 104 L470 94 L500 104 Z" fill="#9ca3af"/>' +
          '<rect x="443" y="111" width="4" height="39" fill="#6b7280"/><rect x="493" y="111" width="4" height="39" fill="#6b7280"/>' +
          '<text x="470" y="102" text-anchor="middle" font-size="6.5" font-weight="700" fill="#fff">防落石棚</text></g>' +
          warning(200, '小心落石') + sign(380, '立霧溪');
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
      case 'river':
        var shel = scene.hazard.shelters.map(function (sh) {
          return '<g><rect x="' + sh[0] + '" y="' + (GROUND - 28) + '" width="' + (sh[1] - sh[0]) + '" height="8" fill="#6b7280"/>' +
            '<path d="M' + sh[0] + ' ' + GROUND + ' l8 -7 h6 l8 -7 h6 l8 -7" stroke="#6b7280" stroke-width="3" fill="none"/>' +
            '<text x="' + ((sh[0] + sh[1]) / 2) + '" y="' + (GROUND - 32) + '" text-anchor="middle" font-size="6.5" font-weight="800" fill="#15803d">' + sh[2] + '</text></g>';
        }).join('');
        return '' +
          '<rect width="' + w + '" height="180" fill="#cfe8f7"/>' +
          // 上游 V 形谷
          '<path d="M0 30 L40 20 L96 128 L104 128 L170 26 L230 40 V150 H0 Z" fill="#7d8a6a"/>' +
          '<path d="M96 128 Q100 134 104 128 L104 150 L96 150 Z" fill="#4b9bcc"/>' +
          // 中游：山谷出口與沖積扇
          '<path d="M230 40 L280 60 L300 70 L330 58 L380 50 L430 70 V150 H230 Z" fill="#a3b18a"/>' +
          '<path d="M300 70 L250 150 L380 150 Z" fill="#d4b07a"/><path d="M300 70 Q290 110 270 150 M300 70 Q304 110 310 150 M300 70 Q330 110 350 150" stroke="#4b9bcc" stroke-width="2" fill="none"/>' +
          // 下游：平原與海
          '<rect x="430" y="80" width="' + (w - 430) + '" height="70" fill="#a9d18e"/>' +
          '<rect x="640" y="70" width="' + (w - 640) + '" height="80" fill="#4b9bcc"/>' +
          '<path d="M640 108 L700 92 Q720 108 700 124 Z" fill="#e8d3a0"/>' +
          // 溪流（步道下方）
          '<rect y="' + (GROUND + 8) + '" width="' + w + '" height="22" fill="#4b9bcc"/>' +
          '<path class="wave" d="M0 ' + (GROUND + 12) + ' q10 -3 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#e0f2fe" stroke-width="1.5" fill="none"/>' +
          '<rect y="' + GROUND + '" width="' + w + '" height="8" fill="#b8a98e"/>' +
          shel + sign(40, '上游') + sign(280, '中游') + sign(540, '下游') + sign(735, '出海口');
      case 'cape':
        return '' +
          '<rect width="' + w + '" height="180" fill="#cfe8f7"/>' +
          '<rect y="96" width="' + w + '" height="54" fill="#4b9bcc"/>' +
          '<path class="wave" d="M0 100 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#e0f2fe" stroke-width="2" fill="none"/>' +
          // 海灣與沙灘
          '<path d="M0 60 L30 56 L40 120 Q110 134 190 120 L200 56 L240 60 V150 H0 Z" fill="#a9d18e"/>' +
          '<path d="M40 120 Q110 134 190 120 L196 150 L34 150 Z" fill="#e8d6a8"/>' +
          // 岬角與海蝕柱
          '<path d="M240 60 L470 54 L480 150 L240 150 Z" fill="#a98a66"/><path d="M240 56 L470 50 L470 58 L240 64 Z" fill="#7da35a"/>' +
          '<path d="M300 92 L322 92 L326 130 L296 130 Z" fill="#b08f6a"/>' +
          // 海蝕平臺
          '<rect x="480" y="' + (GROUND - 4) + '" width="' + (w - 480) + '" height="8" fill="#8f7a5f"/>' +
          ground(w, '#c9b48d') +
          sign(130, '海灣') + sign(360, '岬角') + sign(530, '海蝕平臺');
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
      cert: $('.game-cert', game),
      fail: $('.game-fail', game),
      hudHearts: $('#hud-hearts', game),
      hudTools: $('#hud-tools', game),
      hudHazard: $('#hud-hazard', game),
      hudLevel: $('#hud-level', game),
      hudSound: $('#hud-sound', game),
      practice: $('#practice-toggle', game)
    };

    var scene = null;
    var det = { x: 40, facing: 1, moving: 0, target: null, onArrive: null };
    var keys = {};
    var last = 0;
    var nearTarget = null;
    var detNode, worldNode, promptNode;
    var modalOpen = false;
    var run = null;
    var hz = { phase: 'idle', t: 0 };
    var ev = { phase: 'idle', t: 0 };
    var sceneTime = 0;
    var dangerLevel = 1;
    var stepT = 0;

    /* ===== HUD ===== */
    function updateHud() {
      els.hudStars.textContent = '⭐ ' + totalStars();
      els.hudSolved.textContent = '🪨 ' + solvedCount() + '/' + TOTAL_ROCKS;
      els.hudScene.textContent = scene ? scene.name + '・' + scene.place : '台灣地圖';
      var show = !!(scene && run);
      els.hudHearts.hidden = !show;
      els.hudTools.hidden = !show;
      els.hudHazard.hidden = !(show && scene.hazard.type === 'tide' && !sceneSolved(scene) && !state.practice);
      if (show) {
        els.hudHearts.textContent = '❤️'.repeat(run.hearts) + '🤍'.repeat(HEARTS - run.hearts);
        els.hudHearts.setAttribute('aria-label', '信譽值 ' + run.hearts + ' / ' + HEARTS);
        els.hudTools.textContent = '🧰 ' + run.tools + '・🧪 ' + run.acid;
        els.hudTools.setAttribute('aria-label', '剩餘工具 ' + run.tools + ' 次，鹽酸 ' + run.acid + ' 滴');
        els.hudHazard.textContent = '🌊 潮位 ' + Math.min(100, Math.round(run.tide * 100)) + '%';
        els.hudHazard.classList.toggle('danger', run.tide >= 0.75);
      }
      els.hudLevel.hidden = !(show && dangerLevel > 1 && hazardActive());
      els.hudLevel.textContent = '⚠️ Lv' + dangerLevel;
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
      [els.map, els.book, els.inv, els.think, els.final, els.cert, els.start, els.fail].forEach(function (l) {
        if (l !== layer) l.hidden = true;
      });
      layer.hidden = false;
      modalOpen = layer !== null;
      keys = {};
      var focusEl = layer.querySelector('button');
      if (focusEl) focusEl.focus({ preventScroll: true });
    }

    function closeLayers() {
      [els.map, els.book, els.inv, els.think, els.final, els.cert, els.start, els.fail].forEach(function (l) { l.hidden = true; });
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
      var allDone = rocksDone();
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
      fin.querySelector('small').textContent = allDone ? (state.final ? stars(state.final) : '時空旅程') : '🔒 破解全部 ' + ROCK_IDS.length + ' 塊岩石標本後開啟';
      fin.disabled = !allDone;
      fin.addEventListener('click', openFinal);
      pins.appendChild(fin);

      $('#map-progress', els.map).textContent = '已破解 ' + solvedCount() + ' / ' + TOTAL_ROCKS + ' 塊標本・⭐ ' + totalStars() + ' / ' + MAX_STARS;
      renderSceneList();
    }

    /* ===== 各地點進度與單獨重新開始 ===== */
    function sceneStars(sc) {
      var n = 0;
      sc.rocks.forEach(function (r) { if (state.solved[r.id]) n += state.solved[r.id].stars; });
      if (state.think[sc.id]) n++;
      return n;
    }

    function sceneStarted(sc) {
      return sc.rocks.some(function (r) { return state.solved[r.id] || state.revealed[r.id]; }) ||
        state.thinkDone[sc.id] || state.runs[sc.id] || state.introSeen[sc.id];
    }

    function resetScene(sc) {
      sc.rocks.forEach(function (r) {
        delete state.solved[r.id];
        delete state.revealed[r.id];
      });
      delete state.think[sc.id];
      delete state.thinkDone[sc.id];
      delete state.runs[sc.id];
      delete state.introSeen[sc.id];
      save();
      renderMap();
      updateHud();
      if (!solvedCount()) $('#game-start-btn', game).textContent = '▶ 開始調查';
      toast('🔄 「' + sc.name + '」已重新開始，其他地點的進度都保留著。');
    }

    function renderSceneList() {
      var list = $('.scene-list', els.map);
      list.innerHTML = '';
      SCENES.forEach(function (sc) {
        var done = sc.rocks.filter(function (r) { return state.solved[r.id]; }).length;
        var li = el('li', 'scene-row' + (sceneSolved(sc) ? ' done' : ''));
        var info = el('div', 'scene-info');
        info.appendChild(el('strong', null, sc.name));
        info.appendChild(el('small', null, sc.place + '・破案 ' + done + '/' + sc.rocks.length + '・⭐ ' + sceneStars(sc) + '/' + (sc.rocks.length * 3 + 1) + (state.thinkDone[sc.id] ? '・💡' : '')));
        li.appendChild(info);
        var go = el('button', 'scene-go', '前往');
        go.type = 'button';
        go.addEventListener('click', function () { enterScene(sc); });
        li.appendChild(go);
        var btn = el('button', 'scene-reset', '↺ 重新開始');
        btn.type = 'button';
        btn.disabled = !sceneStarted(sc);
        btn.setAttribute('aria-label', '重新開始「' + sc.name + '」');
        btn.addEventListener('click', function () {
          if (btn.dataset.confirm !== '1') {
            btn.dataset.confirm = '1';
            btn.textContent = '確定？再按一次';
            btn.classList.add('confirm');
            setTimeout(function () {
              if (!btn.isConnected) return;
              btn.dataset.confirm = '';
              btn.textContent = '↺ 重新開始';
              btn.classList.remove('confirm');
            }, 4000);
            return;
          }
          resetScene(sc);
        });
        li.appendChild(btn);
        list.appendChild(li);
      });
    }

    function openMap() {
      els.toast.hidden = true;
      scene = null;
      run = null;
      clearHazard();
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
      run = getRun(sc);
      // 上次失敗還沒重試就離開了：直接開始新的一輪
      var drowned = sc.hazard.type === 'tide' && run.tide >= 1 && sc.rocks.some(function (r) { return r.x >= sc.hazard.flood && !state.solved[r.id]; });
      if (run.hearts <= 0 || drowned) {
        state.runs[sc.id] = run = newRun(sc, true);
        save();
      }
      resetHazard();
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
          (R.kind === 'land'
            ? '<rect x="' + (r.x - 1) + '" y="' + (GROUND - 26) + '" width="2.5" height="26" fill="#7a5c3a"/>' +
              '<circle cx="' + r.x + '" cy="' + (GROUND - 32) + '" r="9" fill="#fef3c7" stroke="#7a5c3a" stroke-width="1.5"/>' +
              '<text x="' + r.x + '" y="' + (GROUND - 28.5) + '" text-anchor="middle" font-size="10">' + R.icon + '</text>'
            : '<ellipse cx="' + r.x + '" cy="' + (GROUND + 1) + '" rx="16" ry="3" fill="#00000033"/>' +
              rock(R.tex, r.x, GROUND - 9, 30, 19, R.seed)) +
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

      parts += hazardLayer();
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
      updateTide();
      findNear();
    }

    function hazardLayer() {
      return hazardBase() + '<g class="hz-ev"></g>';
    }

    function hazardBase() {
      var H = scene.hazard;
      if (H.type === 'gas') {
        return '<g class="hz-gas-zone"><rect x="' + H.zone[0] + '" y="20" width="' + (H.zone[1] - H.zone[0]) + '" height="' + (GROUND - 20) + '" fill="#ef4444"/>' +
          '<text x="' + ((H.zone[0] + H.zone[1]) / 2) + '" y="40" text-anchor="middle" font-size="11" font-weight="900" fill="#fff">⚠ 火山噴氣警示區</text></g>' +
          '<g class="hz-gas">' + [0, 1, 2, 3, 4, 5].map(function (i) {
            var x = H.zone[0] + 20 + i * ((H.zone[1] - H.zone[0] - 40) / 5);
            return '<circle cx="' + x + '" cy="' + (GROUND - 12) + '" r="14" fill="#d9f99d" opacity=".75"/><circle cx="' + (x + 8) + '" cy="' + (GROUND - 30) + '" r="11" fill="#ecfccb" opacity=".7"/>';
          }).join('') + '</g>';
      }
      if (H.type === 'tide') {
        return '<rect class="hz-tide" x="' + (H.flood - 10) + '" y="' + GROUND + '" width="' + (scene.width - H.flood + 10) + '" height="0" fill="#3b8fc4" opacity=".8"/>';
      }
      if (H.type === 'flood') {
        return H.shelters.map(function (sh) {
          return '<rect class="hz-shelter" x="' + sh[0] + '" y="' + (GROUND - 30) + '" width="' + (sh[1] - sh[0]) + '" height="3" fill="#22c55e"/>';
        }).join('') + '<rect class="hz-surge" x="0" y="' + (GROUND - 22) + '" width="' + scene.width + '" height="52" fill="#8a6a3f"/>';
      }
      if (H.type === 'rockfall') {
        return H.shelters.map(function (sh) {
          return '<rect class="hz-shelter" x="' + sh[0] + '" y="' + (GROUND - 2) + '" width="' + (sh[1] - sh[0]) + '" height="3" fill="#22c55e"/>';
        }).join('') + '<g class="hz-fall"></g>';
      }
      return '';
    }

    /* ===== 現場危險 ===== */
    function rand(range) { return range[0] + Math.random() * (range[1] - range[0]); }

    function clearHazard() {
      hz = { phase: 'idle', t: 0, beat: 0 };
      ev = { phase: 'idle', t: 0, beat: 0 };
      els.stage.classList.remove('hz-warn', 'hz-quake', 'hz-rain');
      els.action.classList.remove('duck');
      var box = els.svg && $('.hz-ev', els.svg);
      if (box) box.innerHTML = '';
    }

    function resetHazard() {
      clearHazard();
      sceneTime = 0;
      dangerLevel = 1;
      hz.t = nextDelay();
      ev.t = rand([22, 38]);
    }

    // 危險升級：待越久，警報越頻繁、反應時間越短；豪雨時落石加倍
    function nextDelay() {
      var H = scene.hazard;
      if (!H.every) return 0;
      var f = [1, 0.75, 0.55][dangerLevel - 1];
      if (els.stage.classList.contains('hz-rain')) f *= 0.5;
      return rand(H.every) * f;
    }

    function warnTime() {
      return Math.max(2.6, scene.hazard.warn - (dangerLevel - 1) * 0.6 - (els.stage.classList.contains('hz-rain') ? 0.8 : 0));
    }

    function updateLevel(dt) {
      sceneTime += dt;
      var lv = sceneTime >= 120 ? 3 : sceneTime >= 60 ? 2 : 1;
      if (lv > dangerLevel) {
        dangerLevel = lv;
        updateHud();
        Sound.play('levelup');
        toast('⚠️ 危險升級 Lv' + lv + '！警報會更頻繁、反應時間更短，快點破案！');
      }
    }

    function heartbeat(obj, dt) {
      obj.beat -= dt;
      if (obj.beat <= 0) { Sound.play('beat'); obj.beat = 0.55; }
    }

    function eventTick(dt) {
      var E = scene.event;
      if (!E || E.type === 'aftershock') return;
      if (hz.phase === 'warn' || hz.phase === 'quake') return;
      ev.t -= dt;
      if (ev.phase === 'warn') heartbeat(ev, dt);
      if (ev.phase === 'idle' && ev.t <= 0) {
        startEvent();
      } else if (ev.phase === 'warn' && ev.t <= 0) {
        eventImpact();
      } else if (ev.phase === 'rain' && ev.t <= 0) {
        els.stage.classList.remove('hz-rain');
        toast('🌤️ 雨停了，落石頻率恢復正常。');
        ev.phase = 'cool'; ev.t = 1;
      } else if (ev.phase === 'cool' && ev.t <= 0) {
        ev.phase = 'idle';
        ev.t = rand([30, 48]) * [1, 0.8, 0.65][dangerLevel - 1];
      }
    }

    function startEvent() {
      var E = scene.event;
      var box = $('.hz-ev', els.svg);
      ev.beat = 0;
      if (E.type === 'bombs') {
        var xs = [det.x, det.x - 40, det.x + 40].map(function (x) { return Math.max(20, Math.min(scene.width - 20, x)); });
        ev.spots = xs;
        box.innerHTML = xs.map(function (x) {
          return '<g class="bomb-mark"><ellipse class="bomb-shadow" cx="' + x.toFixed(1) + '" cy="' + (GROUND + 1) + '" rx="15" ry="4.5" fill="#111"/>' +
            '<ellipse class="bomb-ring" cx="' + x.toFixed(1) + '" cy="' + (GROUND + 1) + '" rx="17" ry="5.5" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4 3"/>' +
            '<text x="' + x.toFixed(1) + '" y="' + (GROUND - 8) + '" text-anchor="middle" font-size="12" font-weight="900" fill="#ef4444">▼</text></g>';
        }).join('');
        ev.phase = 'warn';
        ev.t = Math.max(1.8, 2.6 - (dangerLevel - 1) * 0.3);
        Sound.play('whistle');
        buzz(200);
        toast('🌋 火山彈飛來了！快離開地上的黑影！');
      } else if (E.type === 'wave') {
        // 浪從目前畫面的右邊出現，玩家一定看得到
        var wx = Math.min(scene.width - 10, camX() + VIEW_W - 6);
        box.innerHTML = '<g class="rogue-wave"><path d="M' + wx + ' ' + GROUND + ' q-30 -50 -70 -40 q30 6 30 40 z" fill="#2b7fb5"/>' +
          '<path d="M' + (wx - 70) + ' ' + (GROUND - 40) + ' q14 -6 24 4" stroke="#e0f2fe" stroke-width="4" fill="none"/>' +
          '<text x="' + (wx - 40) + '" y="' + (GROUND - 56) + '" text-anchor="middle" font-size="11" font-weight="900" fill="#b91c1c">← 快跑！</text></g>';
        ev.phase = 'warn';
        ev.t = Math.max(2.5, 3.6 - (dangerLevel - 1) * 0.4);
        Sound.play('wave');
        buzz([150, 80, 150]);
        toast('🌊 瘋狗浪來了！快遠離岸邊，退到女王頭的左邊！');
      } else if (E.type === 'rain') {
        els.stage.classList.add('hz-rain');
        ev.phase = 'rain';
        ev.t = 16;
        Sound.play('rain');
        toast('🌧️ 豪雨特報！視線變差，落石會更頻繁！');
        if (hz.phase === 'idle') hz.t = Math.min(hz.t, nextDelay());
      }
    }

    function eventImpact() {
      var E = scene.event;
      var box = $('.hz-ev', els.svg);
      ev.phase = 'cool';
      ev.t = 1.5;
      if (E.type === 'bombs') {
        box.innerHTML = ev.spots.map(function (x, i) {
          return '<circle class="bomb-fall" style="animation-delay:' + (i * 0.05) + 's" cx="' + x.toFixed(1) + '" cy="' + (GROUND - 6) + '" r="7" fill="#3f2a1d" stroke="#ff7b1a" stroke-width="2"/>';
        }).join('');
        Sound.play('boom');
        var struck = ev.spots.some(function (x) { return Math.abs(det.x - x) < 13; });
        if (struck) hit('被火山彈砸中了！');
        else { Sound.play('safe'); toast('😮‍💨 閃過了！火山彈落在旁邊。'); }
        setTimeout(function () { if (box) box.innerHTML = ''; }, 1200);
      } else if (E.type === 'wave') {
        var w = $('.rogue-wave', els.svg);
        if (w) w.classList.add('crash');
        if (det.x > E.safeX) {
          hit('被瘋狗浪捲到，嗆了好幾口水！');
          det.x = E.safeX - 30;
          det.target = null;
          updateCamera();
          findNear();
        } else {
          Sound.play('safe');
          toast('😮‍💨 好險！你離岸邊夠遠。看海要遠離岸邊和消波塊。');
        }
        setTimeout(function () { if (box) box.innerHTML = ''; }, 1400);
      }
    }

    function hazardActive() {
      return scene && run && !state.practice && !sceneSolved(scene) && els.fail.hidden;
    }

    function inShelter() {
      return scene.hazard.shelters.some(function (sh) { return det.x >= sh[0] && det.x <= sh[1]; });
    }

    function updateTide() {
      if (!scene || scene.hazard.type !== 'tide' || !run) return;
      var r = $('.hz-tide', els.svg);
      if (!r) return;
      var level = state.practice ? 0 : Math.min(1, run.tide);
      var hgt = level * 30;
      r.setAttribute('y', String(GROUND + 30 - hgt - (level >= 1 ? 6 : 0)));
      r.setAttribute('height', String(hgt + (level >= 1 ? 6 : 0)));
    }

    function hazardTick(dt) {
      if (!hazardActive()) return;
      var H = scene.hazard;
      var exploring = !modalOpen && els.dialog.hidden;

      if (exploring) updateLevel(dt);

      if (H.type === 'tide') {
        if (exploring) eventTick(dt);
        // 潮水在調查時也會上漲，要規劃調查順序
        if (!els.dialog.hidden || (modalOpen && els.inv.hidden)) return;
        var before = run.tide;
        run.tide = Math.min(1, run.tide + dt / H.duration);
        [0.5, 0.75, 0.9].forEach(function (th) {
          if (before < th && run.tide >= th) toast('🌊 潮位 ' + Math.round(th * 100) + '%！潮間帶快被淹沒了！');
        });
        updateTide();
        updateHud();
        if (run.tide >= 1 && before < 1) floodCheck();
        return;
      }

      if (!exploring) return;
      eventTick(dt);
      hz.t -= dt;
      if (hz.phase === 'warn') heartbeat(hz, dt);
      if (hz.phase === 'idle' && hz.t <= 0) {
        if (H.type === 'quake') {
          var after = !!hz.nextAfter;
          hz.nextAfter = false;
          hz.isAfter = after;
          hz.phase = 'quake';
          hz.t = after ? 2 : Math.max(2.2, H.react - (dangerLevel - 1) * 0.4);
          hz.ducked = false;
          keys = {};
          det.target = null;
          els.stage.classList.add('hz-quake');
          els.action.classList.add('duck');
          findNear();
          Sound.play('rumble');
          buzz([400, 100, 400, 100, 400]);
          toast(after ? '📳 餘震！又搖了，快趴下！' : '📳 地震！馬上「趴下、掩護、穩住」！');
        } else {
          hz.phase = 'warn';
          hz.t = warnTime();
          hz.beat = 0;
          els.stage.classList.add('hz-warn');
          Sound.play('alarm');
          buzz(300);
          toast({
            gas: '⚠️ 火山即將噴氣！快離開紅色警示區！',
            rockfall: '⚠️ 落石警報！快躲進隧道或防落石棚！',
            flood: '⚠️ 溪水暴漲警報！快跑到高處的避難平臺！'
          }[H.type]);
        }
      } else if (hz.phase === 'warn' && hz.t <= 0) {
        els.stage.classList.remove('hz-warn');
        impact();
        hz.phase = 'cool';
        hz.t = 1.6;
      } else if (hz.phase === 'quake' && hz.t <= 0) {
        els.stage.classList.remove('hz-quake');
        els.action.classList.remove('duck');
        hz.phase = 'cool';
        hz.t = 1;
        // 大地震後常有餘震
        if (!hz.isAfter && Math.random() < 0.6) {
          hz.phase = 'idle';
          hz.t = 2.5 + Math.random() * 2.5;
          hz.nextAfter = true;
        }
        if (hz.ducked) {
          Sound.play('safe');
          toast('✅ 做得好！趴下、掩護、穩住，搖晃停止了。' + (hz.nextAfter ? '小心餘震！' : ''));
          var d = $('.det', els.svg);
          if (d) d.classList.remove('ducking');
        } else {
          hit('地震時沒有趴下掩護，被掉落物砸到了！');
        }
        findNear();
      } else if (hz.phase === 'cool' && hz.t <= 0) {
        hz.phase = 'idle';
        hz.t = nextDelay();
      }
    }

    function impact() {
      var H = scene.hazard;
      if (H.type === 'gas') {
        var g = $('.hz-gas', els.svg);
        if (g) { g.classList.remove('puff'); void g.getBBox(); g.classList.add('puff'); }
        Sound.play('rumble');
        if (det.x >= H.zone[0] && det.x <= H.zone[1]) hit('吸到火山氣體，頭好暈！');
        else { Sound.play('safe'); toast('😮‍💨 好險！你離開了警示區。'); }
      } else if (H.type === 'rockfall') {
        var box = $('.hz-fall', els.svg);
        var out = '';
        for (var i = 0; i < 5; i++) {
          var x = det.x - 50 + i * 25 + (Math.random() * 10 - 5);
          out += '<path class="falling" style="animation-delay:' + (i * 0.08) + 's" d="M' + x.toFixed(1) + ' 0 l7 -4 l6 4 l-2 7 l-9 1 z" fill="#78716c"/>';
        }
        box.innerHTML = out;
        Sound.play('boom');
        if (inShelter()) { Sound.play('safe'); toast('😮‍💨 好險！你躲進了安全的地方。'); }
        else hit('被落石擊中了！');
      } else if (H.type === 'flood') {
        var surge = $('.hz-surge', els.svg);
        if (surge) { surge.classList.remove('surge'); void surge.getBBox(); surge.classList.add('surge'); }
        Sound.play('wave');
        if (inShelter()) { Sound.play('safe'); toast('😮‍💨 好險！你在高處避開了洪水。溪水變混濁、水位上升時，要立刻離開河床！'); }
        else hit('被暴漲的溪水沖倒了！');
      }
    }

    function floodCheck() {
      var flood = scene.hazard.flood;
      var lost = scene.rocks.filter(function (r) { return r.x >= flood && !state.solved[r.id]; });
      if (det.x >= flood - 10) {
        det.x = flood - 30;
        det.target = null;
        updateCamera();
      }
      if (lost.length) {
        if (!els.inv.hidden) closeLayers();
        fail('潮水淹沒了潮間帶，還沒破案的標本被海浪捲走了。', '下次要先觀察環境：會被淹沒的地方要先調查！');
      } else {
        toast('🌊 滿潮了！幸好潮間帶的標本已經破案。');
      }
    }

    function hit(msg) {
      run.hearts = Math.max(0, run.hearts - 1);
      save();
      updateHud();
      toast('💥 ' + msg + '　❤️ -1');
      Sound.play('hit');
      buzz([200, 80, 300]);
      els.stage.classList.remove('hz-hit', 'hz-shake');
      void els.stage.offsetWidth;
      els.stage.classList.add('hz-hit', 'hz-shake');
      if (run.hearts <= 0) {
        setTimeout(function () {
          fail('偵探信譽值歸零了。', '在現場要注意安全，也不能急著下結論。');
        }, 900);
      }
    }

    /* ===== 案件失敗 ===== */
    function fail(reason, advice) {
      clearHazard();
      Sound.play('fail');
      buzz([500, 150, 500]);
      keys = {};
      det.target = null;
      $('.fail-reason', els.fail).textContent = reason;
      $('.fail-advice', els.fail).textContent = '🧓 阿岩博士：「' + advice + '」';
      var kept = scene.rocks.filter(function (r) { return state.solved[r.id]; }).length;
      $('.fail-kept', els.fail).textContent = '已破案的 ' + kept + ' 塊標本會保留；其餘標本要重新調查，重試破案的標本最多 2 顆星。';
      openLayer(els.fail);
    }

    function retryScene() {
      state.runs[scene.id] = newRun(scene, true);
      save();
      enterScene(scene);
      toast('🔄 重新調查！信譽值和工具補給都恢復了。');
    }

    function checkSupply() {
      if (!scene || !run || sceneSolved(scene) || run.tools > 0) return false;
      var stuck = scene.rocks.filter(function (r) {
        return !state.solved[r.id] && !(run.evidence[r.id] && run.evidence[r.id].length);
      });
      if (stuck.length) {
        fail('工具補給用完了，還有標本完全沒有證據可以推理。', '每次用工具前先想一想：哪一種最能把選項分開？');
        return true;
      }
      return false;
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
      if (hz.phase === 'quake') {
        promptNode.hidden = true;
        els.action.disabled = !!hz.ducked;
        els.action.textContent = hz.ducked ? '🛡️ 穩住…' : '🛡️ 趴下掩護！';
        return;
      }
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
      if (scene) hazardTick(dt);
      if (scene && !modalOpen && els.dialog.hidden && hz.phase !== 'quake') {
        var dir = 0;
        if (keys.left) dir -= 1;
        if (keys.right) dir += 1;
        if (dir) det.target = null;
        if (!dir && det.target != null) {
          var diff = det.target - det.x;
          if (Math.abs(diff) < 2 || (scene.hazard.type === 'tide' && run && run.tide >= 1 && !state.practice && det.target >= scene.hazard.flood - 10)) {
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
          var maxX = scene.width - 12;
          if (scene.hazard.type === 'tide' && run && run.tide >= 1 && !state.practice) maxX = scene.hazard.flood - 20;
          det.x = Math.max(12, Math.min(maxX, det.x + dir * SPEED * dt));
          detNode.classList.add('walking');
          stepT -= dt;
          if (stepT <= 0) { Sound.play('step'); stepT = 0.28; }
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
      if (hz.phase === 'quake') {
        if (!hz.ducked) {
          hz.ducked = true;
          Sound.play('click');
          var d = $('.det', els.svg);
          if (d) d.classList.add('ducking');
          findNear();
        }
        return;
      }
      t = t || nearTarget;
      if (!t || modalOpen) return;
      if (t.kind === 'search') {
        state.revealed[t.rock.id] = true;
        save();
        var c = $('.cover[data-x="' + t.rock.x + '"]', els.svg);
        if (c) c.classList.add('moved');
        var s = $('.specimen[data-rock="' + t.rock.id + '"]', els.svg);
        if (s) s.classList.remove('is-hidden');
        Sound.play('discover');
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
      if (hz.phase === 'quake') { interact(); return; }
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
        if (e.key === 'Escape' && els.fail.hidden) {
          if (!els.inv.hidden && inv) closeInvestigation();
          else if (scene) closeLayers();
        }
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
      var r = getRun(sc);
      inv = { id: id, R: R, scene: sc, run: r, fromBook: !!fromBook, used: prev ? [] : (r.evidence[id] || []).slice(), family: null, name: null, key: null, wrong: 0, done: !!prev };

      var box = els.inv;
      var num = Object.keys(ROCKS).indexOf(id) + 1;
      var land = R.kind === 'land';
      $('.inv-title', box).textContent = prev ? '📒 已破案：' + R.name : (land ? '現場 #' + num + '：可疑的地形' : '證物 #' + num + '：神祕的石頭');
      $('.inv-safety', box).hidden = land;
      var labels = box.querySelectorAll('.deduce-label');
      labels[0].textContent = land ? '主要是哪一種作用造成的？' : '它屬於哪個家族？';
      labels[1].textContent = land ? '這是什麼地形？' : '它叫什麼名字？';
      $('.inv-sub', box).textContent = '發現地點：' + sc.name + '（' + sc.place + '）';

      drawSpecimen();
      renderTools();
      renderEvidence();
      renderDeduce();
      $('.inv-result', box).hidden = true;
      $('.inv-feedback', box).hidden = true;

      if (prev) {
        // 已破案：直接顯示所有證據與結論，方便複習
        inv.used = toolsFor(R).map(function (t) { return t.id; });
        renderTools();
        renderEvidence();
        $('.inv-deduce', box).hidden = true;
        showResult(prev.stars, true);
      } else {
        $('.inv-deduce', box).hidden = false;
      }
      openLayer(box);
    }

    function drawLand(tool) {
      var R = inv.R;
      var svg = $('.inv-specimen svg', els.inv);
      var out = R.view(false);
      if (tool === 'scope') {
        out += '<g class="anim-lens"><path d="M0 0H320V150H0Z M104 75 m-62 0 a62 62 0 1 0 124 0 a62 62 0 1 0 -124 0 M216 75 m-62 0 a62 62 0 1 0 124 0 a62 62 0 1 0 -124 0" fill="#111" fill-rule="evenodd" opacity=".82"/>' +
          '<circle cx="104" cy="75" r="62" fill="none" stroke="#374151" stroke-width="4"/><circle cx="216" cy="75" r="62" fill="none" stroke="#374151" stroke-width="4"/></g>';
      } else if (tool === 'float') {
        var f = R.floatPath, dur = R.flow === 'fast' ? 1.1 : R.flow === 'slow' ? 4 : 0;
        out += '<g class="buoy' + (dur ? ' moving' : '') + '" style="--dx:' + (f[2] - f[0]) + 'px;--dy:' + (f[3] - f[1]) + 'px;--dur:' + (dur || 1) + 's">' +
          '<circle cx="' + f[0] + '" cy="' + f[1] + '" r="6" fill="#ef4444" stroke="#fff" stroke-width="2"/><path d="M' + f[0] + ' ' + (f[1] - 6) + ' v-8" stroke="#1f2933" stroke-width="1.5"/></g>' +
          '<g><rect x="8" y="8" width="118" height="22" rx="11" fill="#ffffffe6" stroke="#1f2933"/><text x="67" y="23" text-anchor="middle" font-size="11" font-weight="800" fill="#1f2933">' +
          (R.flow === 'fast' ? '🌊 水流很快！' : R.flow === 'slow' ? '💧 水流緩慢' : '🚫 水碰不到這裡') + '</text></g>';
      } else if (tool === 'sieve') {
        out += '<g class="anim-lens"><rect x="196" y="14" width="116" height="122" rx="10" fill="#fff7ed" stroke="#7a5c3a" stroke-width="3"/>' + grains(R.grain) + '</g>';
      } else if (tool === 'photo') {
        out = '<rect width="320" height="150" fill="#f3efe6"/>' +
          '<defs><clipPath id="ph-a"><rect x="14" y="20" width="136" height="64"/></clipPath><clipPath id="ph-b"><rect x="170" y="20" width="136" height="64"/></clipPath></defs>' +
          '<g class="anim-lens"><rect x="8" y="14" width="148" height="104" fill="#fff" stroke="#d6d3d1"/><g clip-path="url(#ph-a)"><g class="sepia" style="transform-box:view-box;transform-origin:0 0" transform="translate(14 20) scale(0.425)">' + R.view(true) + '</g></g>' +
          '<text x="82" y="106" text-anchor="middle" font-size="12" font-weight="800" fill="#57534e">以前</text></g>' +
          '<text x="160" y="72" text-anchor="middle" font-size="18" fill="#1f2933">→</text>' +
          '<g class="anim-lens" style="animation-delay:.3s"><rect x="164" y="14" width="148" height="104" fill="#fff" stroke="#d6d3d1"/><g clip-path="url(#ph-b)"><g style="transform-box:view-box;transform-origin:0 0" transform="translate(170 20) scale(0.425)">' + R.view(false) + '</g></g>' +
          '<text x="238" y="106" text-anchor="middle" font-size="12" font-weight="800" fill="#1f2933">現在</text></g>';
      }
      svg.innerHTML = out;
    }

    function grains(type) {
      var g = '', i, x, y;
      var put = function (shape) { g += shape; };
      for (i = 0; i < 40; i++) {
        x = 206 + (i * 37) % 96; y = 26 + (i * 23) % 98;
        if (type === 'boulder' && i < 7) put('<path d="M' + (206 + (i * 31) % 80) + ' ' + (30 + (i * 17) % 80) + ' l16 -6 l12 10 l-4 14 l-18 2 z" fill="#8a7a6a" stroke="#4b3f33"/>');
        if (type === 'gradient') put('<circle cx="' + x + '" cy="' + y + '" r="' + (y < 60 ? 5 : y < 95 ? 2.5 : 1) + '" fill="#a8916f"/>');
        if (type === 'mud') put('<circle cx="' + x + '" cy="' + y + '" r=".9" fill="#8a6a58"/>');
        if (type === 'sand') put('<circle cx="' + x + '" cy="' + y + '" r="1.5" fill="#d4b07a"/>' + (i % 9 === 0 ? '<path d="M' + x + ' ' + y + ' l-4 -4 q4 -4 8 0 z" fill="#fef3c7" stroke="#a8916f"/>' : ''));
        if (type === 'blocks' && i < 6) put('<rect x="' + (208 + (i * 29) % 80) + '" y="' + (32 + (i * 19) % 76) + '" width="22" height="16" fill="#a98a66" stroke="#6b5a45" transform="rotate(' + (i * 17 % 30) + ' ' + (218 + (i * 29) % 80) + ' ' + (40 + (i * 19) % 76) + ')"/>');
        if (type === 'gravel') put('<ellipse cx="' + x + '" cy="' + y + '" rx="3.5" ry="2.6" fill="#9ca3af" stroke="#6b7280"/>');
        if (type === 'salt') put('<circle cx="' + x + '" cy="' + y + '" r="1.4" fill="#d4b07a"/>' + (i % 3 === 0 ? '<rect x="' + x + '" y="' + (y - 3) + '" width="4" height="4" fill="#fff" stroke="#94a3b8" transform="rotate(45 ' + (x + 2) + ' ' + (y - 1) + ')"/>' : ''));
        if (type === 'flakes' && i < 10) put('<path d="M' + x + ' ' + y + ' q10 -6 20 0" stroke="#8a7458" stroke-width="3" fill="none"/>');
      }
      if (type === 'roots') put('<path d="M220 40 q10 30 0 60 M250 36 q-8 34 6 70 M282 44 q6 26 -4 56" stroke="#7a5233" stroke-width="3" fill="none"/><text x="254" y="128" text-anchor="middle" font-size="10" fill="#7a5233">沒有沙子堆積</text>');
      if (type === 'gradient') put('<text x="254" y="22" text-anchor="middle" font-size="8" fill="#5f6b7a">扇頂：粗　→　扇緣：細</text>');
      return g;
    }

    function drawSpecimen(tool) {
      var R = inv.R;
      if (R.kind === 'land') { drawLand(tool); return; }
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
      toolsFor(inv.R).forEach(function (t) {
        var b = el('button', 'tool-btn');
        b.type = 'button';
        var used = inv.used.indexOf(t.id) >= 0;
        if (used) b.classList.add('used');
        b.innerHTML = '<span class="tool-icon"></span><span class="tool-name"></span><small></small>';
        b.querySelector('.tool-icon').textContent = t.icon;
        b.querySelector('.tool-name').textContent = t.name;
        var out = !used && !inv.done && (inv.run.tools <= 0 || (t.id === 'acid' && inv.run.acid <= 0));
        b.querySelector('small').textContent = used ? '已使用（再看一次）' : out ? '補給用完了' : t.desc;
        b.disabled = out;
        b.addEventListener('click', function () { useTool(t.id); });
        wrap.appendChild(b);
      });
      var n = inv.used.length;
      $('.inv-toolcount', els.inv).textContent = inv.done ? '' :
        '這塊用了 ' + n + ' 種工具' + (n <= EFFICIENT_TOOLS ? '（' + EFFICIENT_TOOLS + ' 種以內破案可得效率星 ⭐）' : '（超過 ' + EFFICIENT_TOOLS + ' 種，拿不到效率星了）');
      var sup = $('.inv-supply', els.inv);
      sup.hidden = inv.done;
      sup.textContent = '本區補給剩下：🧰 工具 ' + inv.run.tools + ' 次' + (inv.R.kind === 'land' ? '' : '・🧪 鹽酸 ' + inv.run.acid + ' 滴') + '・信譽 ' + '❤️'.repeat(inv.run.hearts) + '🤍'.repeat(HEARTS - inv.run.hearts);
      sup.classList.toggle('low', inv.run.tools <= 2);
    }

    function toolSound(id) {
      var R = inv.R;
      if (id === 'lens') Sound.play('lens');
      else if (id === 'light') Sound.play('light');
      else if (id === 'acid') Sound.play(R.fizz === 'strong' ? 'fizz' : R.fizz === 'weak' ? 'fizzWeak' : 'drip');
      else if (id === 'water' || id === 'float') Sound.play('plop');
      else if (id === 'scope') Sound.play('lens');
      else if (id === 'sieve') Sound.play('click');
      else if (id === 'photo') Sound.play('light');
    }

    function useTool(id) {
      toolSound(id);
      if (inv.used.indexOf(id) < 0 && !inv.done) {
        if (inv.run.tools <= 0) return;
        if (id === 'acid' && inv.run.acid <= 0) return;
        inv.run.tools--;
        if (id === 'acid') inv.run.acid--;
        inv.used.push(id);
        inv.run.evidence[inv.id] = inv.used.slice();
        save();
        updateHud();
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
        var t = toolById(tid);
        var li = el('li', 'ev-card' + (fresh === tid ? ' fresh' : ''));
        li.appendChild(el('span', 'ev-tool', t.icon + ' ' + t.name));
        li.appendChild(el('span', 'ev-text', inv.R.ev[tid]));
        if (tid === 'acid') {
          var more = el('details', 'ev-more');
          var sum = el('summary', null, '📖 冒泡代表什麼？');
          var body = el('div', 'info-body');
          body.innerHTML = ACID_INFO;
          more.appendChild(sum);
          more.appendChild(body);
          li.appendChild(more);
        }
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
      (inv.R.kind === 'land' ? LAND_FAMILY_ORDER : FAMILY_ORDER).forEach(function (f) {
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
        var t = toolById(inv.key);
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
        msg = (R.kind === 'land' ? '❌ 作用判斷錯了。' : '❌ 家族不對。') + '重新看看證據的線索：' + FAMILIES[R.family].hint;
      } else if (inv.name !== R.name) {
        msg = '❌ 家族對了，但名稱不對。' + R.nameHint;
      } else if (R.key.indexOf(inv.key) < 0) {
        msg = '🤔 結論正確！但「' + toolById(inv.key).name + '」的證據，其他選項也可能有，不能證明就是它。換一個更有說服力的證據！';
      }
      if (msg) {
        inv.wrong++;
        inv.run.hearts = Math.max(0, inv.run.hearts - 1);
        save();
        updateHud();
        renderTools();
        msg += '（信譽 ❤️ -1，剩 ' + inv.run.hearts + '）';
        Sound.play('wrong');
        buzz(150);
        fb.textContent = msg;
        fb.hidden = false;
        fb.classList.remove('shake');
        void fb.offsetWidth;
        fb.classList.add('shake');
        if (inv.run.hearts <= 0) {
          $('#inv-submit', els.inv).disabled = true;
          setTimeout(function () {
            closeLayers();
            fail('推理錯太多次，偵探信譽值歸零了。', '證據不足就下結論，標本又被貼錯標籤了！先蒐集能區分選項的證據再結案。');
          }, 1400);
        }
        return;
      }
      fb.hidden = true;
      var s = 3;
      if (inv.wrong > 0) s--;
      if (inv.used.length > EFFICIENT_TOOLS) s--;
      s = Math.max(1, s);
      if (inv.run.retry) s = Math.min(2, s);
      state.solved[inv.id] = { stars: s, tools: inv.used.length };
      Sound.play(inv.scene && sceneSolved(inv.scene) ? 'fanfare' : 'correct');
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
        if (inv.run.retry) notes.push('重試破案最多 2 顆星');
      }
      $('.res-notes', res).textContent = notes.join('・');
      $('#inv-close', els.inv).textContent = review ? '關閉' : '收進案件簿 📒';
    }

    $('#inv-close', els.inv).addEventListener('click', closeInvestigation);

    function closeInvestigation() {
      if (inv.fromBook) { openBook(); return; }
      var finishedNow = inv.scene && sceneSolved(inv.scene) && !state.thinkDone[inv.scene.id];
      closeLayers();
      renderScene();
      updateHud();
      if (checkSupply()) return;
      if (finishedNow) {
        toast('🎉 這一區的標本全部破案！阿岩博士有話要說。');
      }
      if (rocksDone() && !state.final && inv.R.kind !== 'land') {
        setTimeout(function () { toast('🗺️ 全部標本破案！回地圖挑戰最終案件。'); }, 2800);
      }
    }

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
            Sound.play('correct');
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
            Sound.play('wrong');
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
    var bookInfo = $('.book-info .info-body', els.book);
    if (bookInfo) bookInfo.innerHTML = ACID_INFO;

    function openBook() {
      var grid = $('.book-grid', els.book);
      grid.innerHTML = '';
      Art.setId(900);
      FAMILY_ORDER.concat(LAND_FAMILY_ORDER).forEach(function (f) {
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
          card.innerHTML = '<svg viewBox="0 0 60 36" aria-hidden="true">' + (s ? (R.kind === 'land' ? '<text x="30" y="26" text-anchor="middle" font-size="22">' + R.icon + '</text>' : rock(R.tex, 30, 18, 52, 30, R.seed)) : '<text x="30" y="24" text-anchor="middle" font-size="18" fill="#9ca3af">？</text>') + '</svg><span class="book-name"></span><span class="book-stars"></span>';
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
              Sound.play('fanfare');
              fb.textContent = '🎉 時空旅程完成！' + stars(s) + '　' + FINAL.explain;
              fb.className = 'final-feedback ok';
              fb.hidden = false;
              $('#final-done', box).hidden = false;
            }
          } else {
            mistakes++;
            Sound.play('wrong');
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
      // 稱號以岩石主線的滿分為準，地形案件的星星算額外加分
      var rockMax = ROCK_IDS.length * 3 + 4 + 3;
      var title = total >= rockMax - 5 ? '岩石神探' : total >= rockMax * 0.65 ? '資深岩石偵探' : '見習岩石偵探';
      $('.cert-title', els.cert).textContent = title;
      $('.cert-stars', els.cert).textContent = '⭐ ' + total + ' / ' + MAX_STARS;
      var rockSolved = ROCK_IDS.filter(function (k) { return state.solved[k]; }).length;
      var landSolved = Object.keys(ROCKS).filter(function (k) { return ROCKS[k].kind === 'land' && state.solved[k]; }).length;
      var landTotal = TOTAL_ROCKS - ROCK_IDS.length;
      $('.cert-detail', els.cert).textContent = '你用證據破解了 ' + rockSolved + ' 塊岩石標本' +
        (landSolved ? '、' + landSolved + ' 個地形現場' : '') + '，還排出了岩石循環的時空旅程。' +
        (landSolved < landTotal ? '還有 ' + (landTotal - landSolved) + ' 個地形現場等你去調查！' : '');
      openLayer(els.cert);
    }

    /* ===== 按鈕 ===== */
    $('#hud-map', game).addEventListener('click', openMap);
    $('#hud-book', game).addEventListener('click', openBook);
    $('#map-book', game).addEventListener('click', openBook);
    Array.prototype.forEach.call(game.querySelectorAll('[data-close]'), function (b) {
      b.addEventListener('click', function () {
        if (!els.inv.hidden && inv) { closeInvestigation(); return; }
        if (scene) closeLayers(); else openMap();
      });
    });
    $('#cert-map', game).addEventListener('click', openMap);
    $('#fail-retry', game).addEventListener('click', retryScene);
    $('#fail-map', game).addEventListener('click', function () {
      state.runs[scene.id] = newRun(scene, true);
      save();
      openMap();
    });

    els.practice.checked = !!state.practice;
    els.practice.addEventListener('change', function () {
      state.practice = els.practice.checked;
      save();
      toast(state.practice ? '🛡️ 練習模式：關閉現場危險（信譽值和工具補給仍然有效）' : '⚠️ 挑戰模式：現場危險開啟！');
    });
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
        setTimeout(function () { btn.dataset.confirm = ''; btn.textContent = '全部重新開始'; }, 4000);
        return;
      }
      var practice = state.practice;
      state = blank();
      state.practice = practice;
      save();
      btn.dataset.confirm = '';
      btn.textContent = '全部重新開始';
      renderMap();
      updateHud();
      $('#game-start-btn', game).textContent = '▶ 開始調查';
      toast('已清除進度，從頭開始調查！');
    });

    // 聲音：第一次點擊遊戲時啟動（瀏覽器規定要使用者互動後才能播放）
    Sound.setMuted(!!state.muted);
    var mapSound = $('#map-sound', game);
    function syncSoundBtn() {
      mapSound.textContent = state.muted ? '🔇 聲音：關' : '🔊 聲音：開';
      els.hudSound.textContent = state.muted ? '🔇' : '🔊';
      els.hudSound.setAttribute('aria-label', state.muted ? '開啟聲音' : '關閉聲音');
      els.hudSound.setAttribute('aria-pressed', String(!state.muted));
    }
    syncSoundBtn();
    game.addEventListener('pointerdown', function () { Sound.init(); }, true);
    game.addEventListener('keydown', function () { Sound.init(); }, true);
    function toggleSound() {
      state.muted = !state.muted;
      Sound.setMuted(state.muted);
      save();
      syncSoundBtn();
      if (!state.muted) Sound.play('click');
    }
    els.hudSound.addEventListener('click', toggleSound);
    mapSound.addEventListener('click', toggleSound);

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
