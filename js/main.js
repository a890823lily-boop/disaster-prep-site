(function () {
  'use strict';

  /* ===== 防災包清單資料 ===== */
  var KIT_DATA = [
    {
      group: '💧 飲水與食物',
      items: [
        { id: 'water', name: '飲用水', note: '每人每天 3 公升，至少 3 天份' },
        { id: 'food', name: '乾糧、罐頭', note: '免烹煮、長效期，注意開罐方式' },
        { id: 'opener', name: '開罐器、餐具' }
      ]
    },
    {
      group: '🔦 照明與通訊',
      items: [
        { id: 'flashlight', name: '手電筒或頭燈' },
        { id: 'battery', name: '備用電池' },
        { id: 'radio', name: '收音機', note: '可手搖充電的款式更佳' },
        { id: 'powerbank', name: '行動電源與充電線' },
        { id: 'whistle', name: '哨子', note: '受困時求救用' }
      ]
    },
    {
      group: '🩹 醫療與衛生',
      items: [
        { id: 'firstaid', name: '急救包', note: 'OK 繃、紗布、消毒用品' },
        { id: 'medicine', name: '個人常備藥品', note: '慢性病藥物至少 7 天份' },
        { id: 'mask', name: '口罩' },
        { id: 'tissue', name: '衛生紙、濕紙巾' },
        { id: 'hygiene', name: '個人衛生用品', note: '牙刷、生理用品等' }
      ]
    },
    {
      group: '📄 重要物品',
      items: [
        { id: 'docs', name: '證件影本', note: '身分證、健保卡，裝入防水袋' },
        { id: 'cash', name: '現金（含零錢）', note: '停電時無法刷卡或提款' },
        { id: 'contacts', name: '緊急聯絡人名單', note: '寫在紙上，以防手機沒電' },
        { id: 'keys', name: '備用鑰匙' }
      ]
    },
    {
      group: '🧥 衣物與工具',
      items: [
        { id: 'clothes', name: '換洗衣物、保暖外套' },
        { id: 'raincoat', name: '輕便雨衣' },
        { id: 'blanket', name: '保暖毯或急救毯' },
        { id: 'gloves', name: '工作手套' },
        { id: 'knife', name: '多功能小刀' }
      ]
    }
  ];

  var STORAGE_KEY = 'disaster-kit-checked';

  function loadChecked() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveChecked(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* 無法儲存時（例如私密瀏覽）仍可正常勾選 */
    }
  }

  function initKit() {
    var listEl = document.getElementById('kit-list');
    if (!listEl) return;

    var checked = loadChecked();
    var total = 0;

    KIT_DATA.forEach(function (group, gi) {
      var section = document.createElement('div');
      section.className = 'kit-group';

      var title = document.createElement('h3');
      title.textContent = group.group;
      var count = document.createElement('span');
      count.className = 'kit-group-count';
      title.appendChild(count);
      section.appendChild(title);

      var ul = document.createElement('ul');
      group.items.forEach(function (item) {
        total++;
        var li = document.createElement('li');
        li.className = 'kit-item';

        var label = document.createElement('label');
        var input = document.createElement('input');
        input.type = 'checkbox';
        input.value = item.id;
        input.checked = !!checked[item.id];

        var text = document.createElement('span');
        var name = document.createElement('span');
        name.className = 'kit-name';
        name.textContent = item.name;
        text.appendChild(name);
        if (item.note) {
          var note = document.createElement('span');
          note.className = 'kit-note';
          note.textContent = item.note;
          text.appendChild(note);
        }

        label.appendChild(input);
        label.appendChild(text);
        li.appendChild(label);
        ul.appendChild(li);
      });
      section.appendChild(ul);
      section.dataset.group = gi;
      listEl.appendChild(section);
    });

    document.getElementById('kit-total').textContent = total;

    listEl.addEventListener('change', function (e) {
      if (e.target.type !== 'checkbox') return;
      if (e.target.checked) {
        checked[e.target.value] = true;
      } else {
        delete checked[e.target.value];
      }
      saveChecked(checked);
      updateProgress();
    });

    document.getElementById('kit-reset').addEventListener('click', function () {
      if (!confirm('確定要清除所有勾選嗎？')) return;
      checked = {};
      saveChecked(checked);
      listEl.querySelectorAll('input[type="checkbox"]').forEach(function (box) {
        box.checked = false;
      });
      updateProgress();
    });

    function updateProgress() {
      var boxes = listEl.querySelectorAll('input[type="checkbox"]');
      var done = 0;
      boxes.forEach(function (box) {
        if (box.checked) done++;
      });

      listEl.querySelectorAll('.kit-group').forEach(function (section) {
        var groupBoxes = section.querySelectorAll('input[type="checkbox"]');
        var groupDone = section.querySelectorAll('input[type="checkbox"]:checked').length;
        section.querySelector('.kit-group-count').textContent =
          groupDone + ' / ' + groupBoxes.length;
      });

      var percent = total ? Math.round((done / total) * 100) : 0;
      var fill = document.getElementById('kit-progress');
      fill.style.width = percent + '%';
      fill.classList.toggle('done', done === total);
      fill.parentElement.setAttribute('aria-valuenow', percent);
      document.getElementById('kit-count').textContent = done;
    }

    updateProgress();
  }

  /* ===== 手機選單 ===== */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open);
      toggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    }

    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('open'));
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setOpen(false);
    });

    /* 捲動時標示目前所在區塊 */
    var links = nav.querySelectorAll('a');
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
          });
        });
      }, { rootMargin: '-40% 0px -55% 0px' });

      links.forEach(function (link) {
        var target = document.querySelector(link.getAttribute('href'));
        if (target) observer.observe(target);
      });
    }
  }

  /* ===== 地震應變分頁 ===== */
  function initTabs() {
    var tablist = document.querySelector('.tabs');
    if (!tablist) return;
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));

    function select(tab) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute('aria-selected', selected);
        t.tabIndex = selected ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        select(tab);
      });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (next) {
          e.preventDefault();
          select(next);
          next.focus();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initKit();
    initTabs();
  });
})();
