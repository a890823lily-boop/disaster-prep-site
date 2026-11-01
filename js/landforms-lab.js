(function () {
  'use strict';

  /* =========================================================
   * 地形實驗室：五下自然「大地如何變動」互動模擬器
   * A 土壤沉降瓶（2-1）、B 流水侵蝕實驗台（2-2）、
   * C 曲流演變（2-3）、D 海岸演化與突堤效應（2-4）
   * ========================================================= */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 分頁 ---------- */
  function initTabs() {
    var tabs = $$('.lab-tab');
    var active = null;
    function show(id) {
      tabs.forEach(function (t) {
        var on = t.dataset.lab === id;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        $('#lab-' + t.dataset.lab).hidden = !on;
      });
      if (active && LABS[active] && LABS[active].pause) LABS[active].pause();
      active = id;
      if (LABS[id] && LABS[id].show) LABS[id].show();
      try { history.replaceState(null, '', '#' + id); } catch (e) { /* 忽略 */ }
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t.dataset.lab); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); show(n.dataset.lab); n.focus(); }
      });
    });
    var start = (location.hash || '').replace('#', '');
    show(LABS[start] ? start : 'soil');
    window.addEventListener('hashchange', function () {
      var h = location.hash.replace('#', '');
      if (LABS[h] && h !== active) show(h);
    });
  }

  var LABS = {};

  /* =========================================================
   * A. 土壤沉降瓶
   * ========================================================= */
  LABS.soil = (function () {
    var TYPES = {
      gravel: { name: '礫石', r: 3.2, v: 160, color: '#6f655c' },
      sand: { name: '砂', r: 1.9, v: 48, color: '#d4b07a' },
      silt: { name: '粉砂', r: 1.2, v: 6, color: '#a88b68' },
      clay: { name: '黏土', r: 0.85, v: 0.8, color: '#8a6a58' },
      humus: { name: '腐植質', r: 1.7, v: -5, color: '#3b2a1e' }
    };
    var ORDER = ['gravel', 'sand', 'silt', 'clay'];
    var SAMPLES = {
      garden: { name: '花圃土', parts: { gravel: 8, sand: 37, silt: 30, clay: 20, humus: 5 } },
      river: { name: '河邊砂土', parts: { gravel: 25, sand: 58, silt: 10, clay: 5, humus: 2 } },
      paddy: { name: '稻田黏土', parts: { gravel: 2, sand: 13, silt: 30, clay: 50, humus: 5 } }
    };

    var J = { x0: 40, x1: 200, top: 46, water: 62, bottom: 330 }; // 瓶子內部
    var BIN = 2, BINS = (J.x1 - J.x0) / BIN;
    var canvas, ctx, parts = [], cols, deposited, factor, simT = 0, speed = 20, running = false, raf = 0, last = 0, sampleId = 'garden', settledShown = false;

    function setup() {
      canvas = $('#soil-canvas');
      ctx = canvas.getContext('2d');
      $$('input[name="soil-sample"]').forEach(function (r) {
        r.addEventListener('change', function () { sampleId = r.value; reset(); });
      });
      $('#soil-shake').addEventListener('click', shake);
      $('#soil-speed').addEventListener('change', function () { speed = +this.value; });
      $('#soil-reveal').addEventListener('click', reveal);
      reset();
    }

    function reset() {
      parts = [];
      cols = new Float32Array(BINS);
      deposited = { gravel: 0, sand: 0, silt: 0, clay: 0, humus: 0 };
      simT = 0;
      settledShown = false;
      running = false;
      $('#soil-result').hidden = true;
      $('#soil-time').textContent = '按「搖一搖」開始';
      draw();
    }

    function shake() {
      var P = SAMPLES[sampleId].parts;
      parts = [];
      cols = new Float32Array(BINS);
      deposited = { gravel: 0, sand: 0, silt: 0, clay: 0, humus: 0 };
      var total = 1500, area = 0;
      Object.keys(P).forEach(function (k) {
        var n = Math.round(total * P[k] / 100);
        for (var i = 0; i < n; i++) {
          var T = TYPES[k];
          parts.push({ k: k, x: J.x0 + 4 + Math.random() * (J.x1 - J.x0 - 8), y: J.water + 6 + Math.random() * (J.bottom - J.water - 12), r: T.r * (0.8 + Math.random() * 0.4), v: T.v * (0.75 + Math.random() * 0.5), done: false });
          if (k !== 'humus') area += Math.pow(T.r * 2, 2);
        }
      });
      // 讓全部沉積物大約堆到 120px 高
      factor = 120 * (J.x1 - J.x0) / area;
      simT = 0;
      settledShown = false;
      $('#soil-result').hidden = true;
      canvas.classList.remove('shaking');
      void canvas.offsetWidth;
      canvas.classList.add('shaking');
      running = true;
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    }

    function tick(t) {
      var dt = Math.min(0.05, (t - last) / 1000) * speed;
      last = t;
      simT += dt;
      var moving = 0;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.done) continue;
        p.y += p.v * dt;
        p.x += (Math.random() - 0.5) * 0.6 * Math.min(1, dt * 3);
        p.x = clamp(p.x, J.x0 + 2, J.x1 - 2);
        if (p.k === 'humus') {
          if (p.y <= J.water + 2) { p.y = J.water + 1 + Math.random() * 3; p.done = true; }
          else moving++;
          continue;
        }
        var b = clamp(Math.floor((p.x - J.x0) / BIN), 0, BINS - 1);
        var floor = J.bottom - cols[b];
        if (p.y + p.r >= floor) {
          p.y = floor - p.r * 0.6;
          p.done = true;
          // 沉積物在瓶底平均鋪開，每一層保持水平（add 是鋪滿整個瓶寬時增加的厚度）
          var add = Math.pow(p.r * 2, 2) * factor / (J.x1 - J.x0);
          for (var j = 0; j < BINS; j++) cols[j] += add;
          deposited[p.k] += add;
        } else {
          moving++;
        }
      }
      draw();
      var minutes = simT;
      $('#soil-time').textContent = '模擬經過：' + (minutes < 60 ? Math.round(minutes) + ' 分鐘' : (minutes / 60).toFixed(1) + ' 小時');
      if (moving === 0 || simT > 600) {
        running = false;
        $('#soil-time').textContent += '　✅ 全部沉澱完成';
        if (!settledShown) { settledShown = true; reveal(); }
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    function turbidity() {
      var susp = 0, n = 0;
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].k === 'clay' || parts[i].k === 'silt') { n++; if (!parts[i].done) susp++; }
      }
      return n ? susp / n : 0;
    }

    function draw() {
      var c = ctx;
      c.clearRect(0, 0, canvas.width, canvas.height);
      // 瓶子
      c.fillStyle = '#eef6fb';
      c.fillRect(J.x0 - 6, J.top - 10, J.x1 - J.x0 + 12, J.bottom - J.top + 16);
      // 水
      var tb = parts.length ? turbidity() : 0;
      c.fillStyle = 'rgba(120, 180, 220, 0.35)';
      c.fillRect(J.x0, J.water, J.x1 - J.x0, J.bottom - J.water);
      c.fillStyle = 'rgba(140, 105, 80,' + (tb * 0.75).toFixed(3) + ')';
      c.fillRect(J.x0, J.water, J.x1 - J.x0, J.bottom - J.water);
      // 顆粒
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        c.fillStyle = TYPES[p.k].color;
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fill();
      }
      // 瓶身外框與刻度
      c.strokeStyle = '#7a8a99';
      c.lineWidth = 3;
      c.strokeRect(J.x0 - 6, J.top - 10, J.x1 - J.x0 + 12, J.bottom - J.top + 16);
      c.fillStyle = '#9aa7b3';
      c.fillRect(J.x0 - 10, J.top - 22, J.x1 - J.x0 + 20, 12);
      c.fillStyle = '#5f6b7a';
      c.font = '11px sans-serif';
      for (var cm = 0; cm <= 12; cm++) {
        var y = J.bottom - cm * 10;
        c.fillRect(J.x1 + 8, y, cm % 5 === 0 ? 10 : 5, 1);
        if (cm % 5 === 0) c.fillText(cm + ' cm', J.x1 + 22, y + 4);
      }
      if (settledShown) drawLayers();
    }

    function drawLayers() {
      var c = ctx, y = J.bottom;
      ORDER.forEach(function (k) {
        var h = deposited[k];
        if (h < 1) return;
        var mid = y - h / 2;
        c.strokeStyle = '#1f2933';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(J.x1 + 6, y - 1); c.lineTo(J.x1 + 60, y - 1);
        c.stroke();
        c.fillStyle = '#1f2933';
        c.font = 'bold 12px sans-serif';
        c.fillText(TYPES[k].name, J.x1 + 66, mid + 4);
        y -= h;
      });
    }

    function reveal() {
      if (!parts.length) return;
      var box = $('#soil-result');
      var P = SAMPLES[sampleId].parts;
      var html = '<p><strong>' + SAMPLES[sampleId].name + '</strong>的組成（體積百分比）：</p><ul class="bars">';
      ['gravel', 'sand', 'silt', 'clay', 'humus'].forEach(function (k) {
        html += '<li><span class="bar-label">' + TYPES[k].name + '</span><span class="bar"><span style="width:' + P[k] * 1.6 + '%;background:' + TYPES[k].color + '"></span></span><span class="bar-val">' + P[k] + '%</span></li>';
      });
      html += '</ul><p class="note">顆粒越大、越重，沉得越快，所以由下往上依序是礫石 → 砂 → 粉砂 → 黏土；腐植質比水輕，會浮在水面。黏土顆粒非常細，要好幾個小時才沉得下來，所以水會混濁很久。</p>';
      box.innerHTML = html;
      box.hidden = false;
      settledShown = true;
      draw();
    }

    return { setup: setup, pause: function () { cancelAnimationFrame(raf); running = false; } };
  })();

  /* =========================================================
   * B. 流水侵蝕實驗台
   * ========================================================= */
  LABS.water = (function () {
    var W = 640, H = 300, N = 150, DX = 4, X0 = 20, SLOPE_END = 100, BASE = 282;
    var canvas, ctx, h, h0, tray, t = 0, running = false, raf = 0, last = 0, drops = [], collected = 0, trials = [];
    var cfg = {};
    var SLOPES = { 1: { name: '緩', drop: 60 }, 2: { name: '中', drop: 115 }, 3: { name: '陡', drop: 175 } };
    var FLOWS = { 1: { name: '小', q: 0.6 }, 2: { name: '中', q: 1 }, 3: { name: '大', q: 1.6 } };
    var DURATION = 8; // 模擬秒數

    function read() {
      cfg = {
        slope: +$('#w-slope').value,
        flow: +$('#w-flow').value,
        veg: $('#w-veg').checked,
        coarse: $('#w-coarse').checked
      };
      $('#w-slope-val').textContent = SLOPES[cfg.slope].name;
      $('#w-flow-val').textContent = FLOWS[cfg.flow].name;
    }

    function setup() {
      canvas = $('#water-canvas');
      ctx = canvas.getContext('2d');
      ['#w-slope', '#w-flow', '#w-veg', '#w-coarse'].forEach(function (s) {
        $(s).addEventListener('input', function () { if (!running) { read(); build(); draw(); } });
      });
      $('#w-run').addEventListener('click', run);
      $('#w-reset').addEventListener('click', function () { read(); build(); draw(); });
      $('#w-clear').addEventListener('click', function () { trials = []; renderTrials(); });
      read();
      build();
      draw();
      renderTrials();
    }

    function build() {
      h = new Float32Array(N);
      var drop = SLOPES[cfg.slope].drop;
      for (var i = 0; i < N; i++) {
        if (i <= SLOPE_END) h[i] = 24 + drop * (1 - i / SLOPE_END);
        else h[i] = 8;
      }
      h0 = Float32Array.from(h);
      tray = new Float32Array(N);
      collected = 0;
      t = 0;
      drops = [];
      $('#w-status').textContent = '設定好變因後，按「開始澆水」。';
    }

    function run() {
      if (running) return;
      read();
      build();
      running = true;
      $('#w-run').disabled = true;
      setControls(true);
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    function setControls(dis) {
      ['#w-slope', '#w-flow', '#w-veg', '#w-coarse', '#w-reset'].forEach(function (s) { $(s).disabled = dis; });
    }

    function step(dt) {
      var Q = FLOWS[cfg.flow].q;
      var vegF = cfg.veg ? 0.22 : 1;
      var grainF = cfg.coarse ? 0.45 : 1;
      var load = 0;
      for (var i = 1; i < SLOPE_END; i++) {
        var s = Math.max(0, (h[i] - h[i + 1]) / DX);
        var q = Q * (1 + i * 0.004);
        var cap = 3.2 * q * Math.pow(s, 1.1) * vegF * grainF;
        if (load < cap) {
          var e = Math.min(1.6 * (cap - load) * dt, 2.4 * dt);
          h[i] -= e;
          load += e;
        } else {
          var d = 0.6 * (load - cap) * dt;
          h[i] += d;
          load -= d;
        }
      }
      // 流到坡底的泥沙堆積在盤子裡，越靠近坡腳越厚
      collected += load;
      for (var k = SLOPE_END; k < N; k++) {
        var w = Math.exp(-(k - SLOPE_END) / 14);
        tray[k] += load * w * 0.022;
      }
      // 平滑，避免單點凹洞
      for (var r = 1; r < SLOPE_END; r++) {
        h[r] += 0.08 * (h[r - 1] + h[r + 1] - 2 * h[r]) * dt * 20;
      }
    }

    function tick(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      var sub = 4;
      for (var i = 0; i < sub; i++) step(dt / sub * 1.4);
      t += dt;
      // 水滴動畫
      if (Math.random() < FLOWS[cfg.flow].q * 0.9) drops.push({ i: 1 + Math.random() * 2, v: 0 });
      drops.forEach(function (d) {
        var ii = Math.floor(d.i);
        var s = ii < N - 1 ? Math.max(0.05, (h[ii] - h[ii + 1]) / DX) : 0.05;
        d.v = Math.min(18, d.v + s * 40 * dt + 2 * dt);
        d.i += d.v * dt;
      });
      drops = drops.filter(function (d) { return d.i < N - 2; });
      draw();
      $('#w-status').textContent = '澆水中…（' + Math.ceil(DURATION - t) + ' 秒）';
      if (t >= DURATION) return finish();
      raf = requestAnimationFrame(tick);
    }

    function gully() {
      var m = 0;
      for (var i = 1; i < SLOPE_END; i++) m = Math.max(m, h0[i] - h[i]);
      return m;
    }

    function finish() {
      running = false;
      $('#w-run').disabled = false;
      setControls(false);
      drops = [];
      draw();
      var sed = Math.round(collected * 1.5);
      var g = (gully() / 10).toFixed(1);
      var prev = trials[trials.length - 1];
      var changed = prev ? ['slope', 'flow', 'veg', 'coarse'].filter(function (k) { return prev[k] !== cfg[k]; }) : [];
      trials.push({ slope: cfg.slope, flow: cfg.flow, veg: cfg.veg, coarse: cfg.coarse, sed: sed, gully: g, changed: changed.length });
      renderTrials();
      var msg = '完成！沖到盤子的泥沙約 ' + sed + ' 單位，最深的溝約 ' + g + ' 公分。';
      if (prev && changed.length > 1) msg += '　⚠️ 這次和上一次改了 ' + changed.length + ' 個變因，比較時分不出是哪個變因造成的喔！';
      if (prev && changed.length === 0) msg += '　（變因完全相同：重複試驗可以確認結果是否穩定。）';
      $('#w-status').textContent = msg;
    }

    function renderTrials() {
      var body = $('#w-trials tbody');
      body.innerHTML = '';
      if (!trials.length) {
        body.innerHTML = '<tr><td colspan="7" class="empty">還沒有紀錄。每次澆水完成會自動記錄。</td></tr>';
        return;
      }
      var max = Math.max.apply(null, trials.map(function (r) { return r.sed; })) || 1;
      trials.forEach(function (r, i) {
        var tr = document.createElement('tr');
        if (r.changed > 1) tr.className = 'warn';
        tr.innerHTML = '<td>' + (i + 1) + '</td><td>' + SLOPES[r.slope].name + '</td><td>' + FLOWS[r.flow].name + '</td><td>' + (r.veg ? '🌱 有草' : '裸露') + '</td><td>' + (r.coarse ? '粗礫多' : '細砂') + '</td>' +
          '<td><span class="mini-bar"><span style="width:' + (r.sed / max * 100) + '%"></span></span>' + r.sed + '</td><td>' + r.gully + '</td>';
        body.appendChild(tr);
      });
    }

    function y(v) { return BASE - v; }

    function draw() {
      var c = ctx;
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#eaf4fb';
      c.fillRect(0, 0, W, H);
      // 盤子
      c.fillStyle = '#3b82f6';
      c.fillRect(X0 + SLOPE_END * DX, BASE - 2, (N - SLOPE_END) * DX, 10);
      c.fillRect(X0 + (N - 1) * DX, BASE - 40, 6, 46);
      c.fillRect(X0 - 6, BASE - 2, SLOPE_END * DX + 6, 10);
      // 原本的地表（虛線）
      c.setLineDash([4, 4]);
      c.strokeStyle = '#9ca3af';
      c.beginPath();
      for (var i = 0; i < N; i++) { var xx = X0 + i * DX; if (i === 0) c.moveTo(xx, y(h0[i])); else c.lineTo(xx, y(h0[i])); }
      c.stroke();
      c.setLineDash([]);
      // 土堆
      c.fillStyle = '#7a5a3a';
      c.beginPath();
      c.moveTo(X0, BASE);
      for (var j = 0; j < N; j++) c.lineTo(X0 + j * DX, y(j < SLOPE_END + 1 ? h[j] : 8));
      c.lineTo(X0 + (N - 1) * DX, BASE);
      c.closePath();
      c.fill();
      // 粗礫
      if (cfg.coarse) {
        c.fillStyle = '#9b8b7a';
        for (var g = 0; g < 70; g++) {
          var gi = (g * 37) % SLOPE_END, gx = X0 + gi * DX, gy = y(h[gi]) + 6 + ((g * 13) % Math.max(8, h[gi] - 10));
          if (gy < BASE - 2) { c.beginPath(); c.arc(gx, gy, 2.4, 0, 7); c.fill(); }
        }
      }
      // 盤中堆積的泥沙
      c.fillStyle = '#c9a26b';
      c.beginPath();
      c.moveTo(X0 + SLOPE_END * DX, BASE - 2);
      for (var k = SLOPE_END; k < N; k++) c.lineTo(X0 + k * DX, BASE - 2 - Math.min(48, tray[k]));
      c.lineTo(X0 + (N - 1) * DX, BASE - 2);
      c.closePath();
      c.fill();
      // 植物
      if (cfg.veg) {
        c.strokeStyle = '#3f8f3f';
        c.lineWidth = 1.6;
        for (var v = 2; v < SLOPE_END; v += 3) {
          if (h0[v] - h[v] > 7) continue;
          var vx = X0 + v * DX, vy = y(h[v]);
          c.beginPath(); c.moveTo(vx, vy); c.lineTo(vx - 2, vy - 6); c.moveTo(vx, vy); c.lineTo(vx + 2, vy - 7); c.stroke();
        }
      }
      // 水流
      if (running) {
        c.strokeStyle = 'rgba(59, 130, 246, 0.75)';
        c.lineWidth = 1 + FLOWS[cfg.flow].q * 2;
        c.beginPath();
        for (var m = 1; m < SLOPE_END; m++) { var mx = X0 + m * DX; if (m === 1) c.moveTo(mx, y(h[m]) - 1); else c.lineTo(mx, y(h[m]) - 1); }
        c.stroke();
        c.fillStyle = '#60a5fa';
        drops.forEach(function (d) {
          var ii = Math.min(N - 1, Math.floor(d.i));
          var hy = ii <= SLOPE_END ? h[ii] : 8 + tray[ii];
          c.beginPath(); c.arc(X0 + d.i * DX, y(hy) - 3, 2.2, 0, 7); c.fill();
        });
        // 澆水器
        c.fillStyle = '#e5e7eb';
        c.fillRect(X0 - 4, y(h0[0]) - 46, 26, 16);
        c.strokeStyle = '#94a3b8';
        c.strokeRect(X0 - 4, y(h0[0]) - 46, 26, 16);
      }
      // 標示
      c.fillStyle = '#1f2933';
      c.font = 'bold 12px sans-serif';
      c.fillText('坡度：' + SLOPES[cfg.slope].name, X0 + 4, 20);
      c.fillText('收集盤', X0 + (SLOPE_END + 18) * DX, BASE + 18 > H ? BASE - 46 : BASE - 46);
    }

    return { setup: setup, pause: function () { /* 實驗跑完會自動停止 */ } };
  })();

  /* =========================================================
   * C. 曲流演變
   * ========================================================= */
  LABS.meander = (function () {
    var W = 640, H = 360, SP = 7, WIDTH = 9;
    var canvas, ctx, pts, oxbows, scars, steps, running = false, raf = 0, speed = 2, showLabels = true, cutCount = 0, humanCuts = [];

    function setup() {
      canvas = $('#meander-canvas');
      ctx = canvas.getContext('2d');
      $('#m-play').addEventListener('click', toggle);
      $('#m-reset').addEventListener('click', function () { reset(); draw(); });
      $('#m-speed').addEventListener('input', function () { speed = +this.value; });
      $('#m-labels').addEventListener('change', function () { showLabels = this.checked; draw(); });
      $('#m-cut').addEventListener('click', humanCut);
      reset();
      draw();
    }

    function reset() {
      pts = [];
      for (var x = 10; x <= W - 10; x += SP) {
        pts.push({ x: x, y: H / 2 + 30 * Math.sin(x / 48 + Math.random() * 0.2) + (Math.random() - 0.5) * 3 });
      }
      oxbows = [];
      scars = [];
      humanCuts = [];
      steps = 0;
      cutCount = 0;
      updateInfo();
    }

    function toggle() {
      running = !running;
      $('#m-play').textContent = running ? '⏸ 暫停' : '▶ 播放';
      if (running) raf = requestAnimationFrame(loop);
    }

    function curvatures() {
      var n = pts.length, k = new Float32Array(n);
      for (var i = 1; i < n - 1; i++) {
        var a1 = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x);
        var a2 = Math.atan2(pts[i + 1].y - pts[i].y, pts[i + 1].x - pts[i].x);
        var d = a2 - a1;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        k[i] = d / SP;
      }
      // 平滑並加入上游的影響：彎道會慢慢往下游移動
      var ks = new Float32Array(n);
      for (var j = 1; j < n - 1; j++) {
        var s = 0, ws = 0;
        for (var m = 0; m < 8; m++) {
          var idx = j - m;
          if (idx < 1) break;
          var w = Math.exp(-m / 3);
          s += k[idx] * w; ws += w;
        }
        ks[j] = s / ws;
      }
      return ks;
    }

    function step() {
      var n = pts.length;
      var ks = curvatures();
      var next = pts.map(function (p) { return { x: p.x, y: p.y }; });
      for (var i = 2; i < n - 2; i++) {
        var tx = pts[i + 1].x - pts[i - 1].x, ty = pts[i + 1].y - pts[i - 1].y;
        var len = Math.hypot(tx, ty) || 1;
        tx /= len; ty /= len;
        // 法線（往右側）。彎道外側（凹岸）被侵蝕而往外移
        var nx = -ty, ny = tx;
        // 靠近上下游端點的河段彎得比較慢，避免端點附近打結
        var taper = Math.min(1, i / 12, (n - 1 - i) / 12);
        var mig = (clamp(-ks[i] * 11, -0.7, 0.7) + (Math.random() - 0.5) * 0.03) * taper;
        next[i].x += nx * mig;
        next[i].y += ny * mig;
        next[i].y = clamp(next[i].y, 28, H - 28);
      }
      // 平滑：消除細小的抖動，只留下大彎道
      for (var sm = 1; sm < n - 1; sm++) {
        next[sm].x += 0.05 * (next[sm - 1].x + next[sm + 1].x - 2 * next[sm].x);
        next[sm].y += 0.05 * (next[sm - 1].y + next[sm + 1].y - 2 * next[sm].y);
      }
      // 端點固定
      next[0] = pts[0]; next[n - 1] = pts[n - 1];
      pts = resample(next);
      checkCutoff();
      steps++;
      if (steps % 40 === 0) {
        scars.push(pts.map(function (p) { return { x: p.x, y: p.y }; }));
        if (scars.length > 5) scars.shift();
      }
      oxbows.forEach(function (o) { o.age++; });
      oxbows = oxbows.filter(function (o) { return o.age < 500; });
      if (oxbows.length > 6) oxbows.shift();
    }

    function resample(list) {
      var out = [list[0]], acc = 0;
      for (var i = 1; i < list.length; i++) {
        var a = list[i - 1], b = list[i];
        var seg = Math.hypot(b.x - a.x, b.y - a.y);
        var start = 0;
        while (acc + seg - start >= SP) {
          var need = SP - acc;
          start += need;
          var r = start / seg;
          out.push({ x: a.x + (b.x - a.x) * r, y: a.y + (b.y - a.y) * r });
          acc = 0;
        }
        acc += seg - start;
      }
      out[out.length] = list[list.length - 1];
      return out;
    }

    function checkCutoff() {
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 14; j < pts.length; j++) {
          var d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < WIDTH * 1.6) {
            cut(i, j, false);
            return;
          }
        }
      }
    }

    function cut(i, j, human) {
      oxbows.push({ pts: pts.slice(i, j + 1), age: 0, human: human });
      var bridge = [];
      var a = pts[i], b = pts[j], d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.round(d / SP));
      for (var k = 1; k < n; k++) bridge.push({ x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n });
      if (human) humanCuts.push({ a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } });
      pts = pts.slice(0, i + 1).concat(bridge, pts.slice(j));
      cutCount++;
      updateInfo();
      flash(human ? '🏗️ 人工截彎取直！舊河道被切斷，河水改走新的直線河道。' : '🌊 河道截彎！被切斷的彎曲河段變成了牛軛湖。');
    }

    function humanCut() {
      var best = null;
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 10; j < pts.length; j++) {
          var d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d > 70) continue;
          var score = d / (j - i);
          if (!best || score < best.s) best = { s: score, i: i, j: j };
        }
      }
      if (!best || best.s > 0.45) { flash('目前沒有彎得夠厲害的河段，可以先播放一段時間再試。'); return; }
      cut(best.i, best.j, true);
      draw();
    }

    var flashTimer;
    function flash(t) {
      var el = $('#m-msg');
      el.textContent = t;
      el.hidden = false;
      clearTimeout(flashTimer);
      flashTimer = setTimeout(function () { el.hidden = true; }, 3500);
    }

    function updateInfo() {
      $('#m-years').textContent = (steps * 5).toLocaleString();
      $('#m-oxbows').textContent = cutCount;
    }

    function loop() {
      if (!running) return;
      for (var i = 0; i < speed; i++) step();
      updateInfo();
      draw();
      raf = requestAnimationFrame(loop);
    }

    function path(list) {
      var c = ctx;
      c.beginPath();
      list.forEach(function (p, i) { if (i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y); });
    }

    function draw() {
      var c = ctx;
      c.fillStyle = '#a9d18e';
      c.fillRect(0, 0, W, H);
      // 農田格線與山邊
      c.strokeStyle = 'rgba(80, 120, 60, 0.15)';
      c.lineWidth = 1;
      for (var gx = 0; gx < W; gx += 40) { c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, H); c.stroke(); }
      for (var gy = 0; gy < H; gy += 40) { c.beginPath(); c.moveTo(0, gy); c.lineTo(W, gy); c.stroke(); }
      c.fillStyle = '#7f9e6a';
      c.fillRect(0, 0, W, 16);
      c.fillRect(0, H - 16, W, 16);
      // 舊河道痕跡
      c.lineCap = 'round';
      c.lineJoin = 'round';
      scars.forEach(function (s, i) {
        c.strokeStyle = 'rgba(120, 160, 90,' + (0.25 + i * 0.08) + ')';
        c.lineWidth = WIDTH - 2;
        path(s); c.stroke();
      });
      // 牛軛湖（越久越淤積、越淡）
      oxbows.forEach(function (o) {
        var a = 1 - o.age / 500;
        c.strokeStyle = 'rgba(74, 163, 223,' + (0.85 * a).toFixed(2) + ')';
        c.lineWidth = WIDTH * (0.5 + 0.5 * a);
        path(o.pts); c.stroke();
      });
      // 人工渠道堤防
      humanCuts.forEach(function (h) {
        c.strokeStyle = '#6b7280';
        c.setLineDash([3, 3]);
        c.lineWidth = WIDTH + 6;
        c.beginPath(); c.moveTo(h.a.x, h.a.y); c.lineTo(h.b.x, h.b.y); c.stroke();
        c.setLineDash([]);
      });
      // 凸岸沙洲
      var ks = curvatures();
      for (var i = 2; i < pts.length - 2; i += 1) {
        var k = ks[i];
        if (Math.abs(k) < 0.012) continue;
        var tx = pts[i + 1].x - pts[i - 1].x, ty = pts[i + 1].y - pts[i - 1].y, l = Math.hypot(tx, ty) || 1;
        var nx = -ty / l, ny = tx / l;
        var side = k > 0 ? 1 : -1; // 內側方向
        var r = Math.min(9, Math.abs(k) * 260);
        c.fillStyle = 'rgba(232, 211, 160, 0.9)';
        c.beginPath();
        c.arc(pts[i].x + nx * side * (WIDTH / 2 + r * 0.6), pts[i].y + ny * side * (WIDTH / 2 + r * 0.6), r, 0, 7);
        c.fill();
      }
      // 河道
      c.strokeStyle = '#3f8fd0';
      c.lineWidth = WIDTH;
      path(pts); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.lineWidth = 2;
      path(pts); c.stroke();
      // 流向箭頭
      c.fillStyle = '#e0f2fe';
      for (var a = 12; a < pts.length - 2; a += 14) {
        var p = pts[a], q = pts[a + 1], ang = Math.atan2(q.y - p.y, q.x - p.x);
        c.save(); c.translate(p.x, p.y); c.rotate(ang);
        c.beginPath(); c.moveTo(4, 0); c.lineTo(-3, -3); c.lineTo(-3, 3); c.closePath(); c.fill();
        c.restore();
      }
      if (showLabels) labels(ks);
      c.fillStyle = '#1f2933';
      c.font = 'bold 12px sans-serif';
      c.fillText('上游 →', 6, 12);
      c.fillText('→ 下游（出海口）', W - 110, H - 4);
    }

    function labels(ks) {
      // 找出最彎的幾個地方，標出凹岸與凸岸
      var cand = [];
      for (var i = 14; i < pts.length - 14; i++) {
        if (Math.abs(ks[i]) > Math.abs(ks[i - 1]) && Math.abs(ks[i]) >= Math.abs(ks[i + 1]) && Math.abs(ks[i]) > 0.02) cand.push(i);
      }
      cand.sort(function (a, b) { return Math.abs(ks[b]) - Math.abs(ks[a]); });
      var used = [];
      cand.slice(0, 6).forEach(function (i) {
        if (used.some(function (u) { return Math.abs(u - i) < 12; })) return;
        if (used.length >= 2) return;
        used.push(i);
        var tx = pts[i + 1].x - pts[i - 1].x, ty = pts[i + 1].y - pts[i - 1].y, l = Math.hypot(tx, ty) || 1;
        var nx = -ty / l, ny = tx / l, side = ks[i] > 0 ? 1 : -1;
        tag(pts[i].x - nx * side * 22, pts[i].y - ny * side * 22, '凹岸・侵蝕', '#b91c1c');
        tag(pts[i].x + nx * side * 26, pts[i].y + ny * side * 26, '凸岸・堆積', '#a16207');
      });
    }

    function tag(x, y, t, color) {
      var c = ctx;
      c.font = 'bold 11px sans-serif';
      var w = c.measureText(t).width + 10;
      x = clamp(x, w / 2 + 2, W - w / 2 - 2);
      y = clamp(y, 24, H - 20);
      c.fillStyle = 'rgba(255,255,255,0.92)';
      c.fillRect(x - w / 2, y - 9, w, 17);
      c.strokeStyle = color;
      c.strokeRect(x - w / 2, y - 9, w, 17);
      c.fillStyle = color;
      c.fillText(t, x - w / 2 + 5, y + 4);
    }

    return {
      setup: setup,
      pause: function () { running = false; $('#m-play').textContent = '▶ 播放'; },
      show: function () { draw(); }
    };
  })();

  /* =========================================================
   * D. 海岸演化與突堤效應（SVG）
   * ========================================================= */
  LABS.coast = (function () {
    var STAGES = [
      { name: '完整的岬角', desc: '堅硬的岩石伸入海中，形成岬角。岩石中有一條裂縫（節理），是海浪最容易下手的弱點。', ex: '' },
      { name: '海蝕洞', desc: '海浪不斷拍打裂縫，把岩石掏空，在崖壁底部形成海蝕洞。崖腳前方被磨平，開始出現海蝕平臺。', ex: '例：宜蘭南澳的海蝕洞' },
      { name: '海蝕門', desc: '岬角兩側的海蝕洞越挖越深，最後打通，形成像拱門一樣的海蝕門。', ex: '例：新北市野柳、鼻頭角一帶的海蝕門' },
      { name: '海蝕柱', desc: '拱門頂部承受不了重量而崩塌，外側的岩石孤立在海中，變成海蝕柱。陸地這邊留下陡峭的海蝕崖。', ex: '例：新北市金山的燭臺雙嶼' },
      { name: '殘柱', desc: '海蝕柱繼續被侵蝕，越來越矮小。海蝕崖也一直往陸地後退，海蝕平臺越來越寬。', ex: '' },
      { name: '寬廣的海蝕平臺', desc: '海蝕柱完全消失，只留下寬廣的海蝕平臺。退潮時常可看到平臺上被節理切割成一塊塊的豆腐岩。', ex: '例：新北市野柳地質公園的豆腐岩' }
    ];
    var YEARS = { soft: [0, 300, 800, 1500, 3000, 5000], hard: [0, 1500, 4000, 8000, 15000, 25000] };
    var stage = 0, hard = false, jetty = false, jt = 0;

    function setup() {
      $('#c-stage').addEventListener('input', function () { stage = +this.value; renderStage(); });
      $$('input[name="c-rock"]').forEach(function (r) { r.addEventListener('change', function () { hard = r.value === 'hard'; renderStage(); }); });
      $('#c-jetty').addEventListener('change', function () { jetty = this.checked; renderJetty(); });
      $('#c-time').addEventListener('input', function () { jt = +this.value; renderJetty(); });
      $$('.coast-subtab').forEach(function (b) {
        b.addEventListener('click', function () {
          $$('.coast-subtab').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
          $('#coast-erosion').hidden = b.dataset.sub !== 'erosion';
          $('#coast-jetty').hidden = b.dataset.sub !== 'jetty';
        });
      });
      renderStage();
      renderJetty();
    }

    function stageSVG(s) {
      // 從海上看向岬角的立面圖
      var sea = 150, cliffBack = [0, 0, 8, 26, 44, 62][s];
      var out = '<rect width="640" height="300" fill="#cfe8f7"/>' +
        '<rect y="' + sea + '" width="640" height="150" fill="#4b9bcc"/>';
      // 後方陸地與海蝕崖（隨時間後退）
      out += '<path d="M0 ' + (60 + cliffBack) + ' L250 ' + (60 + cliffBack) + ' L262 ' + sea + ' L0 ' + sea + ' Z" fill="#a98a66"/>' +
        '<path d="M0 ' + (56 + cliffBack) + ' L252 ' + (56 + cliffBack) + ' L250 ' + (64 + cliffBack) + ' L0 ' + (64 + cliffBack) + ' Z" fill="#7da35a"/>';
      // 海蝕平臺
      var plat = [0, 40, 80, 130, 190, 260][s];
      if (plat) out += '<path d="M240 ' + (sea - 2) + ' L' + (262 + plat) + ' ' + (sea - 2) + ' L' + (270 + plat) + ' ' + (sea + 6) + ' L240 ' + (sea + 6) + ' Z" fill="#8f7a5f"/>';
      if (s >= 4) {
        for (var b = 0; b < 8; b++) out += '<rect x="' + (270 + b * 26) + '" y="' + (sea - 3) + '" width="22" height="6" fill="#a08b6e" stroke="#6b5a45" stroke-width=".8"/>';
      }
      // 岬角本體
      if (s === 0) {
        out += '<path d="M250 60 L520 70 L540 ' + sea + ' L240 ' + sea + ' Z" fill="#b08f6a"/><path d="M250 56 L520 66 L520 74 L250 64 Z" fill="#7da35a"/>' +
          '<path d="M390 66 L386 100 L394 120 L388 ' + sea + '" stroke="#5b4636" stroke-width="2.5" fill="none"/>';
      } else if (s === 1) {
        out += '<path d="M250 60 L520 70 L540 ' + sea + ' L240 ' + sea + ' Z" fill="#b08f6a"/><path d="M250 56 L520 66 L520 74 L250 64 Z" fill="#7da35a"/>' +
          '<path d="M390 66 L386 100 L392 112" stroke="#5b4636" stroke-width="2.5" fill="none"/>' +
          '<path d="M366 ' + sea + ' Q366 112 390 110 Q414 112 414 ' + sea + ' Z" fill="#2b2420"/>';
      } else if (s === 2) {
        out += '<path d="M250 60 L520 70 L540 ' + sea + ' L240 ' + sea + ' Z" fill="#b08f6a"/><path d="M250 56 L520 66 L520 74 L250 64 Z" fill="#7da35a"/>' +
          '<path d="M350 ' + sea + ' Q350 96 392 94 Q434 96 434 ' + sea + ' Z" fill="#cfe8f7"/>' +
          '<rect x="350" y="' + (sea - 0) + '" width="84" height="6" fill="#4b9bcc"/>';
      } else if (s === 3) {
        out += '<path d="M250 60 L330 64 L338 ' + sea + ' L240 ' + sea + ' Z" fill="#b08f6a"/><path d="M250 56 L330 60 L330 68 L250 64 Z" fill="#7da35a"/>' +
          '<path d="M440 76 L500 78 L512 ' + sea + ' L432 ' + sea + ' Z" fill="#b08f6a"/><path d="M440 72 L500 74 L500 80 L440 78 Z" fill="#7da35a"/>' +
          '<path d="M360 ' + sea + ' l10 -8 l12 4 l6 4 z M398 ' + sea + ' l8 -6 l10 6 z" fill="#8f7a5f"/>';
      } else if (s === 4) {
        out += '<path d="M455 112 L490 114 L496 ' + sea + ' L450 ' + sea + ' Z" fill="#b08f6a"/>';
      }
      // 海浪
      out += '<g class="coast-waves"><path d="M0 ' + (sea + 8) + ' q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#e0f2fe" stroke-width="3" fill="none"/>' +
        '<path d="M0 ' + (sea + 34) + ' q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#bfe3f5" stroke-width="2" fill="none"/></g>';
      // 標示
      var lbl = function (x, yy, t) {
        return '<g><rect x="' + (x - t.length * 6.5 - 6) + '" y="' + (yy - 13) + '" width="' + (t.length * 13 + 12) + '" height="19" rx="5" fill="#ffffffe6" stroke="#1f2933"/><text x="' + x + '" y="' + (yy + 1) + '" text-anchor="middle" font-size="12" font-weight="700" fill="#1f2933">' + t + '</text></g>';
      };
      if (s === 0) out += lbl(390, 40, '節理（裂縫）');
      if (s === 1) out += lbl(390, 90, '海蝕洞');
      if (s === 2) out += lbl(392, 80, '海蝕門');
      if (s === 3) out += lbl(472, 60, '海蝕柱') + lbl(200, 40 + cliffBack, '海蝕崖');
      if (s === 4) out += lbl(472, 98, '殘柱') + lbl(200, 40 + cliffBack, '海蝕崖');
      if (s >= 1) out += lbl(300 + Math.min(plat, 200) / 2, sea + 30, s >= 4 ? '海蝕平臺・豆腐岩' : '海蝕平臺');
      return out;
    }

    function renderStage() {
      var S = STAGES[stage];
      $('#c-svg').innerHTML = stageSVG(stage);
      $('#c-name').textContent = S.name;
      $('#c-desc').textContent = S.desc;
      $('#c-ex').textContent = S.ex;
      $('#c-ex').hidden = !S.ex;
      var y = YEARS[hard ? 'hard' : 'soft'][stage];
      $('#c-years').textContent = stage === 0 ? '現在' : '約 ' + y.toLocaleString() + ' 年後';
      $('#c-stage').setAttribute('aria-valuetext', S.name + '，' + $('#c-years').textContent);
    }

    function coastY(x) {
      if (!jetty) return 150;
      if (x < 320) return 150 - jt * 5.2 * Math.exp(-(320 - x) / 110);
      return 150 + jt * 8 * Math.exp(-(x - 330) / 170);
    }

    function renderJetty() {
      var out = '<rect width="640" height="300" fill="#e9d9a8"/>';
      // 海（上方）
      var d = 'M0 0 H640 V' + coastY(640).toFixed(1);
      for (var x = 640; x >= 0; x -= 8) d += ' L' + x + ' ' + coastY(x).toFixed(1);
      d += ' Z';
      out += '<path d="' + d + '" fill="#4b9bcc"/>';
      // 陸地與房子
      out += '<rect y="196" width="640" height="104" fill="#a9d18e"/>';
      var houses = [80, 180, 420, 520, 600];
      houses.forEach(function (hx) {
        var danger = coastY(hx) > 188;
        out += '<g transform="translate(' + hx + ' 214)"><path d="M-12 0 L0 -12 L12 0 Z" fill="' + (danger ? '#b91c1c' : '#c2410c') + '"/><rect x="-10" y="0" width="20" height="14" fill="' + (danger ? '#fca5a5' : '#fef3c7') + '" stroke="#7c2d12"/></g>';
        if (danger) out += '<text x="' + hx + '" y="246" text-anchor="middle" font-size="11" font-weight="800" fill="#b91c1c">危險！</text>';
      });
      // 沿岸流箭頭
      for (var a = 40; a < 600; a += 110) {
        out += '<g class="drift" transform="translate(' + a + ' 110)"><path d="M0 0 H40" stroke="#e0f2fe" stroke-width="3"/><path d="M40 0 l-8 -5 v10 z" fill="#e0f2fe"/></g>';
      }
      out += '<text x="16" y="96" font-size="12" font-weight="700" fill="#e0f2fe">沿岸流帶著沙子往右移動 →</text>';
      // 突堤
      if (jetty) {
        out += '<rect x="314" y="72" width="14" height="' + (coastY(320) - 72 + 4) + '" fill="#6b7280" stroke="#374151"/>' +
          '<text x="321" y="64" text-anchor="middle" font-size="12" font-weight="800" fill="#1f2933">突堤（防波堤）</text>';
        if (jt > 0) {
          out += '<text x="150" y="' + (coastY(250) + 22).toFixed(0) + '" text-anchor="middle" font-size="12" font-weight="800" fill="#7c5a12">沙子被擋住，海岸往海延伸（堆積）</text>' +
            '<text x="470" y="' + Math.min(270, coastY(400) + 22).toFixed(0) + '" text-anchor="middle" font-size="12" font-weight="800" fill="#b91c1c">得不到沙子補充，海岸後退（侵蝕）</text>';
        }
      }
      $('#j-svg').innerHTML = out;
      $('#c-time-val').textContent = jt === 0 ? '剛建好' : jt * 5 + ' 年後';
      var lost = houses.filter(function (hx) { return coastY(hx) > 188; }).length;
      $('#j-note').textContent = !jetty ? '沒有突堤時，沙子被沿岸流帶走，也有新的沙子從上游補充，海岸線大致保持穩定。' :
        lost ? '⚠️ 突堤下游的海岸一直後退，已經有 ' + lost + ' 間房子受到威脅！這就是「突堤效應」。' :
        '突堤擋住了沿岸流帶來的沙子。拖動時間，看看突堤兩側的海岸線怎麼改變。';
    }

    return { setup: setup };
  })();

  /* ---------- 思考題參考答案 ---------- */
  function initReveal() {
    $$('.think-reveal').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.nextElementSibling;
        a.hidden = !a.hidden;
        b.textContent = a.hidden ? '看參考答案' : '收起答案';
      });
    });
  }

  function boot() {
    Object.keys(LABS).forEach(function (k) { if (LABS[k].setup) LABS[k].setup(); });
    initTabs();
    initReveal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
