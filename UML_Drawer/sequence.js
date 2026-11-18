(() => {
  'use strict';

  /* ------------------------------------------------------------------
     Constants
     ------------------------------------------------------------------ */

  const STORAGE_KEY = 'classo.uml.sequence-diagram.v1';
  const MIN_SCALE = 0.3;
  const MAX_SCALE = 2.5;
  const GRID_SIZE = 24;
  const HISTORY_LIMIT = 90;

  const THEMES = {
    slate: { label: '石板', accent: '#64748B', tint: '#F8FAFC' },
    blue: { label: '雾蓝', accent: '#3B82F6', tint: '#EFF6FF' },
    violet: { label: '紫罗兰', accent: '#7C3AED', tint: '#F5F3FF' },
    emerald: { label: '翡翠', accent: '#059669', tint: '#ECFDF5' },
    amber: { label: '琥珀', accent: '#D97706', tint: '#FFFBEB' },
    rose: { label: '玫瑰', accent: '#E11D48', tint: '#FFF1F2' }
  };
  const THEME_ORDER = ['slate', 'blue', 'violet', 'emerald', 'amber', 'rose'];

  const LIFELINE_KINDS = {
    actor: {
      label: '参与者',
      english: 'Actor',
      stereotype: '',
      isActor: true,
      description: '用小人图标表示外部用户或外部系统。'
    },
    object: {
      label: '对象',
      english: 'Object',
      stereotype: '',
      isActor: false,
      description: '普通对象，用矩形标题表示。'
    },
    boundary: {
      label: '边界',
      english: 'Boundary',
      stereotype: 'boundary',
      isActor: false,
      description: '边界对象，标题上方显示 «boundary»。'
    },
    control: {
      label: '控制',
      english: 'Control',
      stereotype: 'control',
      isActor: false,
      description: '控制对象，标题上方显示 «control»。'
    },
    entity: {
      label: '实体',
      english: 'Entity',
      stereotype: 'entity',
      isActor: false,
      description: '实体对象，标题上方显示 «entity»。'
    }
  };
  const LIFELINE_ORDER = ['actor', 'object', 'boundary', 'control', 'entity'];

  const MESSAGE_TYPES = {
    sync: {
      label: '同步消息',
      short: '同步',
      english: 'Synchronous',
      dashed: false,
      arrow: 'filled',
      description: '实线搭配实心箭头，表示一次同步调用。'
    },
    async: {
      label: '异步消息',
      short: '异步',
      english: 'Asynchronous',
      dashed: false,
      arrow: 'open',
      description: '实线搭配开放箭头，表示异步发送。'
    },
    return: {
      label: '返回消息',
      short: '返回',
      english: 'Return',
      dashed: true,
      arrow: 'open',
      description: '虚线搭配开放箭头，表示返回结果。'
    }
  };
  const MESSAGE_ORDER = ['sync', 'async', 'return'];

  const ACCENT = '#4F46E5';
  const INK = '#1D2433';
  const MUTED = '#5B6B80';
  const MUTED_LIGHT = '#7D899B';
  const LIFELINE_STROKE = '#C6CFDB';
  const HEADER_STROKE = '#D5DDE7';
  const BAR_FILL = '#E9EEF5';
  const BAR_STROKE = '#C3CEDC';

  const MARGIN_X = 84;
  const HEADER_TOP = 44;
  const MESSAGE_GAP = 56;
  const MESSAGE_START = 76;
  const BAR_HALF = 4.5;

  const FONT_NAME = '600 13px "Inter", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  const FONT_STEREO = '500 9.5px "Inter", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  const FONT_LABEL = '500 12px "Inter", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

  const SVG_SANS = `Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif`;

  const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7"></path><path d="M10 11v5M14 11v5"></path></svg>`;
  const SWAP_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13m0 0-3-3m3 3-3 3"></path><path d="M20 16H7m0 0 3-3m-3 3 3 3"></path></svg>`;
  const CHECK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4.5 4.5L19 7"></path></svg>`;
  const ARROW_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m14 7 5 5-5 5"></path></svg>`;

  const SEQ_EMPTY_ICON = `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="8" rx="2.4"></rect><rect x="30" y="6" width="12" height="8" rx="2.4"></rect><path d="M12 14v26M36 14v26" stroke-dasharray="3 3.4"></path><path d="M12 22h24"></path><path d="m32 18 4 4-4 4"></path><path d="M36 31H12"></path><path d="m16 27-4 4 4 4" stroke-dasharray="2 2.6"></path></svg>`;

  const MESSAGE_ICONS = {
    sync: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h13"></path><path d="M15.5 7.8 21 12l-5.5 4.2z" fill="currentColor" stroke="none"></path></svg>`,
    async: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h13"></path><path d="m16 8 4 4-4 4"></path></svg>`,
    return: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h13" stroke-dasharray="3 2.5"></path><path d="m16 8 4 4-4 4"></path></svg>`
  };

  const SEQ_DEFS = `<defs>
    <marker id="seq-arrow-filled" markerWidth="12" markerHeight="12" refX="9.4" refY="6" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M0.8 1.2 10 6 0.8 10.8Z" fill="#475467"></path>
    </marker>
    <marker id="seq-arrow-filled-sel" markerWidth="12" markerHeight="12" refX="9.4" refY="6" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M0.8 1.2 10 6 0.8 10.8Z" fill="${ACCENT}"></path>
    </marker>
    <marker id="seq-arrow-open" markerWidth="12" markerHeight="12" refX="9.4" refY="6" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M1 1 10 6 1 11" fill="none" stroke="#475467" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path>
    </marker>
    <marker id="seq-arrow-open-sel" markerWidth="12" markerHeight="12" refX="9.4" refY="6" orient="auto" markerUnits="userSpaceOnUse">
      <path d="M1 1 10 6 1 11" fill="none" stroke="${ACCENT}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
    </marker>
  </defs>`;

  /* ------------------------------------------------------------------
     DOM & state
     ------------------------------------------------------------------ */

  const $ = (id) => document.getElementById(id);
  const els = {
    workspace: $('sequenceWorkspace'),
    canvas: $('seqCanvas'),
    svg: $('seqSvg'),
    toolbar: $('seqToolbar'),
    inspector: $('seqInspector'),
    saveState: $('seqSaveState'),
    saveText: $('seqSaveText'),
    undoBtn: $('seqUndoBtn'),
    redoBtn: $('seqRedoBtn'),
    addBtn: $('addLifelineBtn'),
    menuWrap: $('seqMenuWrap'),
    menuBtn: $('seqFileMenuBtn'),
    menu: $('seqFileMenu'),
    fileInput: $('seqFileInput'),
    zoomOut: $('seqZoomOut'),
    zoomIn: $('seqZoomIn'),
    zoomReset: $('seqZoomReset'),
    fitBtn: $('seqFitBtn'),
    banner: $('seqModeBanner'),
    bannerIcon: $('seqModeIcon'),
    bannerText: $('seqModeText'),
    bannerCancel: $('seqModeCancel'),
    toast: $('seqToast'),
    toastMessage: $('seqToastMessage'),
    toastAction: $('seqToastAction'),
    confirmDialog: $('seqConfirmDialog'),
    confirmTitle: $('seqConfirmTitle'),
    confirmMessage: $('seqConfirmMessage'),
    confirmCancel: $('seqConfirmCancel'),
    confirmOk: $('seqConfirmOk')
  };

  const measureCtx = document.createElement('canvas').getContext('2d');

  const state = {
    lifelines: [],
    messages: [],
    selection: null,
    tool: 'select',
    connect: { type: null, sourceId: null },
    view: { x: 0, y: 0, scale: 1 },
    drag: null,
    spaceDown: false
  };

  let layout = null;
  let history = [];
  let historyIndex = -1;
  let historyTimer = null;
  let saveTimer = null;
  let toastTimer = null;
  let toastActionHandler = null;
  let dialogResolve = null;
  let storageBroken = false;
  let idSequence = 0;
  let currentLibraryId = null;
  let reloadingLibrary = false;

  /* ------------------------------------------------------------------
     Utilities
     ------------------------------------------------------------------ */

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const fmt = (n) => Math.round(n * 100) / 100;

  function uid(prefix) {
    idSequence += 1;
    return `${prefix}_${Date.now().toString(36)}_${idSequence.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => {
      switch (char) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return char;
      }
    });
  }

  function closestEl(target, selector) {
    return target instanceof Element ? target.closest(selector) : null;
  }

  function isTextEditing(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function blurActiveEditor() {
    const active = document.activeElement;
    if (active && active !== document.body && typeof active.blur === 'function') {
      active.blur();
    }
  }

  function measureText(text, font) {
    measureCtx.font = font;
    return measureCtx.measureText(text).width;
  }

  function findLifeline(id) {
    return state.lifelines.find((item) => item.id === id) || null;
  }

  function findMessage(id) {
    return state.messages.find((item) => item.id === id) || null;
  }

  function getLifelineName(lifeline) {
    return lifeline && lifeline.name && lifeline.name.trim() ? lifeline.name.trim() : '未命名参与者';
  }

  function getKind(lifeline) {
    const key = lifeline && Object.prototype.hasOwnProperty.call(LIFELINE_KINDS, lifeline.kind)
      ? lifeline.kind
      : 'object';
    return { key, ...LIFELINE_KINDS[key] };
  }

  function getTheme(lifeline) {
    return THEMES[lifeline && lifeline.color] || THEMES.slate;
  }

  function setSaveState(kind, label) {
    els.saveState.classList.remove('saving', 'error');
    if (kind === 'saving') els.saveState.classList.add('saving');
    if (kind === 'error') els.saveState.classList.add('error');
    els.saveText.textContent = label;
  }

  /* ------------------------------------------------------------------
     Normalisation / persistence
     ------------------------------------------------------------------ */

  function normalizeSequence(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (!Array.isArray(raw.lifelines) && !Array.isArray(raw.messages)) return null;

    const lifelines = [];
    const lifelineIds = new Set();

    for (const source of Array.isArray(raw.lifelines) ? raw.lifelines : []) {
      if (!source || typeof source !== 'object') continue;
      let id = typeof source.id === 'string' && source.id ? source.id : uid('l');
      while (lifelineIds.has(id)) id = uid('l');
      lifelineIds.add(id);

      const kind = Object.prototype.hasOwnProperty.call(LIFELINE_KINDS, source.kind)
        ? source.kind
        : 'object';
      const color = typeof source.color === 'string' && THEMES[source.color] ? source.color : 'slate';

      lifelines.push({
        id,
        name: typeof source.name === 'string' ? source.name.slice(0, 120) : '',
        kind,
        color
      });
    }

    const messages = [];
    const messageIds = new Set();

    for (const source of Array.isArray(raw.messages) ? raw.messages : []) {
      if (!source || typeof source !== 'object') continue;
      const from = String(source.from ?? '');
      const to = String(source.to ?? '');
      if (!lifelineIds.has(from) || !lifelineIds.has(to)) continue;

      let id = typeof source.id === 'string' && source.id ? source.id : uid('m');
      while (messageIds.has(id)) id = uid('m');
      messageIds.add(id);

      const type = Object.prototype.hasOwnProperty.call(MESSAGE_TYPES, source.type)
        ? source.type
        : 'sync';
      const rawName = typeof source.name === 'string'
        ? source.name
        : (typeof source.label === 'string' ? source.label : '');

      messages.push({
        id,
        type,
        from,
        to,
        name: rawName.slice(0, 200)
      });
    }

    return { lifelines, messages };
  }

  function cleanLifeline(lifeline) {
    return {
      id: lifeline.id,
      name: lifeline.name,
      kind: lifeline.kind,
      color: lifeline.color
    };
  }

  function cleanMessage(message) {
    return {
      id: message.id,
      type: message.type,
      from: message.from,
      to: message.to,
      name: message.name
    };
  }

  function serializeSequence() {
    return JSON.stringify({
      lifelines: state.lifelines.map(cleanLifeline),
      messages: state.messages.map(cleanMessage)
    });
  }

  function normalizeView(view) {
    if (!view || !Number.isFinite(Number(view.scale))) return null;
    const x = Number(view.x);
    const y = Number(view.y);
    const scale = Number(view.scale);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return {
      x: clamp(x, -1e6, 1e6),
      y: clamp(y, -1e6, 1e6),
      scale: clamp(scale, MIN_SCALE, MAX_SCALE)
    };
  }

  function getLibrary() {
    return typeof window !== 'undefined' ? window.ClassoLibrary : null;
  }

  function loadFromStorage() {
    const library = getLibrary();

    if (library) {
      const active = library.getActive('sequence');
      const stored = active ? library.load(active.id) : null;
      const data = stored ? normalizeSequence(stored.data) : null;
      if (active && data) {
        currentLibraryId = active.id;
        return { data, view: normalizeView(stored.view) };
      }
      return null;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const data = normalizeSequence(parsed);
      if (!data) return null;
      return { data, view: normalizeView(parsed.view) };
    } catch (error) {
      if (error && (error.name === 'SecurityError' || error.name === 'QuotaExceededError')) {
        storageBroken = true;
      }
      return null;
    }
  }

  function persistNow(options = {}) {
    clearTimeout(saveTimer);
    saveTimer = null;

    const view = {
      x: fmt(state.view.x),
      y: fmt(state.view.y),
      scale: fmt(state.view.scale)
    };
    const data = {
      lifelines: state.lifelines.map(cleanLifeline),
      messages: state.messages.map(cleanMessage)
    };
    const library = getLibrary();
    let librarySaved = true;

    try {
      if (library) {
        let target = currentLibraryId ? library.get(currentLibraryId) : null;
        if (!target) target = library.getActive('sequence');

        if (!target) {
          target = library.create('sequence', {
            name: library.suggestName('sequence', '我的时序图'),
            data,
            view,
            activate: true,
            silent: true
          });
        }

        if (target) {
          currentLibraryId = target.id;
          librarySaved = library.save(target.id, data, view) !== false;
        } else {
          librarySaved = false;
        }
      }

      const payload = {
        version: 1,
        app: 'Classo',
        kind: 'sequence',
        savedAt: Date.now(),
        lifelines: data.lifelines,
        messages: data.messages,
        view
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

      if (library && !librarySaved) {
        throw new Error('library storage unavailable');
      }

      storageBroken = false;
      setSaveState('saved', '已保存');
      const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      els.saveState.title = `已自动保存 · ${time}`;
      if (options.notify) showToast('已保存到当前浏览器');
      return true;
    } catch (error) {
      storageBroken = true;
      setSaveState('error', '无法自动保存');
      els.saveState.title = '浏览器本地存储不可用，请从「文件」菜单导出备份';
      if (options.notify) showToast('保存失败，建议导出 JSON 备份');
      return false;
    }
  }

  function reloadActiveDiagram() {
    if (reloadingLibrary) return;
    const library = getLibrary();
    if (!library) return;

    reloadingLibrary = true;
    clearTimeout(saveTimer);
    saveTimer = null;
    clearTimeout(historyTimer);
    historyTimer = null;

    try {
      const active = library.getActive('sequence');
      const stored = active ? library.load(active.id) : null;
      const data = stored ? normalizeSequence(stored.data) : null;

      state.selection = null;
      state.tool = 'select';
      state.connect = { type: null, sourceId: null };

      if (!active || !data) {
        const created = library.create('sequence', {
          name: library.suggestName('sequence', '未命名时序图'),
          data: { lifelines: [], messages: [] },
          view: null,
          activate: true,
          silent: true
        });

        currentLibraryId = created ? created.id : null;
        state.lifelines = [];
        state.messages = [];

        render({ inspector: true });
        initHistory();
        requestAnimationFrame(() => fitToView({ save: false }));
        setSaveState('saved', '已保存');
        els.saveState.title = created ? `${created.name} · 已载入` : '已保存';
        return;
      }

      const view = normalizeView(stored.view);
      currentLibraryId = active.id;
      state.lifelines = data.lifelines;
      state.messages = data.messages;

      if (view) state.view = view;

      render({ inspector: true });
      initHistory();

      if (view) {
        applyView();
      } else {
        requestAnimationFrame(() => fitToView({ save: false }));
      }

      setSaveState('saved', '已保存');
      els.saveState.title = `${active.name} · 已载入`;
    } finally {
      reloadingLibrary = false;
    }
  }

  function scheduleSave() {
    setSaveState('saving', '保存中…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => persistNow(), 480);
  }

  /* ------------------------------------------------------------------
     History
     ------------------------------------------------------------------ */

  function initHistory() {
    history = [serializeSequence()];
    historyIndex = 0;
    updateUndoButtons();
  }

  function commitHistory() {
    clearTimeout(historyTimer);
    historyTimer = null;
    const snapshot = serializeSequence();

    if (historyIndex >= 0 && history[historyIndex] === snapshot) {
      updateUndoButtons();
      return;
    }

    if (historyIndex < 0) {
      history = [snapshot];
      historyIndex = 0;
      updateUndoButtons();
      return;
    }

    history = history.slice(0, historyIndex + 1);
    history.push(snapshot);
    if (history.length > HISTORY_LIMIT) history.shift();
    historyIndex = history.length - 1;
    updateUndoButtons();
  }

  function scheduleHistory() {
    updateUndoButtons();
    clearTimeout(historyTimer);
    historyTimer = setTimeout(() => {
      historyTimer = null;
      commitHistory();
    }, 420);
  }

  function updateUndoButtons() {
    if (historyIndex < 0) {
      els.undoBtn.disabled = true;
      els.redoBtn.disabled = true;
      return;
    }
    const dirty = history[historyIndex] !== serializeSequence();
    els.undoBtn.disabled = historyIndex <= 0 && !dirty;
    els.redoBtn.disabled = dirty || historyIndex >= history.length - 1;
  }

  function restoreSnapshot(snapshot) {
    let parsed;
    try {
      parsed = JSON.parse(snapshot);
    } catch (error) {
      return;
    }

    state.lifelines = parsed.lifelines || [];
    state.messages = parsed.messages || [];
    state.tool = 'select';
    state.connect = { type: null, sourceId: null };

    if (state.selection) {
      const exists = state.selection.kind === 'lifeline'
        ? findLifeline(state.selection.id)
        : findMessage(state.selection.id);
      if (!exists) state.selection = null;
    }

    render({ inspector: true });
    scheduleSave();
  }

  function undo() {
    if (els.confirmDialog.open) return;
    if (historyTimer) {
      clearTimeout(historyTimer);
      historyTimer = null;
    }
    commitHistory();
    if (historyIndex <= 0) {
      updateUndoButtons();
      return;
    }
    historyIndex -= 1;
    restoreSnapshot(history[historyIndex]);
    updateUndoButtons();
  }

  function redo() {
    if (els.confirmDialog.open) return;
    updateUndoButtons();
    if (history[historyIndex] !== serializeSequence()) {
      commitHistory();
      return;
    }
    if (historyIndex >= history.length - 1) return;
    historyIndex += 1;
    restoreSnapshot(history[historyIndex]);
    updateUndoButtons();
  }

  /* ------------------------------------------------------------------
     Sample diagram
     ------------------------------------------------------------------ */

  function createSampleData() {
    return {
      lifelines: [
        { id: 'seq-sample-user', name: '用户', kind: 'actor', color: 'slate' },
        { id: 'seq-sample-web', name: 'Web 客户端', kind: 'boundary', color: 'blue' },
        { id: 'seq-sample-server', name: '认证服务', kind: 'control', color: 'violet' },
        { id: 'seq-sample-db', name: '用户数据库', kind: 'entity', color: 'emerald' }
      ],
      messages: [
        {
          id: 'seq-sample-m1',
          type: 'sync',
          from: 'seq-sample-user',
          to: 'seq-sample-web',
          name: '输入账号密码'
        },
        {
          id: 'seq-sample-m2',
          type: 'sync',
          from: 'seq-sample-web',
          to: 'seq-sample-server',
          name: 'POST /login'
        },
        {
          id: 'seq-sample-m3',
          type: 'sync',
          from: 'seq-sample-server',
          to: 'seq-sample-db',
          name: '查询用户'
        },
        {
          id: 'seq-sample-m4',
          type: 'return',
          from: 'seq-sample-db',
          to: 'seq-sample-server',
          name: '用户记录'
        },
        {
          id: 'seq-sample-m5',
          type: 'return',
          from: 'seq-sample-server',
          to: 'seq-sample-web',
          name: '200 OK + Token'
        },
        {
          id: 'seq-sample-m6',
          type: 'return',
          from: 'seq-sample-web',
          to: 'seq-sample-user',
          name: '进入主页'
        }
      ]
    };
  }

  /* ------------------------------------------------------------------
     Layout
     ------------------------------------------------------------------ */

  function computeLayout() {
    const columns = [];
    let cursor = MARGIN_X;
    let maxHeaderH = 0;

    for (const lifeline of state.lifelines) {
      const kind = getKind(lifeline);
      const name = getLifelineName(lifeline);
      const stereotype = kind.stereotype ? `«${kind.stereotype}»` : '';
      const nameWidth = measureText(name, FONT_NAME);
      const stereoWidth = stereotype ? measureText(stereotype, FONT_STEREO) : 0;
      const headerH = kind.isActor ? 86 : (stereotype ? 58 : 48);
      const headerW = kind.isActor
        ? clamp(Math.max(80, nameWidth + 34), 80, 280)
        : clamp(Math.max(124, nameWidth + 42, stereoWidth + 36), 124, 300);
      const columnWidth = Math.max(headerW + 76, 170);

      columns.push({
        id: lifeline.id,
        left: cursor,
        width: columnWidth,
        center: cursor + columnWidth / 2,
        headerW,
        headerH,
        headerTop: HEADER_TOP,
        lineTop: HEADER_TOP + headerH,
        name,
        stereotype,
        kind: kind.key,
        isActor: kind.isActor,
        theme: getTheme(lifeline)
      });

      cursor += columnWidth;
      maxHeaderH = Math.max(maxHeaderH, headerH);
    }

    const headerBottom = HEADER_TOP + maxHeaderH;
    const firstMessageY = headerBottom + MESSAGE_START;
    const messageYs = state.messages.map((_, index) => firstMessageY + index * MESSAGE_GAP);
    const bottom = messageYs.length
      ? messageYs[messageYs.length - 1] + 84
      : headerBottom + 260;
    const width = Math.max(cursor + MARGIN_X, 660);

    return {
      columns,
      byId: new Map(columns.map((column) => [column.id, column])),
      headerTop: HEADER_TOP,
      headerBottom,
      firstMessageY,
      messageYs,
      bottom,
      width,
      height: bottom + 40
    };
  }

  function computeBounds() {
    if (!layout) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = 0;
    let maxX = layout.width;
    let minY = 0;
    let maxY = layout.height;

    state.messages.forEach((message, index) => {
      const from = layout.byId.get(message.from);
      const to = layout.byId.get(message.to);
      if (!from || !to) return;
      const y = layout.messageYs[index];
      const label = String(message.name || '').trim();

      if (message.from === message.to) {
        maxX = Math.max(maxX, from.center + 70 + (label ? measureText(label, FONT_LABEL) + 16 : 0));
        maxY = Math.max(maxY, y + 56);
        return;
      }

      if (label) {
        const middle = (from.center + to.center) / 2;
        const half = measureText(label, FONT_LABEL) / 2 + 10;
        minX = Math.min(minX, middle - half);
        maxX = Math.max(maxX, middle + half);
      }
    });

    return { minX, minY, maxX, maxY };
  }

  /* ------------------------------------------------------------------
     Activations
     ------------------------------------------------------------------ */

  function computeActivations() {
    const map = new Map();
    for (const lifeline of state.lifelines) map.set(lifeline.id, []);
    if (!layout) return map;

    state.messages.forEach((message, index) => {
      if (message.type !== 'sync') return;
      const start = layout.messageYs[index];
      let end = start + 36;

      for (let next = index + 1; next < state.messages.length; next += 1) {
        const candidate = state.messages[next];
        if (candidate.from === message.to && candidate.to === message.from) {
          end = layout.messageYs[next];
          break;
        }
      }

      if (end - start < 18) end = start + 18;
      const list = map.get(message.to);
      if (list) list.push({ start, end });
    });

    for (const [id, list] of map) {
      list.sort((a, b) => a.start - b.start);
      const merged = [];
      for (const interval of list) {
        const last = merged[merged.length - 1];
        if (last && interval.start <= last.end + 2) {
          last.end = Math.max(last.end, interval.end);
        } else {
          merged.push({ ...interval });
        }
      }
      map.set(id, merged);
    }

    return map;
  }

  function isActiveAt(activations, id, y) {
    const list = activations.get(id) || [];
    return list.some((interval) => y >= interval.start - 0.5 && y <= interval.end + 0.5);
  }

  /* ------------------------------------------------------------------
     SVG markup
     ------------------------------------------------------------------ */

  function buildLifelinesMarkup(selectedId) {
    const parts = [];

    for (const column of layout.columns) {
      const selected = column.id === selectedId;
      parts.push(`<line class="seq-lifeline-line" x1="${fmt(column.center)}" y1="${fmt(column.lineTop)}" x2="${fmt(column.center)}" y2="${fmt(layout.bottom)}" stroke="${selected ? ACCENT : LIFELINE_STROKE}" stroke-width="${selected ? 1.6 : 1.3}" stroke-dasharray="6 5"></line>`);
    }

    for (const column of layout.columns) {
      parts.push(`<line class="seq-lifeline-hit" x1="${fmt(column.center)}" y1="${fmt(column.lineTop)}" x2="${fmt(column.center)}" y2="${fmt(layout.bottom)}" stroke="transparent" stroke-width="18" pointer-events="stroke" data-lifeline-id="${esc(column.id)}"></line>`);
    }

    return parts.join('');
  }

  function buildActivationsMarkup(activations) {
    const parts = [];

    for (const [id, intervals] of activations) {
      const column = layout.byId.get(id);
      if (!column) continue;
      for (const interval of intervals) {
        parts.push(`<rect class="seq-activation" x="${fmt(column.center - BAR_HALF)}" y="${fmt(interval.start)}" width="${fmt(BAR_HALF * 2)}" height="${fmt(Math.max(18, interval.end - interval.start))}" rx="2" fill="${BAR_FILL}" stroke="${BAR_STROKE}" stroke-width="1" data-lifeline-id="${esc(column.id)}"></rect>`);
      }
    }

    return parts.join('');
  }

  function buildHeaderMarkup(column, selected, isSource) {
    const highlight = selected || isSource;
    const cx = column.center;
    const top = column.headerTop;
    const stroke = highlight ? ACCENT : HEADER_STROKE;
    const strokeWidth = highlight ? 1.9 : 1;
    const nameFill = highlight ? ACCENT : INK;

    if (column.isActor) {
      const nameY = top + 70;
      const figureStroke = highlight ? ACCENT : MUTED;
      return `
        <g class="seq-lifeline" data-lifeline-id="${esc(column.id)}">
          <title>${esc(LIFELINE_KINDS.actor.label)} · ${esc(column.name)}</title>
          <circle cx="${fmt(cx)}" cy="${fmt(top + 13)}" r="8" fill="#fff" stroke="${figureStroke}" stroke-width="1.5"></circle>
          <path d="M ${fmt(cx)} ${fmt(top + 21)} V ${fmt(top + 37)} M ${fmt(cx - 10)} ${fmt(top + 27)} H ${fmt(cx + 10)} M ${fmt(cx)} ${fmt(top + 37)} L ${fmt(cx - 9)} ${fmt(top + 51)} M ${fmt(cx)} ${fmt(top + 37)} L ${fmt(cx + 9)} ${fmt(top + 51)}" fill="none" stroke="${figureStroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
          <text class="seq-name" x="${fmt(cx)}" y="${fmt(nameY)}" text-anchor="middle" dominant-baseline="central" font-family="${SVG_SANS}" font-size="12.5" font-weight="600" fill="${nameFill}">${esc(column.name)}</text>
          <rect x="${fmt(cx - Math.max(46, column.headerW / 2))}" y="${fmt(top)}" width="${fmt(Math.max(92, column.headerW))}" height="${fmt(column.headerH)}" fill="transparent" pointer-events="all"></rect>
        </g>
      `;
    }

    const boxX = cx - column.headerW / 2;
    const nameY = column.stereotype ? top + 38 : top + 24;
    const stereoY = top + 17;
    const accent = column.theme.accent;
    const tint = column.theme.tint;
    const kindLabel = (LIFELINE_KINDS[column.kind] || LIFELINE_KINDS.object).label;

    return `
      <g class="seq-lifeline" data-lifeline-id="${esc(column.id)}">
        <title>${esc(kindLabel)} · ${esc(column.name)}</title>
        <rect class="seq-header-box" x="${fmt(boxX)}" y="${fmt(top)}" width="${fmt(column.headerW)}" height="${fmt(column.headerH)}" rx="9" fill="${tint}" stroke="${stroke}" stroke-width="${strokeWidth}"></rect>
        <line x1="${fmt(boxX + 10)}" y1="${fmt(top + column.headerH - 3)}" x2="${fmt(boxX + column.headerW - 10)}" y2="${fmt(top + column.headerH - 3)}" stroke="${accent}" stroke-width="2.4" stroke-linecap="round" opacity="0.78"></line>
        ${column.stereotype ? `<text x="${fmt(cx)}" y="${fmt(stereoY)}" text-anchor="middle" dominant-baseline="central" font-family="${SVG_SANS}" font-size="9.5" font-weight="500" fill="${MUTED_LIGHT}">«${esc(column.stereotype)}»</text>` : ''}
        <text class="seq-name" x="${fmt(cx)}" y="${fmt(nameY)}" text-anchor="middle" dominant-baseline="central" font-family="${SVG_SANS}" font-size="13" font-weight="600" fill="${nameFill}">${esc(column.name)}</text>
        <rect x="${fmt(boxX)}" y="${fmt(top)}" width="${fmt(column.headerW)}" height="${fmt(column.headerH)}" rx="9" fill="transparent" pointer-events="all"></rect>
      </g>
    `;
  }

  function buildMessageMarkup(message, index, activations, selected) {
    const from = layout.byId.get(message.from);
    const to = layout.byId.get(message.to);
    if (!from || !to) return '';

    const y = layout.messageYs[index];
    const conf = MESSAGE_TYPES[message.type] || MESSAGE_TYPES.sync;
    const color = selected ? ACCENT : '#475467';
    const marker = `url(#seq-arrow-${conf.arrow}${selected ? '-sel' : ''})`;
    const dash = conf.dashed ? ' stroke-dasharray="7 5"' : '';
    const label = String(message.name || '').trim();
    let geometry = '';
    let labelMarkup = '';

    if (message.from === message.to) {
      const active = isActiveAt(activations, message.from, y);
      const startX = from.center + (active ? BAR_HALF : 0);
      const outX = from.center + 46;
      const height = 30;
      const radius = 8;
      const d = `M ${fmt(startX)} ${fmt(y)} H ${fmt(outX - radius)} Q ${fmt(outX)} ${fmt(y)} ${fmt(outX)} ${fmt(y + radius)} V ${fmt(y + height - radius)} Q ${fmt(outX)} ${fmt(y + height)} ${fmt(outX - radius)} ${fmt(y + height)} H ${fmt(startX)}`;

      geometry = `
        <path class="seq-msg-hit" d="${d}" fill="none" stroke="transparent" stroke-width="16" pointer-events="stroke"></path>
        <path class="seq-msg-line" d="${d}" fill="none" stroke="${color}" stroke-width="${selected ? 1.9 : 1.5}" stroke-linecap="round" stroke-linejoin="round"${dash} marker-end="${marker}"></path>
      `;

      if (label) {
        labelMarkup = `<text class="seq-msg-label" x="${fmt(outX + 10)}" y="${fmt(y + height / 2)}" dominant-baseline="central" font-family="${SVG_SANS}" font-size="12" font-weight="500" fill="${selected ? ACCENT : MUTED}" stroke="#FFFFFF" stroke-width="4.5" paint-order="stroke">${esc(label)}</text>`;
      }
    } else {
      const direction = to.center > from.center ? 1 : -1;
      let startX = from.center;
      let endX = to.center;
      if (isActiveAt(activations, message.from, y)) startX += direction * BAR_HALF;
      if (isActiveAt(activations, message.to, y)) endX -= direction * BAR_HALF;
      const d = `M ${fmt(startX)} ${fmt(y)} L ${fmt(endX)} ${fmt(y)}`;

      geometry = `
        <path class="seq-msg-hit" d="${d}" fill="none" stroke="transparent" stroke-width="16" pointer-events="stroke"></path>
        <path class="seq-msg-line" d="${d}" fill="none" stroke="${color}" stroke-width="${selected ? 1.9 : 1.5}" stroke-linecap="round"${dash} marker-end="${marker}"></path>
      `;

      if (label) {
        const middle = (startX + endX) / 2;
        labelMarkup = `<text class="seq-msg-label" x="${fmt(middle)}" y="${fmt(y - 9)}" text-anchor="middle" dominant-baseline="central" font-family="${SVG_SANS}" font-size="12" font-weight="500" fill="${selected ? ACCENT : MUTED}" stroke="#FFFFFF" stroke-width="4.5" paint-order="stroke">${esc(label)}</text>`;
      }
    }

    const title = `${conf.label} · ${getLifelineName(findLifeline(message.from))} → ${getLifelineName(findLifeline(message.to))}${label ? ` · ${label}` : ''}`;

    return `
      <g class="seq-message" data-message-id="${esc(message.id)}">
        <title>${esc(title)}</title>
        ${geometry}
        ${labelMarkup}
      </g>
    `;
  }

  function buildEmptyMarkup() {
    const centerX = layout.width / 2;
    return `
      <g class="seq-empty" pointer-events="none">
        <text x="${fmt(centerX)}" y="164" text-anchor="middle" font-family="${SVG_SANS}" font-size="15" font-weight="600" fill="#98A2B3">还没有参与者</text>
        <text x="${fmt(centerX)}" y="188" text-anchor="middle" font-family="${SVG_SANS}" font-size="12" fill="#B4BDC9">点击右上角「新建参与者」或双击画布开始</text>
      </g>
    `;
  }

  function buildSceneMarkup(options = {}) {
    const selected = options.selection || null;
    const selectedLifelineId = selected && selected.kind === 'lifeline' ? selected.id : null;
    const selectedMessageId = selected && selected.kind === 'message' ? selected.id : null;
    const sourceId = state.tool === 'message' ? state.connect.sourceId : null;
    const activations = computeActivations();
    const parts = [];

    if (selectedLifelineId) {
      const column = layout.byId.get(selectedLifelineId);
      if (column) {
        parts.push(`<rect x="${fmt(column.left + 6)}" y="${fmt(layout.headerTop - 18)}" width="${fmt(column.width - 12)}" height="${fmt(layout.bottom - layout.headerTop + 36)}" rx="14" fill="${column.theme.accent}" opacity="0.05"></rect>`);
      }
    }

    parts.push(buildLifelinesMarkup(selectedLifelineId));
    parts.push(buildActivationsMarkup(activations));

    state.messages.forEach((message, index) => {
      parts.push(buildMessageMarkup(message, index, activations, message.id === selectedMessageId));
    });

    layout.columns.forEach((column) => {
      parts.push(buildHeaderMarkup(column, column.id === selectedLifelineId, column.id === sourceId));
    });

    if (!layout.columns.length) parts.push(buildEmptyMarkup());

    return parts.join('');
  }

  /* ------------------------------------------------------------------
     Rendering / view
     ------------------------------------------------------------------ */

  function applyView() {
    const width = els.canvas.clientWidth || 1;
    const height = els.canvas.clientHeight || 1;
    const { x, y, scale } = state.view;

    els.svg.setAttribute(
      'viewBox',
      `${fmt(-x / scale)} ${fmt(-y / scale)} ${fmt(width / scale)} ${fmt(height / scale)}`
    );
    els.svg.setAttribute('preserveAspectRatio', 'none');

    els.canvas.style.backgroundSize = `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`;
    els.canvas.style.backgroundPosition = `${x}px ${y}px`;
    els.zoomReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function render(options = {}) {
    layout = computeLayout();
    els.svg.innerHTML = SEQ_DEFS + buildSceneMarkup({ selection: state.selection });
    applyView();
    updateToolUI();
    updateModeBanner();
    if (options.inspector !== false) renderInspector();
    updateUndoButtons();
  }

  function getWorkArea() {
    const width = els.canvas.clientWidth || 1;
    const height = els.canvas.clientHeight || 1;
    const canvasRect = els.canvas.getBoundingClientRect();
    let left = 20;
    let right = width - 20;
    let top = 24;
    let bottom = height - 72;

    if (els.toolbar && els.toolbar.offsetWidth) {
      const rect = els.toolbar.getBoundingClientRect();
      left = Math.max(left, rect.right - canvasRect.left + 22);
    }
    if (els.inspector && els.inspector.offsetWidth) {
      const rect = els.inspector.getBoundingClientRect();
      right = Math.min(right, rect.left - canvasRect.left - 22);
    }

    if (right - left < 240) {
      left = Math.min(92, width * 0.2);
      right = width - 20;
    }
    if (bottom - top < 160) {
      top = 20;
      bottom = height - 52;
    }

    const areaWidth = Math.max(120, right - left);
    const areaHeight = Math.max(120, bottom - top);

    return {
      left,
      right,
      top,
      bottom,
      width: areaWidth,
      height: areaHeight,
      cx: left + areaWidth / 2,
      cy: top + areaHeight / 2
    };
  }

  function screenToWorld(clientX, clientY) {
    const rect = els.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - state.view.x) / state.view.scale,
      y: (clientY - rect.top - state.view.y) / state.view.scale
    };
  }

  function zoomAt(screenX, screenY, nextScale) {
    const oldScale = state.view.scale;
    const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    if (Math.abs(scale - oldScale) < 0.0005) return;

    const worldX = (screenX - state.view.x) / oldScale;
    const worldY = (screenY - state.view.y) / oldScale;
    state.view.scale = scale;
    state.view.x = screenX - worldX * scale;
    state.view.y = screenY - worldY * scale;
    applyView();
  }

  function zoomBy(factor) {
    const area = getWorkArea();
    zoomAt(area.cx, area.cy, state.view.scale * factor);
    scheduleSave();
  }

  function resetZoom() {
    const area = getWorkArea();
    zoomAt(area.cx, area.cy, 1);
    scheduleSave();
  }

  function ensureLifelineVisible(id) {
    if (!layout) return;
    const column = layout.byId.get(id);
    if (!column) return;

    const area = getWorkArea();
    const scale = state.view.scale;
    const left = column.left * scale + state.view.x;
    const right = (column.left + column.width) * scale + state.view.x;
    const padding = 14;

    if (right > area.right - padding) {
      state.view.x -= right - (area.right - padding);
    } else if (left < area.left + padding) {
      state.view.x += (area.left + padding) - left;
    } else {
      return;
    }

    applyView();
    scheduleSave();
  }

  function ensureMessageVisible(id) {
    if (!layout) return;
    const index = state.messages.findIndex((message) => message.id === id);
    if (index < 0) return;

    const area = getWorkArea();
    const screenY = layout.messageYs[index] * state.view.scale + state.view.y;
    const padding = 28;

    if (screenY > area.bottom - padding) {
      state.view.y -= screenY - (area.bottom - padding);
    } else if (screenY < area.top + padding) {
      state.view.y += (area.top + padding) - screenY;
    } else {
      return;
    }

    applyView();
    scheduleSave();
  }

  function fitToView(options = {}) {
    layout = layout || computeLayout();
    const bounds = computeBounds();
    const boundsWidth = Math.max(1, bounds.maxX - bounds.minX);
    const boundsHeight = Math.max(1, bounds.maxY - bounds.minY);
    const area = getWorkArea();
    const availableWidth = Math.max(120, area.width - 48);
    const availableHeight = Math.max(120, area.height - 48);
    const scale = clamp(
      Math.min(availableWidth / boundsWidth, availableHeight / boundsHeight),
      MIN_SCALE,
      1.15
    );

    state.view.scale = scale;
    state.view.x = area.left + (area.width - boundsWidth * scale) / 2 - bounds.minX * scale;
    state.view.y = area.top + (area.height - boundsHeight * scale) / 2 - bounds.minY * scale;
    applyView();
    if (options.save !== false) scheduleSave();
  }

  /* ------------------------------------------------------------------
     Inspector
     ------------------------------------------------------------------ */

  function emptyInspectorHTML() {
    const lifelineCount = state.lifelines.length;
    const messageCount = state.messages.length;

    return `
      <div class="inspector-empty">
        <div class="empty-icon">${SEQ_EMPTY_ICON}</div>
        <h2 class="empty-title">选择参与者或消息以编辑</h2>
        <p class="empty-copy">点击参与者标题或消息查看属性。<br>双击空白画布可快速新建参与者。</p>
        <div class="stats">
          <div class="stat"><strong>${lifelineCount}</strong><span>参与者</span></div>
          <div class="stat"><strong>${messageCount}</strong><span>消息</span></div>
        </div>
        <div class="empty-divider"></div>
        <div class="shortcut-list">
          <div class="shortcut-row"><span>新建参与者</span><span><kbd>L</kbd></span></div>
          <div class="shortcut-row"><span>同步 / 异步 / 返回</span><span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd></span></div>
          <div class="shortcut-row"><span>删除所选</span><span><kbd>Delete</kbd></span></div>
          <div class="shortcut-row"><span>适应画布</span><span><kbd>F</kbd></span></div>
          <div class="shortcut-row"><span>撤销</span><span><kbd>Ctrl</kbd><kbd>Z</kbd></span></div>
        </div>
      </div>
    `;
  }

  function connectInspectorHTML() {
    const type = state.connect.type;
    const conf = MESSAGE_TYPES[type] || MESSAGE_TYPES.sync;
    const source = state.connect.sourceId ? findLifeline(state.connect.sourceId) : null;
    const sourceName = source ? getLifelineName(source) : '';

    return `
      <div class="inspector-empty">
        <div class="empty-icon">${MESSAGE_ICONS[type] || MESSAGE_ICONS.sync}</div>
        <h2 class="empty-title">${source ? '选择接收方' : '开始绘制消息'}</h2>
        <p class="empty-copy">${esc(conf.description)}<br>先点击发送方，再点击接收方；对同一参与者点击两次可创建自调用。按 <b>Esc</b> 可取消。</p>
        <div class="connect-steps">
          <div class="connect-step ${source ? 'done' : ''}">
            <span class="step-num">${source ? '✓' : '1'}</span>
            <span>${source ? esc(sourceName) : '点击发送方参与者'}</span>
          </div>
          <div class="connect-step">
            <span class="step-num">2</span>
            <span>点击接收方完成${esc(conf.short)}消息</span>
          </div>
        </div>
        <button class="btn ghost" type="button" data-seq-action="cancel-connect">取消绘制</button>
      </div>
    `;
  }

  function themeSwatchesHTML(selectedColor) {
    return THEME_ORDER.map((id) => {
      const theme = THEMES[id];
      const active = selectedColor === id;
      return `
        <button class="swatch${active ? ' active' : ''}"
                type="button"
                data-seq-color="${id}"
                style="--sw:${theme.accent}"
                title="${theme.label}"
                aria-label="主题色：${theme.label}"
                aria-pressed="${active}">
          ${CHECK_ICON}
        </button>
      `;
    }).join('');
  }

  function lifelineInspectorHTML(lifeline) {
    const kind = getKind(lifeline);
    const theme = getTheme(lifeline);
    const name = getLifelineName(lifeline);
    const index = state.lifelines.findIndex((item) => item.id === lifeline.id);
    const messageCount = state.messages.filter((message) => message.from === lifeline.id || message.to === lifeline.id).length;

    const kindOptions = LIFELINE_ORDER.map((key) => {
      const info = LIFELINE_KINDS[key];
      return `<option value="${key}" ${key === kind.key ? 'selected' : ''}>${info.label} · ${info.english}</option>`;
    }).join('');

    return `
      <div class="panel-head">
        <div class="panel-head-copy">
          <div class="panel-eyebrow">
            <span class="panel-chip-dot" style="--chip:${theme.accent}"></span>
            <span>${esc(kind.label)}</span>
          </div>
          <div class="panel-title" id="seqInspectorTitle">${esc(name)}</div>
          <div class="panel-subtitle">${messageCount} 条消息 · 自动保存</div>
        </div>
        <button class="icon-btn danger-hover" type="button" data-seq-action="delete-lifeline" title="删除参与者" aria-label="删除参与者">
          ${TRASH_ICON}
        </button>
      </div>
      <div class="panel-scroll">
        <div class="field">
          <label for="seqLifelineName">名称</label>
          <input id="seqLifelineName" data-seq-field="name" type="text" value="${esc(lifeline.name)}" maxlength="120" autocomplete="off" spellcheck="false" placeholder="Participant">
        </div>

        <div class="field">
          <label for="seqLifelineKind">参与者类型</label>
          <select id="seqLifelineKind" data-seq-field="kind">${kindOptions}</select>
          <p class="field-help">${esc(kind.description)}</p>
        </div>

        <div class="field">
          <span class="field-label">主题色</span>
          <div class="swatches">${themeSwatchesHTML(lifeline.color)}</div>
        </div>

        <div class="field">
          <span class="field-label">排列顺序</span>
          <div class="field-row seq-order-row">
            <button class="btn ghost" type="button" data-seq-action="move-lifeline-left" ${index <= 0 ? 'disabled' : ''}>← 左移</button>
            <button class="btn ghost" type="button" data-seq-action="move-lifeline-right" ${index >= state.lifelines.length - 1 ? 'disabled' : ''}>右移 →</button>
          </div>
        </div>

        <div class="panel-tip">
          拖动参与者标题可直接调整顺序。<br>
          下方的虚线是生命线，消息会按添加顺序自上而下排列。
        </div>
      </div>
    `;
  }

  function messageInspectorHTML(message) {
    const conf = MESSAGE_TYPES[message.type] || MESSAGE_TYPES.sync;
    const from = findLifeline(message.from);
    const to = findLifeline(message.to);
    const fromName = getLifelineName(from);
    const toName = getLifelineName(to);
    const fromTheme = getTheme(from);
    const toTheme = getTheme(to);
    const index = state.messages.findIndex((item) => item.id === message.id);

    const typeOptions = MESSAGE_ORDER.map((key) => {
      const info = MESSAGE_TYPES[key];
      return `<option value="${key}" ${key === message.type ? 'selected' : ''}>${info.label} · ${info.english}</option>`;
    }).join('');

    const lifelineOptions = (selectedId) => state.lifelines.map((lifeline) => (
      `<option value="${esc(lifeline.id)}" ${lifeline.id === selectedId ? 'selected' : ''}>${esc(getLifelineName(lifeline))}</option>`
    )).join('');

    return `
      <div class="panel-head">
        <div class="panel-head-copy">
          <div class="panel-eyebrow">
            <span class="panel-chip-dot" style="--chip:${ACCENT}"></span>
            <span>${esc(conf.short)}消息</span>
          </div>
          <div class="panel-title" id="seqInspectorTitle">${esc(fromName)} → ${esc(toName)}</div>
          <div class="panel-subtitle">第 ${index + 1} 条消息 · 自动保存</div>
        </div>
        <button class="icon-btn danger-hover" type="button" data-seq-action="delete-message" title="删除消息" aria-label="删除消息">
          ${TRASH_ICON}
        </button>
      </div>
      <div class="panel-scroll">
        <div class="endpoint-card">
          <div class="endpoint" title="${esc(fromName)}">
            <span class="endpoint-dot" style="--dot:${fromTheme.accent}"></span>
            <span class="endpoint-name">${esc(fromName)}</span>
          </div>
          <span class="endpoint-arrow">${ARROW_ICON}</span>
          <div class="endpoint" title="${esc(toName)}">
            <span class="endpoint-dot" style="--dot:${toTheme.accent}"></span>
            <span class="endpoint-name">${esc(toName)}</span>
          </div>
          <button class="swap-btn" type="button" data-seq-action="swap-message" title="交换发送方与接收方" aria-label="交换发送方与接收方">
            ${SWAP_ICON}
          </button>
        </div>

        <div class="field">
          <label for="seqMessageName">消息内容</label>
          <input id="seqMessageName" data-seq-field="name" type="text" value="${esc(message.name)}" maxlength="200" autocomplete="off" spellcheck="false" placeholder="如 POST /login">
        </div>

        <div class="field">
          <label for="seqMessageType">消息类型</label>
          <select id="seqMessageType" data-seq-field="type">${typeOptions}</select>
          <p class="field-help">${esc(conf.description)}</p>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="seqMessageFrom">发送方</label>
            <select id="seqMessageFrom" data-seq-field="from">${lifelineOptions(message.from)}</select>
          </div>
          <div class="field">
            <label for="seqMessageTo">接收方</label>
            <select id="seqMessageTo" data-seq-field="to">${lifelineOptions(message.to)}</select>
          </div>
        </div>

        <div class="field">
          <span class="field-label">顺序</span>
          <div class="field-row seq-order-row">
            <button class="btn ghost" type="button" data-seq-action="move-message-up" ${index <= 0 ? 'disabled' : ''}>↑ 上移</button>
            <button class="btn ghost" type="button" data-seq-action="move-message-down" ${index >= state.messages.length - 1 ? 'disabled' : ''}>↓ 下移</button>
          </div>
        </div>

        <div class="panel-tip">
          消息按添加顺序自上而下排列。拖动消息线，或使用上移 / 下移调整顺序。<br>
          同步消息会自动生成接收方的激活条。
        </div>
      </div>
    `;
  }

  function renderInspector() {
    if (state.selection) {
      if (state.selection.kind === 'lifeline') {
        const lifeline = findLifeline(state.selection.id);
        if (!lifeline) {
          state.selection = null;
        } else {
          els.inspector.classList.remove('is-empty');
          els.inspector.innerHTML = lifelineInspectorHTML(lifeline);
          return;
        }
      } else if (state.selection.kind === 'message') {
        const message = findMessage(state.selection.id);
        if (!message) {
          state.selection = null;
        } else {
          els.inspector.classList.remove('is-empty');
          els.inspector.innerHTML = messageInspectorHTML(message);
          return;
        }
      }
    }

    els.inspector.classList.add('is-empty');
    els.inspector.innerHTML = state.tool === 'message'
      ? connectInspectorHTML()
      : emptyInspectorHTML();
  }

  function updateInspectorMeta() {
    if (!state.selection) return;
    const title = els.inspector.querySelector('#seqInspectorTitle');
    if (!title) return;

    if (state.selection.kind === 'lifeline') {
      const lifeline = findLifeline(state.selection.id);
      if (lifeline) title.textContent = getLifelineName(lifeline);
    } else if (state.selection.kind === 'message') {
      const message = findMessage(state.selection.id);
      if (message) {
        title.textContent = `${getLifelineName(findLifeline(message.from))} → ${getLifelineName(findLifeline(message.to))}`;
      }
    }
  }

  /* ------------------------------------------------------------------
     Overlays / tools
     ------------------------------------------------------------------ */

  function updateToolUI() {
    els.toolbar.querySelectorAll('[data-seq-tool]').forEach((button) => {
      const active = button.dataset.seqTool === 'select' && state.tool === 'select';
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    els.toolbar.querySelectorAll('[data-seq-msg]').forEach((button) => {
      const active = state.tool === 'message' && state.connect.type === button.dataset.seqMsg;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    els.canvas.classList.toggle('message-mode', state.tool === 'message');
    els.canvas.classList.toggle('space-pan', state.spaceDown);
  }

  function updateModeBanner() {
    if (state.tool !== 'message' || !state.connect.type) {
      els.banner.classList.remove('visible');
      els.banner.setAttribute('aria-hidden', 'true');
      return;
    }

    const conf = MESSAGE_TYPES[state.connect.type] || MESSAGE_TYPES.sync;
    const source = state.connect.sourceId ? findLifeline(state.connect.sourceId) : null;

    els.bannerIcon.innerHTML = MESSAGE_ICONS[state.connect.type] || MESSAGE_ICONS.sync;
    els.bannerText.innerHTML = source
      ? `已选择 <strong>${esc(getLifelineName(source))}</strong> · 再点击接收方`
      : `<strong>${esc(conf.short)}消息</strong> · 先点击发送方参与者`;
    els.banner.classList.add('visible');
    els.banner.setAttribute('aria-hidden', 'false');
  }

  /* ------------------------------------------------------------------
     Selection & editing
     ------------------------------------------------------------------ */

  function selectElement(kind, id) {
    let next = null;
    if (kind === 'lifeline' && findLifeline(id)) next = { kind: 'lifeline', id };
    if (kind === 'message' && findMessage(id)) next = { kind: 'message', id };

    const current = state.selection;
    const same = (!next && !current)
      || (next && current && next.kind === current.kind && next.id === current.id);
    if (same) return;

    state.selection = next;
    render({ inspector: true });
  }

  function focusInspectorName() {
    requestAnimationFrame(() => {
      const input = els.inspector.querySelector('[data-seq-field="name"]');
      if (input) {
        input.focus();
        input.select();
      }
    });
  }

  function onInspectorInput(event) {
    const target = closestEl(event.target, '[data-seq-field]');
    if (!target) return;
    const field = target.dataset.seqField;
    const selection = state.selection;
    if (!selection) return;

    if (selection.kind === 'lifeline') {
      const lifeline = findLifeline(selection.id);
      if (!lifeline) return;

      if (field === 'name') {
        lifeline.name = target.value;
        render({ inspector: false });
        updateInspectorMeta();
        scheduleHistory();
        scheduleSave();
        return;
      }

      if (field === 'kind') {
        if (!Object.prototype.hasOwnProperty.call(LIFELINE_KINDS, target.value)) return;
        if (lifeline.kind === target.value) return;
        lifeline.kind = target.value;
        render({ inspector: true });
        commitHistory();
        scheduleSave();
      }
      return;
    }

    if (selection.kind === 'message') {
      const message = findMessage(selection.id);
      if (!message) return;

      if (field === 'name') {
        message.name = target.value;
        render({ inspector: false });
        updateInspectorMeta();
        scheduleHistory();
        scheduleSave();
        return;
      }

      if (field === 'type') {
        if (!Object.prototype.hasOwnProperty.call(MESSAGE_TYPES, target.value)) return;
        if (message.type === target.value) return;
        message.type = target.value;
      } else if (field === 'from') {
        if (!findLifeline(target.value) || message.from === target.value) return;
        message.from = target.value;
      } else if (field === 'to') {
        if (!findLifeline(target.value) || message.to === target.value) return;
        message.to = target.value;
      } else {
        return;
      }

      render({ inspector: true });
      commitHistory();
      scheduleSave();
    }
  }

  function onInspectorFocusOut(event) {
    const target = event.target;
    if (target instanceof Element && target.matches('[data-seq-field]')) {
      commitHistory();
    }
  }

  function onInspectorClick(event) {
    const colorButton = closestEl(event.target, '[data-seq-color]');
    if (colorButton) {
      if (!state.selection || state.selection.kind !== 'lifeline') return;
      const lifeline = findLifeline(state.selection.id);
      const color = colorButton.dataset.seqColor;
      if (!lifeline || !THEMES[color] || lifeline.color === color) return;
      lifeline.color = color;
      render({ inspector: true });
      commitHistory();
      scheduleSave();
      return;
    }

    const actionButton = closestEl(event.target, '[data-seq-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.seqAction;

    if (action === 'delete-lifeline') {
      deleteSelected();
      return;
    }
    if (action === 'delete-message') {
      deleteSelected();
      return;
    }
    if (action === 'move-lifeline-left' || action === 'move-lifeline-right') {
      moveLifeline(action === 'move-lifeline-left' ? -1 : 1);
      return;
    }
    if (action === 'move-message-up' || action === 'move-message-down') {
      moveMessage(action === 'move-message-up' ? -1 : 1);
      return;
    }
    if (action === 'swap-message') {
      if (!state.selection || state.selection.kind !== 'message') return;
      const message = findMessage(state.selection.id);
      if (!message) return;
      const from = message.from;
      message.from = message.to;
      message.to = from;
      render({ inspector: true });
      commitHistory();
      scheduleSave();
      return;
    }
    if (action === 'cancel-connect') {
      cancelMessageMode();
    }
  }

  /* ------------------------------------------------------------------
     Mutations
     ------------------------------------------------------------------ */

  function nextLifelineName() {
    const names = new Set(state.lifelines.map((lifeline) => String(lifeline.name || '').trim()));
    let index = 1;
    while (names.has(`对象${index}`)) index += 1;
    return `对象${index}`;
  }

  function addLifeline() {
    blurActiveEditor();

    const lifeline = {
      id: uid('l'),
      name: nextLifelineName(),
      kind: 'object',
      color: THEME_ORDER[state.lifelines.length % THEME_ORDER.length]
    };

    state.tool = 'select';
    state.connect = { type: null, sourceId: null };
    state.lifelines.push(lifeline);
    state.selection = { kind: 'lifeline', id: lifeline.id };

    render({ inspector: true });
    ensureLifelineVisible(lifeline.id);
    commitHistory();
    scheduleSave();
    focusInspectorName();
  }

  function deleteSelected() {
    const selection = state.selection;
    if (!selection) return;

    if (selection.kind === 'lifeline') {
      const lifeline = findLifeline(selection.id);
      if (!lifeline) return;
      const name = getLifelineName(lifeline);
      state.lifelines = state.lifelines.filter((item) => item.id !== selection.id);
      state.messages = state.messages.filter((message) => message.from !== selection.id && message.to !== selection.id);
      state.selection = null;
      render({ inspector: true });
      commitHistory();
      scheduleSave();
      showToast(`已删除「${name}」及其相关消息`, { label: '撤销', onClick: undo });
    } else if (selection.kind === 'message') {
      if (!findMessage(selection.id)) return;
      state.messages = state.messages.filter((item) => item.id !== selection.id);
      state.selection = null;
      render({ inspector: true });
      commitHistory();
      scheduleSave();
      showToast('已删除消息', { label: '撤销', onClick: undo });
    }
  }

  function moveLifeline(delta) {
    if (!state.selection || state.selection.kind !== 'lifeline') return;
    const index = state.lifelines.findIndex((item) => item.id === state.selection.id);
    if (index < 0) return;
    const next = clamp(index + delta, 0, state.lifelines.length - 1);
    if (next === index) return;
    const [lifeline] = state.lifelines.splice(index, 1);
    state.lifelines.splice(next, 0, lifeline);
    render({ inspector: true });
    commitHistory();
    scheduleSave();
  }

  function moveMessage(delta) {
    if (!state.selection || state.selection.kind !== 'message') return;
    const index = state.messages.findIndex((item) => item.id === state.selection.id);
    if (index < 0) return;
    const next = clamp(index + delta, 0, state.messages.length - 1);
    if (next === index) return;
    const [message] = state.messages.splice(index, 1);
    state.messages.splice(next, 0, message);
    render({ inspector: true });
    commitHistory();
    scheduleSave();
  }

  /* ------------------------------------------------------------------
     Message connection mode
     ------------------------------------------------------------------ */

  function startMessageMode(type) {
    if (!MESSAGE_TYPES[type]) return;
    if (!state.lifelines.length) {
      showToast('请先新建参与者');
      return;
    }
    if (state.tool === 'message' && state.connect.type === type) {
      cancelMessageMode();
      return;
    }

    blurActiveEditor();
    state.tool = 'message';
    state.connect = { type, sourceId: null };
    state.selection = null;
    render({ inspector: true });
  }

  function setSelectTool() {
    if (state.tool === 'message' || state.connect.type) {
      cancelMessageMode();
      return;
    }
    state.tool = 'select';
    updateToolUI();
    updateModeBanner();
  }

  function cancelMessageMode() {
    const wasConnecting = state.tool === 'message' || Boolean(state.connect.type);
    state.tool = 'select';
    state.connect = { type: null, sourceId: null };

    if (wasConnecting) {
      render({ inspector: true });
    } else {
      updateToolUI();
      updateModeBanner();
    }
  }

  function defaultMessageName(type) {
    if (type === 'return') return '返回';
    return `消息 ${state.messages.length + 1}`;
  }

  function handleConnectClick(lifelineId) {
    if (state.tool !== 'message' || !state.connect.type) return;
    if (!findLifeline(lifelineId)) return;

    if (!state.connect.sourceId) {
      state.connect.sourceId = lifelineId;
      render({ inspector: true });
      return;
    }

    const message = {
      id: uid('m'),
      type: state.connect.type,
      from: state.connect.sourceId,
      to: lifelineId,
      name: defaultMessageName(state.connect.type)
    };

    state.messages.push(message);
    state.selection = { kind: 'message', id: message.id };
    state.tool = 'select';
    state.connect = { type: null, sourceId: null };

    render({ inspector: true });
    ensureMessageVisible(message.id);
    commitHistory();
    scheduleSave();
  }

  /* ------------------------------------------------------------------
     Pointer interactions
     ------------------------------------------------------------------ */

  function onSvgPointerDown(event) {
    if (event.button !== 0 && event.button !== 1) return;

    const wantsPan = event.button === 1 || state.spaceDown;
    const messageEl = closestEl(event.target, '[data-message-id]');
    const lifelineEl = closestEl(event.target, '[data-lifeline-id]');

    if (!wantsPan && lifelineEl && !messageEl) {
      event.preventDefault();
      blurActiveEditor();

      if (state.tool === 'message') {
        handleConnectClick(lifelineEl.dataset.lifelineId);
        return;
      }

      const id = lifelineEl.dataset.lifelineId;
      const world = screenToWorld(event.clientX, event.clientY);
      selectElement('lifeline', id);

      state.drag = {
        mode: 'lifeline',
        pointerId: event.pointerId,
        id,
        startClientX: event.clientX,
        startWorldX: world.x,
        moved: false
      };
      return;
    }

    if (!wantsPan && messageEl) {
      event.preventDefault();
      blurActiveEditor();

      if (state.tool === 'message') {
        showToast('请点击参与者来创建消息');
        return;
      }

      const id = messageEl.dataset.messageId;
      const world = screenToWorld(event.clientX, event.clientY);
      selectElement('message', id);

      state.drag = {
        mode: 'message',
        pointerId: event.pointerId,
        id,
        startClientY: event.clientY,
        startWorldY: world.y,
        moved: false
      };
      return;
    }

    if (state.tool === 'message' && !wantsPan) {
      event.preventDefault();
      blurActiveEditor();
      cancelMessageMode();
      return;
    }

    event.preventDefault();
    blurActiveEditor();

    if (!wantsPan) selectElement(null);

    state.drag = {
      mode: 'pan',
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: state.view.x,
      originY: state.view.y,
      moved: false
    };
    els.canvas.classList.add('panning');
  }

  function onWindowPointerMove(event) {
    const drag = state.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (drag.mode === 'pan') {
      event.preventDefault();
      const dx = event.clientX - drag.startClientX;
      const dy = event.clientY - drag.startClientY;
      if (!drag.moved && Math.hypot(dx, dy) > 2) drag.moved = true;
      state.view.x = drag.originX + dx;
      state.view.y = drag.originY + dy;
      applyView();
      return;
    }

    if (drag.mode === 'lifeline') {
      const world = screenToWorld(event.clientX, event.clientY);
      if (!drag.moved && Math.abs(world.x - drag.startWorldX) < 8) return;
      drag.moved = true;

      const currentIndex = state.lifelines.findIndex((item) => item.id === drag.id);
      if (currentIndex < 0) return;

      let nearest = currentIndex;
      let best = Infinity;
      layout.columns.forEach((column, index) => {
        const distance = Math.abs(column.center - world.x);
        if (distance < best) {
          best = distance;
          nearest = index;
        }
      });

      if (nearest !== currentIndex) {
        event.preventDefault();
        const [lifeline] = state.lifelines.splice(currentIndex, 1);
        state.lifelines.splice(nearest, 0, lifeline);
        render({ inspector: false });
      }
      return;
    }

    if (drag.mode === 'message') {
      const world = screenToWorld(event.clientX, event.clientY);
      if (!drag.moved && Math.abs(world.y - drag.startWorldY) < 10) return;
      drag.moved = true;

      const currentIndex = state.messages.findIndex((item) => item.id === drag.id);
      if (currentIndex < 0) return;

      let nearest = currentIndex;
      let best = Infinity;
      layout.messageYs.forEach((rowY, index) => {
        const distance = Math.abs(rowY - world.y);
        if (distance < best) {
          best = distance;
          nearest = index;
        }
      });

      if (nearest !== currentIndex) {
        event.preventDefault();
        const [message] = state.messages.splice(currentIndex, 1);
        state.messages.splice(nearest, 0, message);
        render({ inspector: false });
      }
    }
  }

  function onWindowPointerUp(event) {
    const drag = state.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if ((drag.mode === 'lifeline' || drag.mode === 'message') && drag.moved) {
      commitHistory();
      scheduleSave();
      render({ inspector: true });
    } else if (drag.mode === 'pan' && drag.moved) {
      scheduleSave();
    }

    els.canvas.classList.remove('panning');
    state.drag = null;
  }

  function onWheel(event) {
    event.preventDefault();
    const rect = els.canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const normalizedDelta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    const factor = clamp(Math.exp(-normalizedDelta * 0.0015), 0.72, 1.36);
    zoomAt(screenX, screenY, state.view.scale * factor);
    scheduleSave();
  }

  function onDoubleClick(event) {
    if (state.tool === 'message') return;
    if (closestEl(event.target, '[data-lifeline-id]') || closestEl(event.target, '[data-message-id]')) return;
    event.preventDefault();
    addLifeline();
  }

  /* ------------------------------------------------------------------
     Menus, modal, toast
     ------------------------------------------------------------------ */

  function openMenu() {
    els.menu.hidden = false;
    els.menuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    els.menu.hidden = true;
    els.menuBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    if (els.menu.hidden) openMenu();
    else closeMenu();
  }

  function showConfirm(options = {}) {
    if (typeof els.confirmDialog.showModal !== 'function') {
      return Promise.resolve(window.confirm(options.message || options.title || '确认操作？'));
    }

    if (dialogResolve) {
      const previous = dialogResolve;
      dialogResolve = null;
      if (els.confirmDialog.open) els.confirmDialog.close();
      previous(false);
    }

    els.confirmTitle.textContent = options.title || '确认操作';
    els.confirmMessage.textContent = options.message || '';
    els.confirmOk.textContent = options.confirmLabel || '确定';
    els.confirmOk.className = options.tone === 'danger' ? 'btn danger' : 'btn primary';

    return new Promise((resolve) => {
      dialogResolve = resolve;
      if (!els.confirmDialog.open) els.confirmDialog.showModal();
      requestAnimationFrame(() => els.confirmCancel.focus());
    });
  }

  function settleConfirm(value) {
    const resolve = dialogResolve;
    dialogResolve = null;
    if (els.confirmDialog.open) els.confirmDialog.close();
    if (resolve) resolve(Boolean(value));
  }

  function showToast(message, action = null) {
    clearTimeout(toastTimer);
    els.toastMessage.textContent = message;
    toastActionHandler = action && typeof action.onClick === 'function' ? action.onClick : null;

    if (toastActionHandler) {
      els.toastAction.hidden = false;
      els.toastAction.textContent = action.label || '撤销';
    } else {
      els.toastAction.hidden = true;
      els.toastAction.textContent = '';
    }

    els.toast.classList.add('show');
    toastTimer = setTimeout(() => {
      els.toast.classList.remove('show');
    }, toastActionHandler ? 4600 : 2800);
  }

  function hideToast() {
    clearTimeout(toastTimer);
    els.toast.classList.remove('show');
  }

  /* ------------------------------------------------------------------
     File actions
     ------------------------------------------------------------------ */

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1600);
  }

  function dateSuffix() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  function exportJSON() {
    if (!state.lifelines.length) {
      showToast('画布上还没有参与者');
      return;
    }

    const payload = {
      version: 1,
      app: 'Classo',
      kind: 'sequence',
      exportedAt: new Date().toISOString(),
      lifelines: state.lifelines.map(cleanLifeline),
      messages: state.messages.map(cleanMessage)
    };

    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }),
      `sequence-diagram-${dateSuffix()}.json`
    );
    showToast('已导出 JSON');
  }

  function buildExportSVG() {
    if (!state.lifelines.length) return null;

    layout = computeLayout();
    const bounds = computeBounds();
    const padding = 56;
    const svgWidth = Math.ceil(bounds.maxX - bounds.minX + padding * 2);
    const svgHeight = Math.ceil(bounds.maxY - bounds.minY + padding * 2);
    const offsetX = padding - bounds.minX;
    const offsetY = padding - bounds.minY;
    const activations = computeActivations();
    const parts = [];

    parts.push(buildLifelinesMarkup(null));
    parts.push(buildActivationsMarkup(activations));
    state.messages.forEach((message, index) => {
      parts.push(buildMessageMarkup(message, index, activations, false));
    });
    layout.columns.forEach((column) => {
      parts.push(buildHeaderMarkup(column, false, false));
    });

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      ${SEQ_DEFS}
      <rect width="${svgWidth}" height="${svgHeight}" fill="#FFFFFF"></rect>
      <g transform="translate(${fmt(offsetX)} ${fmt(offsetY)})">
        ${parts.join('')}
      </g>
    </svg>`;

    return { svg, width: svgWidth, height: svgHeight };
  }

  function exportSVG() {
    const built = buildExportSVG();
    if (!built) {
      showToast('画布上还没有参与者');
      return;
    }
    const content = `<?xml version="1.0" encoding="UTF-8"?>\n${built.svg}`;
    downloadBlob(
      new Blob([content], { type: 'image/svg+xml;charset=utf-8' }),
      `sequence-diagram-${dateSuffix()}.svg`
    );
    showToast('已导出 SVG');
  }

  async function exportPNG() {
    const built = buildExportSVG();
    if (!built) {
      showToast('画布上还没有参与者');
      return;
    }

    try {
      const blob = await rasterizeSVG(built.svg, built.width, built.height);
      downloadBlob(blob, `sequence-diagram-${dateSuffix()}.png`);
      showToast('已导出 PNG');
    } catch (error) {
      console.error(error);
      showToast('PNG 导出失败，可以改用 SVG 导出');
    }
  }

  function rasterizeSVG(svg, width, height) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const image = new Image();

      image.onload = () => {
        try {
          const maxDimension = 8192;
          const maxPixels = 42_000_000;
          let scale = Math.min(2, maxDimension / Math.max(width, height));
          if (width * height * scale * scale > maxPixels) {
            scale = Math.sqrt(maxPixels / (width * height));
          }
          scale = Math.max(0.25, scale);

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(width * scale));
          canvas.height = Math.max(1, Math.round(height * scale));
          const context = canvas.getContext('2d');
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);

          canvas.toBlob((pngBlob) => {
            if (pngBlob) resolve(pngBlob);
            else reject(new Error('无法生成 PNG'));
          }, 'image/png');
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('无法解析导出的 SVG'));
      };

      image.src = url;
    });
  }

  function importFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        const data = normalizeSequence(parsed);
        if (!data) throw new Error('invalid sequence diagram');
        if (!data.lifelines.length) throw new Error('empty sequence diagram');

        commitHistory();
        state.lifelines = data.lifelines;
        state.messages = data.messages;
        state.selection = null;
        state.tool = 'select';
        state.connect = { type: null, sourceId: null };

        render({ inspector: true });
        fitToView({ save: false });
        commitHistory();
        persistNow();
        showToast(`已导入 ${data.lifelines.length} 个参与者`, { label: '撤销', onClick: undo });
      } catch (error) {
        console.error(error);
        showToast('导入失败：请检查 JSON 文件格式');
      } finally {
        els.fileInput.value = '';
      }
    };
    reader.onerror = () => {
      showToast('读取文件失败');
      els.fileInput.value = '';
    };
    reader.readAsText(file);
  }

  function hasContent() {
    return state.lifelines.length > 0 || state.messages.length > 0;
  }

  function loadSample() {
    const data = createSampleData();
    commitHistory();
    state.lifelines = data.lifelines;
    state.messages = data.messages;
    state.selection = null;
    state.tool = 'select';
    state.connect = { type: null, sourceId: null };
    render({ inspector: true });
    fitToView({ save: false });
    commitHistory();
    persistNow();
    showToast('时序图示例已载入', { label: '撤销', onClick: undo });
  }

  function clearCanvas() {
    commitHistory();
    state.lifelines = [];
    state.messages = [];
    state.selection = null;
    state.tool = 'select';
    state.connect = { type: null, sourceId: null };
    render({ inspector: true });
    commitHistory();
    scheduleSave();
    showToast('画布已清空', { label: '撤销', onClick: undo });
  }

  async function handleFileAction(action) {
    closeMenu();

    if (action === 'export-json') {
      exportJSON();
    } else if (action === 'export-svg') {
      exportSVG();
    } else if (action === 'export-png') {
      await exportPNG();
    } else if (action === 'import') {
      els.fileInput.click();
    } else if (action === 'load-sample') {
      if (hasContent()) {
        const confirmed = await showConfirm({
          title: '加载时序图示例？',
          message: '当前时序图将被示例内容替换，此操作仍可通过撤销恢复。',
          confirmLabel: '加载示例'
        });
        if (!confirmed) return;
      }
      loadSample();
    } else if (action === 'clear') {
      if (!hasContent()) {
        showToast('画布已经是空的');
        return;
      }
      const confirmed = await showConfirm({
        title: '清空画布？',
        message: '所有参与者和消息都会被删除。此操作可以通过撤销恢复。',
        confirmLabel: '清空画布',
        tone: 'danger'
      });
      if (!confirmed) return;
      clearCanvas();
    }
  }

  /* ------------------------------------------------------------------
     Keyboard & events
     ------------------------------------------------------------------ */

  function onKeyDown(event) {
    if (document.body.dataset.mode !== 'sequence') return;
    if (document.querySelector('dialog[open]')) return;

    if (event.key === 'Escape') {
      if (state.drag) {
        event.preventDefault();
        return;
      }
      if (!els.menu.hidden) {
        closeMenu();
        return;
      }
      if (isTextEditing(document.activeElement)) {
        document.activeElement.blur();
        return;
      }
      if (state.tool === 'message') {
        event.preventDefault();
        cancelMessageMode();
        return;
      }
      if (state.selection) {
        event.preventDefault();
        selectElement(null);
      }
      return;
    }

    const meta = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    if (meta && key === 's') {
      event.preventDefault();
      persistNow({ notify: true });
      return;
    }

    if (isTextEditing(document.activeElement)) return;

    if (meta && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if (meta && key === 'y') {
      event.preventDefault();
      redo();
      return;
    }

    if (meta || event.altKey) return;

    if (event.code === 'Space') {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'BUTTON' || tag === 'A' || tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') {
        return;
      }
      if (!event.repeat) {
        state.spaceDown = true;
        els.canvas.classList.add('space-pan');
      }
      event.preventDefault();
      return;
    }

    if (key === 'v' && !event.repeat) {
      event.preventDefault();
      setSelectTool();
      return;
    }
    if (key === 'l' && !event.repeat) {
      event.preventDefault();
      addLifeline();
      return;
    }
    if (key === 'f' && !event.repeat) {
      event.preventDefault();
      fitToView();
      return;
    }
    if (key === '1' && !event.repeat) {
      event.preventDefault();
      startMessageMode('sync');
      return;
    }
    if (key === '2' && !event.repeat) {
      event.preventDefault();
      startMessageMode('async');
      return;
    }
    if (key === '3' && !event.repeat) {
      event.preventDefault();
      startMessageMode('return');
      return;
    }
    if (key === 'delete' || key === 'backspace') {
      if (state.selection) {
        event.preventDefault();
        deleteSelected();
      }
      return;
    }
    if (key === '+' || key === '=') {
      event.preventDefault();
      zoomBy(1.2);
      return;
    }
    if (key === '-') {
      event.preventDefault();
      zoomBy(1 / 1.2);
      return;
    }

    if (event.key.startsWith('Arrow') && state.selection) {
      if (state.selection.kind === 'message') {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          moveMessage(-1);
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          moveMessage(1);
        }
      } else if (state.selection.kind === 'lifeline') {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          moveLifeline(-1);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          moveLifeline(1);
        }
      }
    }
  }

  function onKeyUp(event) {
    if (event.code === 'Space') {
      state.spaceDown = false;
      els.canvas.classList.remove('space-pan');
    }
  }

  function bindEvents() {
    els.addBtn.addEventListener('click', addLifeline);
    els.undoBtn.addEventListener('click', undo);
    els.redoBtn.addEventListener('click', redo);

    els.menuBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleMenu();
    });

    els.menu.addEventListener('click', (event) => {
      const item = closestEl(event.target, '[data-action]');
      if (!item) return;
      handleFileAction(item.dataset.action);
    });

    document.addEventListener('pointerdown', (event) => {
      if (!els.menu.hidden && !els.menuWrap.contains(event.target)) closeMenu();
    });

    els.fileInput.addEventListener('change', () => {
      const file = els.fileInput.files && els.fileInput.files[0];
      if (file) importFile(file);
    });

    els.zoomOut.addEventListener('click', () => zoomBy(1 / 1.2));
    els.zoomIn.addEventListener('click', () => zoomBy(1.2));
    els.zoomReset.addEventListener('click', resetZoom);
    els.fitBtn.addEventListener('click', () => fitToView());

    els.toolbar.addEventListener('click', (event) => {
      const messageButton = closestEl(event.target, '[data-seq-msg]');
      if (messageButton) {
        startMessageMode(messageButton.dataset.seqMsg);
        return;
      }
      const toolButton = closestEl(event.target, '[data-seq-tool]');
      if (toolButton && toolButton.dataset.seqTool === 'select') {
        setSelectTool();
      }
    });

    els.bannerCancel.addEventListener('click', cancelMessageMode);

    els.inspector.addEventListener('input', onInspectorInput);
    els.inspector.addEventListener('change', (event) => {
      if (event.target instanceof Element && event.target.matches('select[data-seq-field]')) {
        onInspectorInput(event);
      }
    });
    els.inspector.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.isComposing
        && event.target instanceof Element && event.target.matches('input[data-seq-field="name"]')) {
        event.preventDefault();
        event.target.blur();
      }
    });
    els.inspector.addEventListener('focusout', onInspectorFocusOut);
    els.inspector.addEventListener('click', onInspectorClick);

    els.svg.addEventListener('pointerdown', onSvgPointerDown);
    els.svg.addEventListener('dblclick', onDoubleClick);
    els.canvas.addEventListener('wheel', onWheel, { passive: false });

    window.addEventListener('pointermove', onWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerUp);
    window.addEventListener('resize', applyView);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', () => {
      state.spaceDown = false;
      els.canvas.classList.remove('space-pan');
    });

    els.toastAction.addEventListener('click', () => {
      const handler = toastActionHandler;
      hideToast();
      toastActionHandler = null;
      if (handler) handler();
    });

    els.confirmCancel.addEventListener('click', () => settleConfirm(false));
    els.confirmOk.addEventListener('click', () => settleConfirm(true));
    els.confirmDialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      settleConfirm(false);
    });
    els.confirmDialog.addEventListener('click', (event) => {
      if (event.target === els.confirmDialog) settleConfirm(false);
    });

    window.addEventListener('classo:activechange', (event) => {
      if (!event.detail || event.detail.kind !== 'sequence') return;
      if (event.detail.id === currentLibraryId) return;
      reloadActiveDiagram();
    });

    window.addEventListener('beforeunload', () => {
      if (storageBroken) return;
      persistNow();
    });

    window.addEventListener('classo:modechange', (event) => {
      if (event.detail && event.detail.mode === 'sequence') {
        applyView();
      }
    });
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */

  function init() {
    if (!els.workspace || !els.svg) return;

    bindEvents();

    const restored = loadFromStorage();

    if (restored) {
      state.lifelines = restored.data.lifelines;
      state.messages = restored.data.messages;
      state.view = restored.view || { x: 0, y: 0, scale: 1 };

      render({ inspector: true });
      initHistory();

      if (!restored.view) {
        requestAnimationFrame(() => fitToView({ save: false }));
      } else {
        applyView();
      }

      updateUndoButtons();
      setSaveState('saved', '已保存');
      els.saveState.title = '已恢复上次编辑';
    } else {
      const sample = createSampleData();
      state.lifelines = sample.lifelines;
      state.messages = sample.messages;

      render({ inspector: true });
      initHistory();
      applyView();

      requestAnimationFrame(() => {
        fitToView({ save: false });
        persistNow();
        if (document.body.dataset.mode === 'sequence') {
          setTimeout(() => showToast('已载入时序图示例 · 所有更改会自动保存'), 500);
        }
      });
    }
  }

  window.ClassoEditors = window.ClassoEditors || {};
  window.ClassoEditors.sequence = {
    flush: () => persistNow(),
    reload: () => reloadActiveDiagram()
  };

  init();
})();
