(function () {
  'use strict';

  /* =========================================================
   * 教學影片工具組：動畫影片播放器（SVG 場景 + 字幕 + 語音旁白）與互動問答
   * 每個章節有一個場景，旁白每播一句就推進一個步驟（step），
   * 場景中標記 data-s="n" 的元素在第 n 步出現，data-hide="n" 的元素在第 n 步消失。
   * 認識岩石（rocks.js）與大地如何變動（landforms.js）共用。
   * ========================================================= */

  var SEC_PER_CHAR = 0.23;   // 沒有語音時，每個字的字幕顯示時間
  var LINE_GAP = 0.7;        // 每句之間的停頓（秒）

  function r1(n) { return Math.round(n * 10) / 10; }
  function $(sel, root) { return (root || document).querySelector(sel); }

  function fmt(sec) {
    sec = Math.max(0, Math.round(sec));
    return Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2);
  }

  /* ---------- 場景繪圖小工具 ---------- */

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

  /* ---------- 影片播放器 ---------- */

  function createPlayer(player, opts) {
    opts = opts || {};
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
      chapters: opts.chapterList || null
    };

    var chapters = [], timeline = [], total = 0;
    var idx = 0, currentChapter = -1, playing = false, lineStartedAt = 0;
    var timer = null, fallback = null, raf = null, token = 0;

    /* 語音旁白 */
    var synth = window.speechSynthesis;
    var voice = null, voiceOn = false;

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

    function load(list) {
      clearTimers();
      setPlaying(false);
      chapters = list;
      timeline = [];
      total = 0;
      idx = 0;
      currentChapter = -1;
      chapters.forEach(function (ch, ci) {
        ch.lines.forEach(function (text, li) {
          var dur = text.length * SEC_PER_CHAR + LINE_GAP;
          timeline.push({ ch: ci, step: ch.steps ? ch.steps[li] : li, text: text, start: total, dur: dur });
          total += dur;
        });
      });

      els.marks.innerHTML = '';
      if (els.chapters) els.chapters.innerHTML = '';
      chapters.forEach(function (ch, ci) {
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

      var totalEl = $('#vp-total', player);
      if (totalEl) totalEl.textContent = '約 ' + Math.max(1, Math.round(total / 60)) + ' 分鐘';
      els.cover.hidden = false;
      els.end.hidden = true;
      render(0);
      els.sub.textContent = '按下播放開始觀看';
      if (!raf) tick();
    }

    function showChapter(ci) {
      if (ci === currentChapter) return;
      currentChapter = ci;
      if (window.RockArt) window.RockArt.setId(0);
      els.svg.innerHTML = chapters[ci].scene();
      els.svg.setAttribute('aria-label', '第 ' + (ci + 1) + ' 章：' + chapters[ci].title);
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
      if (idx < timeline.length - 1) playLine(idx + 1);
      else finish();
    }

    function tick() {
      var line = timeline[idx];
      if (line) {
        var elapsed = playing ? Math.min((performance.now() - lineStartedAt) / 1000, line.dur) : 0;
        var t = line.start + elapsed;
        els.fill.style.width = (t / total * 100) + '%';
        els.time.textContent = fmt(t) + ' / ' + fmt(total);
        els.progress.setAttribute('aria-valuenow', Math.round(t));
      }
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
      if (playing) playLine(idx);
      else { render(idx); if (!raf) tick(); }
    }

    els.play.addEventListener('click', function () { playing ? pause() : play(); });
    $('#vp-start', player).addEventListener('click', play);
    $('#vp-replay', player).addEventListener('click', function () { idx = 0; play(); });
    els.stage.addEventListener('click', function (e) {
      if (e.target.closest('button, a')) return;
      if (els.cover.hidden && els.end.hidden) playing ? pause() : play();
    });

    els.progress.addEventListener('click', function (e) {
      var rect = els.progress.getBoundingClientRect();
      var t = (e.clientX - rect.left) / rect.width * total;
      for (var i = timeline.length - 1; i >= 0; i--) {
        if (timeline[i].start <= t) { seek(i); return; }
      }
    });
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
    if (!(player.requestFullscreen || player.webkitRequestFullscreen)) {
      els.full.hidden = true;
    } else {
      els.full.addEventListener('click', function () {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
          var r = (player.requestFullscreen || player.webkitRequestFullscreen).call(player);
          if (r && r.catch) r.catch(function () {});
        }
      });
    }

    // 離開頁面時停止語音
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && playing) pause();
    });

    if (opts.chapters) load(opts.chapters);
    return { load: load, pause: pause };
  }

  /* ---------- 互動問答 ---------- */

  function createQuiz(root, opts) {
    opts = opts || {};
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

    var questions = [], i = 0, score = 0, wrong = [];
    var messages = opts.messages || ['全部答對，太厲害了！', '很棒！再看一下答錯的題目。', '再看一次影片，再來挑戰！'];

    function show(view) {
      els.start.hidden = view !== 'start';
      els.play.hidden = view !== 'play';
      els.end.hidden = view !== 'end';
    }

    function load(list, msgs) {
      questions = list;
      if (msgs) messages = msgs;
      var count = $('.rq-count', root);
      if (count) count.textContent = '共 ' + questions.length + ' 題';
      show('start');
    }

    function start() {
      i = 0; score = 0; wrong = [];
      show('play');
      render();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function render() {
      var item = questions[i];
      els.progress.textContent = '第 ' + (i + 1) + ' / ' + questions.length + ' 題';
      els.bar.style.width = (i / questions.length * 100) + '%';
      els.q.textContent = item.q;
      els.feedback.hidden = true;

      var img = opts.image ? opts.image(item, i) : '';
      els.img.innerHTML = img || '';
      els.img.hidden = !img;

      els.options.innerHTML = '';
      item.options.forEach(function (text, oi) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'rq-option';
        b.innerHTML = '<span class="rq-key">' + 'ABCD'.charAt(oi) + '</span><span></span>';
        b.lastChild.textContent = text;
        b.addEventListener('click', function () { answer(oi); });
        els.options.appendChild(b);
      });
    }

    function answer(oi) {
      var item = questions[i];
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
      els.next.textContent = i < questions.length - 1 ? '下一題 →' : '看成績';
      els.next.focus({ preventScroll: true });
    }

    function next() {
      i++;
      if (i < questions.length) {
        render();
        els.q.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        finish();
      }
    }

    function finish() {
      show('end');
      var total = questions.length;
      els.score.textContent = score + ' / ' + total;
      var stars = score === total ? 3 : score >= total - 2 ? 2 : score >= total / 2 ? 1 : 0;
      els.stars.textContent = '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars);
      els.msg.textContent = stars === 3 ? messages[0] : stars === 2 ? messages[1] : messages[2];
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
    $('#rq-again', root).addEventListener('click', start);
    els.next.addEventListener('click', next);
    var toQuiz = $('#vp-to-quiz');
    if (toQuiz) toQuiz.addEventListener('click', function () {
      if (!els.start.hidden) start();
    });

    if (opts.questions) load(opts.questions);
    return { load: load, start: start };
  }

  window.LessonKit = {
    label: label, tag: tag, clue: clue, arrow: arrow, r1: r1,
    createPlayer: createPlayer, createQuiz: createQuiz
  };
})();
