(function () {
  'use strict';

  /* =========================================================
   * 情境挑戰：以 SVG 動畫呈現災害情境，播放後出題，
   * 選擇後播放結果動畫並顯示解說。
   * ========================================================= */

  var PLAY_MS = 2600;      // 情境播放時間
  var ANSWER_SEC = 15;     // 作答時間
  var RESULT_MS = 1300;    // 結果動畫播放後才顯示解說
  var BEST_KEY = 'disaster-quiz-best';

  /* ---------- 場景元件 ---------- */

  // 人物（腳底在原點），可移動與蹲下
  function person(x, y) {
    return '' +
      '<g transform="translate(' + x + ' ' + y + ')">' +
        '<g class="actor person">' +
          '<g class="legs-straight" stroke="#2d3a4a" stroke-width="4" stroke-linecap="round">' +
            '<line x1="-4" y1="-16" x2="-6" y2="0"/><line x1="4" y1="-16" x2="6" y2="0"/>' +
          '</g>' +
          '<g class="legs-bent" stroke="#2d3a4a" stroke-width="4" stroke-linecap="round" fill="none">' +
            '<path d="M-4 -6 L-12 -2 L-6 0"/><path d="M4 -6 L12 -2 L6 0"/>' +
          '</g>' +
          '<g class="upper">' +
            '<rect x="-8" y="-36" width="16" height="22" rx="6" fill="#2f80ed"/>' +
            '<g class="arms-down" stroke="#f2c9a0" stroke-width="4" stroke-linecap="round">' +
              '<line x1="-8" y1="-32" x2="-12" y2="-18"/><line x1="8" y1="-32" x2="12" y2="-18"/>' +
            '</g>' +
            '<circle cy="-44" r="8" fill="#f2c9a0"/>' +
            '<path d="M-8 -46 a8 8 0 0 1 16 0 z" fill="#3b2a20"/>' +
            '<g class="arms-up" stroke="#f2c9a0" stroke-width="4" stroke-linecap="round" fill="none">' +
              '<path d="M-7 -33 Q-15 -46 -3 -53"/><path d="M7 -33 Q15 -46 3 -53"/>' +
            '</g>' +
          '</g>' +
        '</g>' +
      '</g>';
  }

  function car(x, y, cls, color) {
    return '' +
      '<g transform="translate(' + x + ' ' + y + ')">' +
        '<g class="' + cls + '">' +
          '<path d="M-24 -26 L-15 -38 H12 L22 -26 Z" fill="' + color + '"/>' +
          '<path d="M-19 -27 L-13 -35 H-2 V-27 Z M2 -27 V-35 H10 L17 -27 Z" fill="#d6ecf8"/>' +
          '<rect x="-40" y="-27" width="80" height="17" rx="5" fill="' + color + '"/>' +
          '<circle cx="-24" cy="-9" r="7" fill="#333"/><circle cx="24" cy="-9" r="7" fill="#333"/>' +
          '<circle cx="-24" cy="-9" r="3" fill="#aaa"/><circle cx="24" cy="-9" r="3" fill="#aaa"/>' +
          '<rect class="hazard fx-hidden" x="35" y="-24" width="6" height="5" rx="1" fill="#ff9f1a"/>' +
          '<rect class="hazard fx-hidden" x="-41" y="-24" width="6" height="5" rx="1" fill="#ff9f1a"/>' +
        '</g>' +
      '</g>';
  }

  function spark(x, y) {
    return '<g class="spark fx-hidden" transform="translate(' + x + ' ' + y + ')">' +
      '<path d="M0 -14 L3 -4 L13 -6 L5 1 L11 10 L1 5 L-4 14 L-4 3 L-14 4 L-6 -3 L-11 -12 L-2 -6 Z" fill="#ffd23f" stroke="#ff7a00" stroke-width="2"/>' +
      '</g>';
  }

  /* ---------- 情境資料 ---------- */

  var SCENARIOS = [
    {
      place: '在家・客廳',
      alert: '地震！搖晃非常劇烈',
      question: '你正站在客廳，突然發生強烈地震，你應該怎麼做？',
      label: '客廳裡有窗戶、桌子、高大書櫃與吊燈，人物站在房間中間，房間劇烈搖晃。',
      scene: function () {
        return '' +
          '<rect width="320" height="200" fill="#f3ead8"/>' +
          '<rect y="150" width="320" height="50" fill="#c8a97e"/>' +
          // 門
          '<rect x="8" y="62" width="44" height="88" fill="#a8774e"/><circle cx="44" cy="108" r="3" fill="#f1d36b"/>' +
          // 掛畫
          '<g class="frame"><rect x="62" y="42" width="34" height="26" fill="#fff" stroke="#7a5233" stroke-width="3"/>' +
          '<path d="M66 64 L76 52 L84 60 L88 56 L93 64 Z" fill="#7cb36b"/></g>' +
          // 吊燈
          '<g class="lamp swing"><line x1="170" y1="0" x2="170" y2="32" stroke="#555" stroke-width="2"/>' +
          '<path d="M156 46 L162 32 H178 L184 46 Z" fill="#f2b84b"/></g>' +
          // 桌子
          '<rect x="128" y="116" width="84" height="8" rx="2" fill="#6b4a2f"/>' +
          '<rect x="134" y="124" width="6" height="26" fill="#6b4a2f"/><rect x="200" y="124" width="6" height="26" fill="#6b4a2f"/>' +
          // 書櫃
          '<g class="shelf"><rect x="250" y="44" width="54" height="106" fill="#8a5a3b"/>' +
          '<rect x="254" y="48" width="46" height="98" fill="#6e452c"/>' +
          '<rect x="254" y="78" width="46" height="4" fill="#8a5a3b"/><rect x="254" y="112" width="46" height="4" fill="#8a5a3b"/>' +
          '<g class="books"><rect x="258" y="56" width="7" height="22" fill="#e05a47"/><rect x="266" y="60" width="7" height="18" fill="#4f9de0"/>' +
          '<rect x="274" y="54" width="8" height="24" fill="#f2c14e"/><rect x="284" y="90" width="7" height="22" fill="#6ac08a"/>' +
          '<rect x="262" y="94" width="9" height="18" fill="#9b6ad1"/></g></g>' +
          person(110, 150);
      },
      choices: [
        {
          text: '立刻衝出門外',
          correct: false,
          move: { x: -78 },
          effects: [{ sel: '.frame', fx: 'drop', drop: 88, rot: 40 }],
          flash: 'red',
          explain: '搖晃中奔跑很容易跌倒，也可能被掉落的掛畫、玻璃砸傷。地震時不要急著往外跑。'
        },
        {
          text: '躲到桌子下，保護頭頸部',
          correct: true,
          move: { x: 60, crouch: true },
          effects: [{ sel: '.lamp', fx: 'drop', drop: 64, rot: 15 }],
          explain: '正確！「趴下、掩護、穩住」：躲到堅固的桌子下，一手護頭頸、一手抓緊桌腳，掉落的吊燈被桌子擋住了。'
        },
        {
          text: '跑過去扶住書櫃，避免它倒下',
          correct: false,
          move: { x: 128 },
          effects: [{ sel: '.shelf', fx: 'tip', rot: -22 }, { sel: '.books', fx: 'drop', drop: 60, rot: -30 }],
          flash: 'red',
          explain: '人的力氣擋不住倒下的書櫃，靠近高大家具非常危險。平時就應該用 L 型鐵片把家具固定在牆上。'
        }
      ]
    },
    {
      place: '在家・廚房',
      alert: '煮飯時發生強烈地震',
      question: '你正在廚房煮湯，爐火還開著，這時發生強烈地震，你應該怎麼做？',
      label: '廚房爐子上有一鍋湯正在加熱，上方有吊櫃，人物站在爐子前，房間劇烈搖晃。',
      scene: function () {
        return '' +
          '<rect width="320" height="200" fill="#eef3ee"/>' +
          '<rect y="150" width="320" height="50" fill="#d9d2c5"/>' +
          '<path d="M0 165 H320 M0 182 H320 M40 150 V200 M100 150 V200 M160 150 V200 M220 150 V200 M280 150 V200" stroke="#c9c0b0" stroke-width="2"/>' +
          // 門
          '<rect x="8" y="62" width="44" height="88" fill="#9aa7b4"/><circle cx="44" cy="108" r="3" fill="#555"/>' +
          // 吊櫃
          '<rect x="170" y="26" width="130" height="42" fill="#b98b5e"/>' +
          '<g class="cab-door"><rect x="172" y="28" width="62" height="38" fill="#cfa274"/></g>' +
          '<rect x="236" y="28" width="62" height="38" fill="#cfa274"/>' +
          '<g class="jar"><rect x="196" y="12" width="16" height="14" rx="3" fill="#7fb8d9"/><rect x="194" y="9" width="20" height="4" fill="#4c7f9c"/></g>' +
          // 流理台與爐子
          '<rect x="160" y="110" width="150" height="40" fill="#b98b5e"/>' +
          '<rect x="158" y="104" width="154" height="8" fill="#e9e4dc"/>' +
          '<rect x="196" y="98" width="64" height="7" rx="2" fill="#444"/>' +
          '<g class="flame flicker"><path d="M214 98 Q218 88 222 98 Q226 86 230 98 Q234 90 238 98 Z" fill="#ff8a1f"/></g>' +
          '<g class="pot"><rect x="208" y="76" width="40" height="22" rx="4" fill="#9aa1a8"/>' +
          '<rect x="202" y="78" width="6" height="4" fill="#666"/><rect x="248" y="78" width="6" height="4" fill="#666"/></g>' +
          '<g class="steam flicker"><path d="M220 72 q-4 -6 0 -12 M230 70 q-4 -6 0 -12 M240 72 q-4 -6 0 -12" stroke="#bbb" stroke-width="2" fill="none"/></g>' +
          person(228, 150);
      },
      choices: [
        {
          text: '伸手去把爐火關掉',
          correct: false,
          move: { x: -6 },
          effects: [{ sel: '.pot', fx: 'drop', drop: 48, rot: 70 }],
          flash: 'red',
          explain: '劇烈搖晃中靠近爐火，可能被打翻的熱湯或火焰燙傷。現在多數瓦斯表遇強震會自動遮斷，應先保護自己，等搖晃停止再關火。'
        },
        {
          text: '遠離爐火，到空曠處蹲低保護頭頸',
          correct: true,
          move: { x: -128, crouch: true },
          effects: [{ sel: '.cab-door', fx: 'tip', rot: -50, origin: '0% 50%' }, { sel: '.jar', fx: 'drop', drop: 92, rot: 50 }],
          explain: '正確！廚房有熱湯、刀具和吊櫃，是危險區域。先遠離爐火與吊櫃，蹲低護住頭頸，搖晃停止後再關火。'
        },
        {
          text: '跑去打開大門，確保逃生出口',
          correct: false,
          move: { x: -196 },
          effects: [{ sel: '.cab-door', fx: 'tip', rot: -50, origin: '0% 50%' }, { sel: '.jar', fx: 'drop', drop: 92, rot: 50 }],
          flash: 'red',
          explain: '搖晃中移動容易跌倒受傷。開門保留出口是搖晃停止後再做的事，地震當下要先就地保護自己。'
        }
      ]
    },
    {
      place: '大樓・電梯內',
      alert: '電梯運行中發生地震',
      question: '你一個人在電梯裡，突然感覺到強烈搖晃，你應該怎麼做？',
      label: '電梯內部，燈光閃爍，人物站在電梯門前，旁邊有樓層按鈕。',
      scene: function () {
        var btns = '';
        for (var i = 0; i < 6; i++) {
          btns += '<circle class="floor-btn" cx="' + (258 + (i % 2) * 14) + '" cy="' + (82 + Math.floor(i / 2) * 16) + '" r="5" fill="#e3e6ea" stroke="#777"/>';
        }
        return '' +
          '<rect width="320" height="200" fill="#b8bec7"/>' +
          '<rect y="170" width="320" height="30" fill="#7d838c"/>' +
          '<rect x="0" y="0" width="320" height="16" fill="#9aa0a8"/>' +
          '<rect class="ceiling-light flicker-fast" x="110" y="4" width="100" height="7" rx="3" fill="#fffbe0"/>' +
          '<rect x="86" y="26" width="148" height="144" fill="#6f757d"/>' +
          '<g class="door-l"><rect x="90" y="30" width="70" height="140" fill="#cfd4da"/></g>' +
          '<g class="door-r"><rect x="160" y="30" width="70" height="140" fill="#c4c9cf"/></g>' +
          '<rect x="246" y="64" width="38" height="72" rx="4" fill="#d6d9de" stroke="#888"/>' +
          btns +
          '<rect x="252" y="124" width="26" height="8" rx="2" fill="#e05a47"/>' +
          person(160, 182);
      },
      choices: [
        {
          text: '按下所有樓層按鈕，在最先停靠的樓層離開',
          correct: true,
          move: { x: 72 },
          effects: [
            { sel: '.floor-btn', fx: 'lit' },
            { sel: '.door-l', fx: 'slide', dx: -66, delay: 600 },
            { sel: '.door-r', fx: 'slide', dx: 66, delay: 600 }
          ],
          explain: '正確！按下所有樓層按鈕，電梯停靠後立刻離開，改走樓梯。若受困，按緊急通話鈕求救並保持冷靜。'
        },
        {
          text: '用力扳開電梯門爬出去',
          correct: false,
          move: { x: 0 },
          effects: [{ sel: '.door-l', fx: 'slide', dx: -10 }, { sel: '.door-r', fx: 'slide', dx: 10 }],
          flash: 'red',
          explain: '電梯可能停在樓層之間，強行扳門爬出有墜落或被夾傷的危險。應按緊急通話鈕求救，等待救援。'
        },
        {
          text: '在電梯裡跳動、拍打門求救',
          correct: false,
          move: { x: -24 },
          effects: [{ sel: '.world', fx: 'wobble' }],
          flash: 'red',
          explain: '跳動可能讓電梯更不穩定，也容易受傷。保持冷靜，按緊急通話鈕或用手機撥打 119 求救。'
        }
      ]
    },
    {
      place: '戶外・街道',
      alert: '走在街上時發生地震',
      question: '你走在人行道上，旁邊是掛滿招牌的大樓，突然發生強烈地震，你應該怎麼做？',
      label: '街道左側是掛著招牌的大樓與騎樓，中間有電線桿，右側是空曠的公園，人物站在人行道上。',
      scene: function () {
        return '' +
          '<rect width="320" height="200" fill="#cfe8f7"/>' +
          '<rect y="160" width="320" height="40" fill="#b9b4ab"/>' +
          // 公園
          '<rect x="224" y="150" width="96" height="12" fill="#8cc56f"/>' +
          '<rect x="292" y="118" width="6" height="34" fill="#7a5233"/><circle cx="295" cy="108" r="18" fill="#6aac52"/>' +
          // 大樓
          '<rect x="0" y="10" width="150" height="150" fill="#a7adb5"/>' +
          '<g fill="#dde8f0"><rect x="14" y="22" width="22" height="18"/><rect x="50" y="22" width="22" height="18"/><rect x="86" y="22" width="22" height="18"/>' +
          '<rect x="14" y="54" width="22" height="18"/><rect x="50" y="54" width="22" height="18"/><rect x="86" y="54" width="22" height="18"/></g>' +
          // 騎樓
          '<rect x="0" y="110" width="150" height="50" fill="#6f747b"/>' +
          '<rect x="40" y="110" width="8" height="50" fill="#a7adb5"/><rect x="100" y="110" width="8" height="50" fill="#a7adb5"/>' +
          // 招牌
          '<g class="sign1 wobble-soft"><rect x="120" y="44" width="44" height="22" fill="#e05a47"/><rect x="126" y="50" width="32" height="10" fill="#fff3"/></g>' +
          '<g class="sign2 wobble-soft"><rect x="60" y="84" width="54" height="20" fill="#f2c14e"/><rect x="66" y="90" width="42" height="8" fill="#fff5"/></g>' +
          // 電線桿
          '<g class="pole"><rect x="194" y="30" width="8" height="132" fill="#7d6a58"/><rect x="180" y="40" width="36" height="5" fill="#5e4f42"/>' +
          '<path d="M182 42 Q250 60 320 44 M214 42 Q270 64 320 56" stroke="#333" stroke-width="1.5" fill="none"/></g>' +
          spark(214, 46) +
          person(176, 162);
      },
      choices: [
        {
          text: '躲進大樓的騎樓下',
          correct: false,
          move: { x: -100 },
          effects: [{ sel: '.sign2', fx: 'drop', drop: 54, rot: 20 }],
          flash: 'red',
          explain: '騎樓上方的招牌、磁磚、外牆和玻璃可能掉落。在戶外應遠離建築物，不要躲在騎樓下。'
        },
        {
          text: '走到空曠的地方，蹲低保護頭部',
          correct: true,
          move: { x: 80, crouch: true },
          effects: [{ sel: '.sign1', fx: 'drop', drop: 90, rot: 35 }],
          explain: '正確！在戶外要遠離建築物、招牌、電線桿與圍牆，到空曠處蹲低護住頭部，等搖晃停止。'
        },
        {
          text: '抱住電線桿穩住身體',
          correct: false,
          move: { x: 16 },
          effects: [{ sel: '.pole', fx: 'tip', rot: 10 }, { sel: '.spark', fx: 'blink' }],
          flash: 'orange',
          explain: '電線桿可能傾倒，斷落的電線還有觸電危險。應遠離電線桿與電線。'
        }
      ]
    },
    {
      place: '地震過後・家中',
      alert: '搖晃停止了，但聞到瓦斯味',
      question: '地震剛停止，你在家裡聞到濃濃的瓦斯味，你應該怎麼做？',
      label: '地震後的昏暗廚房，空氣中飄著瓦斯，牆上有電燈開關，右邊是窗戶與大門。',
      quake: false,
      scene: function () {
        var gas = '';
        for (var i = 0; i < 5; i++) {
          gas += '<path class="gas-wave" style="animation-delay:' + (i * -0.6) + 's" d="M' + (30 + i * 50) + ' ' + (120 - (i % 2) * 30) +
            ' q10 -10 20 0 t20 0 t20 0" stroke="#7bc96f" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>';
        }
        return '' +
          '<rect width="320" height="200" fill="#c9c4b8"/>' +
          '<rect y="150" width="320" height="50" fill="#a59d8e"/>' +
          // 爐子
          '<rect x="10" y="110" width="80" height="40" fill="#8f7a62"/><rect x="8" y="104" width="84" height="8" fill="#d7d0c4"/>' +
          '<rect x="24" y="98" width="52" height="7" rx="2" fill="#444"/>' +
          // 開關
          '<rect x="104" y="86" width="12" height="18" rx="2" fill="#f4f1ea" stroke="#888"/><rect x="108" y="90" width="4" height="6" fill="#999"/>' +
          spark(110, 90) +
          // 窗戶
          '<rect x="190" y="40" width="56" height="50" fill="#6f7f8f" stroke="#7a5233" stroke-width="4"/>' +
          '<g class="window-open fx-hidden"><rect x="192" y="42" width="52" height="46" fill="#bfe3f5"/></g>' +
          // 門
          '<rect x="262" y="62" width="46" height="88" fill="#a8774e"/>' +
          '<g class="door-open fx-hidden"><rect x="262" y="62" width="46" height="88" fill="#fdf6d8"/></g>' +
          '<g class="gas">' + gas + '</g>' +
          '<rect class="dim" width="320" height="200" fill="#000" opacity=".18"/>' +
          spark(170, 104).replace('class="spark', 'class="spark phone-spark') +
          person(160, 150);
      },
      choices: [
        {
          text: '打開電燈，看清楚哪裡漏氣',
          correct: false,
          move: { x: -40 },
          effects: [{ sel: '.spark:not(.phone-spark)', fx: 'blink' }],
          flash: 'orange',
          explain: '開關電燈或電器可能產生火花，引燃外洩的瓦斯造成氣爆。聞到瓦斯味時，絕對不要碰任何電器開關。'
        },
        {
          text: '不碰電器，打開門窗、關閉瓦斯總開關後離開',
          correct: true,
          move: { x: 124 },
          effects: [
            { sel: '.window-open', fx: 'show' },
            { sel: '.door-open', fx: 'show', delay: 400 },
            { sel: '.gas', fx: 'fade', delay: 300 },
            { sel: '.dim', fx: 'fade' }
          ],
          explain: '正確！不碰任何電器，輕輕打開門窗通風，關閉瓦斯總開關，離開屋子到安全的地方後再撥打 119。'
        },
        {
          text: '馬上在屋內用手機打電話報案',
          correct: false,
          move: { x: 0 },
          effects: [{ sel: '.phone-spark', fx: 'blink' }],
          flash: 'orange',
          explain: '在瓦斯濃度高的地方使用手機也可能產生火花。應先打開門窗、離開屋子，到室外安全處再撥打 119。'
        }
      ]
    },
    {
      place: '道路・開車中',
      alert: '開車時發生強烈地震',
      question: '你正在開車，前方不遠處就是一座橋，突然發生強烈地震，你應該怎麼做？',
      label: '汽車在道路上行駛，前方有一座橋，車子劇烈搖晃。',
      road: true,
      scene: function () {
        return '' +
          '<rect width="320" height="200" fill="#cfe8f7"/>' +
          '<path d="M0 140 Q60 110 120 132 T240 120 T320 128 V150 H0 Z" fill="#9ccc82"/>' +
          '<rect y="146" width="320" height="40" fill="#5b6066"/>' +
          '<rect y="186" width="320" height="14" fill="#9ccc82"/>' +
          '<rect y="182" width="320" height="4" fill="#d9d9d9"/>' +
          '<g class="road-lines"><path d="M-40 165 H360" stroke="#f5f5f5" stroke-width="3" stroke-dasharray="20 20"/></g>' +
          // 橋
          '<g class="bridge"><path d="M232 146 V128 H320 V146" fill="#8e959d"/>' +
          '<path d="M240 128 Q276 70 312 128" stroke="#c0392b" stroke-width="5" fill="none"/>' +
          '<path d="M252 128 V104 M264 128 V90 M276 128 V86 M288 128 V90 M300 128 V104" stroke="#c0392b" stroke-width="2"/></g>' +
          '<g class="crack fx-hidden"><path d="M268 128 L274 138 L266 144 L276 152 L270 160" stroke="#222" stroke-width="3" fill="none"/></g>' +
          car(-60, 178, 'car2', '#e05a47') +
          car(100, 178, 'actor car', '#2f80ed');
      },
      choices: [
        {
          text: '立刻踩死煞車，停在路中間',
          correct: false,
          move: { x: 0 },
          effects: [{ sel: '.car2', fx: 'slide', dx: 76 }],
          flash: 'red',
          explain: '突然急煞可能被後方來車追撞。應打雙黃燈提醒後車，慢慢減速靠邊停車。'
        },
        {
          text: '打雙黃燈，慢慢靠邊停車並留在車內',
          correct: true,
          move: { x: 30, y: 10 },
          effects: [{ sel: '.hazard', fx: 'blink' }],
          explain: '正確！打雙黃燈、慢慢減速靠路邊停車，留在車內收聽廣播。若需離開，鑰匙留在車上、車門不上鎖，方便救援移車。'
        },
        {
          text: '加速衝過前方的橋',
          correct: false,
          move: { x: 170, y: -26 },
          effects: [{ sel: '.crack', fx: 'show', delay: 500 }],
          flash: 'orange',
          explain: '橋樑與隧道在地震中可能受損或坍塌，應避免在地震時通過，盡快在安全的路邊停車。'
        }
      ]
    }
  ];

  /* ---------- 工具 ---------- */

  function $(sel, root) { return (root || document).querySelector(sel); }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function loadBest() {
    try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) { return 0; }
  }

  function saveBest(score) {
    try { localStorage.setItem(BEST_KEY, String(score)); } catch (e) { /* 忽略 */ }
  }

  /* ---------- 主程式 ---------- */

  function initQuiz() {
    var root = $('.quiz');
    if (!root) return;

    var els = {
      start: $('.quiz-start', root),
      play: $('.quiz-play', root),
      end: $('.quiz-end', root),
      best: $('#quiz-best', root),
      progress: $('#quiz-progress', root),
      score: $('#quiz-score', root),
      stage: $('.stage', root),
      caption: $('.stage-caption', root),
      badge: $('.stage-badge', root),
      timer: $('.timer', root),
      timerFill: $('.timer-fill', root),
      question: $('.quiz-q', root),
      choices: $('.choices', root),
      feedback: $('.feedback', root),
      feedbackTitle: $('.feedback-title', root),
      feedbackText: $('.feedback-text', root),
      next: $('#quiz-next', root),
      replay: $('#quiz-replay', root),
      finalScore: $('#quiz-final', root),
      finalMsg: $('#quiz-final-msg', root),
      review: $('.quiz-review', root)
    };

    var order = [];
    var index = 0;
    var score = 0;
    var answers = [];
    var timers = [];

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function showBest() {
      var best = loadBest();
      els.best.textContent = best ? '最佳紀錄：' + best + ' / ' + SCENARIOS.length + ' 題' : '';
    }

    function setView(view) {
      els.start.hidden = view !== 'start';
      els.play.hidden = view !== 'play';
      els.end.hidden = view !== 'end';
    }

    function start() {
      order = shuffle(SCENARIOS);
      index = 0;
      score = 0;
      answers = [];
      setView('play');
      els.stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      playScene();
    }

    function playScene() {
      clearTimers();
      var s = order[index];

      els.progress.textContent = (index + 1) + ' / ' + order.length;
      els.score.textContent = score;
      els.question.textContent = s.question;
      els.question.hidden = true;
      els.choices.innerHTML = '';
      els.feedback.hidden = true;
      els.timer.hidden = true;
      els.badge.className = 'stage-badge';
      els.badge.textContent = '';
      els.replay.hidden = false;

      var svg = $('svg', els.stage);
      svg.setAttribute('aria-label', s.place + '：' + s.label);
      svg.innerHTML = '<g class="world">' + s.scene() + '</g>' +
        '<rect class="flash" width="320" height="200" fill="#fff"/>';

      els.stage.className = 'stage playing' +
        (s.quake === false ? '' : ' quake-strong') +
        (s.road ? ' driving' : '');

      els.caption.innerHTML = '<span class="rec"><i>●</i> 情境 ' + (index + 1) + '・' + s.place + '</span>' +
        '<strong>' + s.alert + '</strong>';

      if (s.quake !== false && navigator.vibrate) navigator.vibrate([300, 120, 400]);

      later(askQuestion, PLAY_MS);
    }

    function askQuestion() {
      var s = order[index];
      els.stage.classList.remove('playing', 'quake-strong');
      if (s.quake !== false) els.stage.classList.add('quake-soft');

      els.question.hidden = false;
      shuffle(s.choices).forEach(function (choice, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'choice';
        btn.innerHTML = '<span class="choice-key">' + 'ABC'.charAt(i) + '</span><span></span>';
        btn.lastChild.textContent = choice.text;
        btn.addEventListener('click', function () { answer(choice, btn); });
        els.choices.appendChild(btn);
      });

      // 倒數計時
      els.timer.hidden = false;
      els.timerFill.style.transition = 'none';
      els.timerFill.style.width = '100%';
      els.timerFill.classList.remove('low');
      void els.timerFill.offsetWidth;
      els.timerFill.style.transition = 'width ' + ANSWER_SEC + 's linear';
      els.timerFill.style.width = '0%';
      later(function () { els.timerFill.classList.add('low'); }, (ANSWER_SEC - 5) * 1000);
      later(function () { answer(null, null); }, ANSWER_SEC * 1000);

      var first = $('.choice', els.choices);
      if (first) first.focus({ preventScroll: true });
    }

    function answer(choice, btn) {
      clearTimers();
      els.replay.hidden = true;
      var s = order[index];
      var correctChoice = s.choices.filter(function (c) { return c.correct; })[0];
      var isCorrect = !!(choice && choice.correct);

      // 停住計時條
      els.timerFill.style.width = getComputedStyle(els.timerFill).width;
      els.timerFill.style.transition = 'none';

      Array.prototype.forEach.call(els.choices.children, function (b) {
        b.disabled = true;
        if (b.lastChild.textContent === correctChoice.text) b.classList.add('is-correct');
      });
      if (btn && !isCorrect) btn.classList.add('is-wrong');

      if (isCorrect) score++;
      answers.push({ scenario: s, choice: choice, correct: isCorrect });

      if (choice) runResult(choice);

      later(function () {
        els.stage.classList.remove('quake-soft');
        els.badge.textContent = isCorrect ? '✓' : '✗';
        els.badge.className = 'stage-badge show ' + (isCorrect ? 'ok' : 'bad');
        els.score.textContent = score;

        els.feedback.hidden = false;
        els.feedback.className = 'feedback ' + (isCorrect ? 'ok' : 'bad');
        if (!choice) {
          els.feedbackTitle.textContent = '⏰ 時間到！';
          els.feedbackText.textContent = '災害發生時要立刻反應。正確做法是「' + correctChoice.text + '」。' + correctChoice.explain.replace(/^正確！/, '');
        } else {
          els.feedbackTitle.textContent = isCorrect ? '答對了！' : '這樣做很危險！';
          els.feedbackText.textContent = choice.explain;
        }
        els.next.textContent = index < order.length - 1 ? '下一題 →' : '看結果';
        els.next.focus({ preventScroll: true });
      }, choice ? RESULT_MS : 300);
    }

    function runResult(choice) {
      var svg = $('svg', els.stage);
      els.stage.classList.add('result');

      var actor = $('.actor', svg);
      if (actor && choice.move) {
        actor.style.transform = 'translate(' + (choice.move.x || 0) + 'px,' + (choice.move.y || 0) + 'px)';
        if (choice.move.crouch) later(function () { actor.classList.add('crouch'); }, 500);
      }

      (choice.effects || []).forEach(function (e) {
        later(function () {
          Array.prototype.forEach.call(svg.querySelectorAll(e.sel), function (el, i) {
            if (e.drop) el.style.setProperty('--drop', e.drop + 'px');
            if (e.rot) el.style.setProperty('--rot', e.rot + 'deg');
            if (e.dx) el.style.setProperty('--dx', e.dx + 'px');
            if (e.origin) el.style.setProperty('--origin', e.origin);
            if (e.fx === 'lit') el.style.animationDelay = (i * 80) + 'ms';
            el.classList.add('fx-' + e.fx);
          });
        }, 350 + (e.delay || 0));
      });

      if (choice.flash) {
        later(function () {
          var flash = $('.flash', svg);
          flash.setAttribute('fill', choice.flash === 'orange' ? '#ff9a1f' : '#e53935');
          flash.classList.add('on');
        }, 800);
      }
    }

    function next() {
      index++;
      if (index < order.length) {
        playScene();
        els.stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        finish();
      }
    }

    function finish() {
      clearTimers();
      setView('end');
      var total = order.length;
      if (score > loadBest()) saveBest(score);
      showBest();

      els.finalScore.textContent = score + ' / ' + total;
      els.finalMsg.textContent =
        score === total ? '太厲害了！你是防災達人 🏅' :
        score >= total - 2 ? '很不錯！再複習一下答錯的題目吧。' :
        '別灰心，看看下面的解說，再挑戰一次！';

      els.review.innerHTML = '';
      answers.forEach(function (a) {
        var li = document.createElement('li');
        li.className = a.correct ? 'ok' : 'bad';
        var correctChoice = a.scenario.choices.filter(function (c) { return c.correct; })[0];
        var title = document.createElement('strong');
        title.textContent = (a.correct ? '✓ ' : '✗ ') + a.scenario.place;
        var detail = document.createElement('span');
        detail.textContent = '正確做法：' + correctChoice.text;
        li.appendChild(title);
        li.appendChild(detail);
        els.review.appendChild(li);
      });
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    $('#quiz-start', root).addEventListener('click', start);
    $('#quiz-again', root).addEventListener('click', start);
    els.next.addEventListener('click', next);
    els.replay.addEventListener('click', playScene);

    showBest();
  }

  document.addEventListener('DOMContentLoaded', initQuiz);
})();
