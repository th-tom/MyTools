(() => {
  'use strict';

  /* ------------------------------------------------------------------
     Constants
     ------------------------------------------------------------------ */

  const STORAGE_KEY = 'classo.uml.class-diagram.v1';
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

  const ELEMENT_TYPES = {
    class: {
      label: '类',
      english: 'Class',
      keyword: '',
      description: '普通类，可包含属性和方法。',
      hasAttributes: true,
      hasMethods: true,
      hasLiterals: false,
      italicName: false
    },
    interface: {
      label: '接口',
      english: 'Interface',
      keyword: 'interface',
      description: '接口在图中显示 «interface» 标记，可定义属性和方法；属性通常为公开常量。',
      hasAttributes: true,
      hasMethods: true,
      hasLiterals: false,
      italicName: false
    },
    abstract: {
      label: '抽象类',
      english: 'Abstract Class',
      keyword: 'abstract',
      description: '抽象类在图中显示 «abstract» 标记，名称同时以斜体显示。',
      hasAttributes: true,
      hasMethods: true,
      hasLiterals: false,
      italicName: true
    },
    enum: {
      label: '枚举',
      english: 'Enumeration',
      keyword: 'enumeration',
      description: '枚举在图中显示 «enumeration» 标记，使用枚举值列表。',
      hasAttributes: false,
      hasMethods: false,
      hasLiterals: true,
      italicName: false
    }
  };
  const ELEMENT_TYPE_ORDER = ['class', 'interface', 'abstract', 'enum'];

  const MEMBER_VISIBILITIES = [
    { value: '+', label: '公开' },
    { value: '-', label: '私有' },
    { value: '#', label: '保护' },
    { value: '~', label: '包级' }
  ];

  const VISIBILITY_WORDS = {
    public: '+',
    private: '-',
    protected: '#',
    package: '~',
    internal: '~'
  };

  const RELATIONSHIP = {
    association: {
      label: '关联',
      hint: '点击起点元素，再点击目标元素',
      dashed: false,
      end: 'open'
    },
    inheritance: {
      label: '继承',
      hint: '先点击子类，再点击父类',
      dashed: false,
      end: 'triangle'
    },
    realization: {
      label: '实现',
      hint: '先点击实现类，再点击接口',
      dashed: true,
      end: 'triangle'
    },
    aggregation: {
      label: '聚合',
      hint: '先点击整体，再点击部分',
      dashed: false,
      start: 'diamond'
    },
    composition: {
      label: '组合',
      hint: '先点击整体，再点击部分',
      dashed: false,
      start: 'diamondFilled'
    },
    dependency: {
      label: '依赖',
      hint: '先点击使用方，再点击被依赖元素',
      dashed: true,
      end: 'open'
    }
  };

  const REL_ICONS = {
    association: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h13"></path><path d="m13 8 4 4-4 4"></path></svg>`,
    inheritance: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h8"></path><path d="M11 6.5 18 12l-7 5.5V6.5z"></path></svg>`,
    realization: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h8" stroke-dasharray="3 2.5"></path><path d="M11 6.5 18 12l-7 5.5V6.5z"></path></svg>`,
    aggregation: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m3 12 4.5-3.5L12 12l-4.5 3.5L3 12z"></path><path d="M12 12h9"></path></svg>`,
    composition: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m3 12 4.5-3.5L12 12l-4.5 3.5L3 12z" fill="currentColor"></path><path d="M12 12h9"></path></svg>`,
    dependency: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h13" stroke-dasharray="3 2.5"></path><path d="m13 8 4 4-4 4"></path></svg>`
  };

  const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7"></path><path d="M10 11v5M14 11v5"></path></svg>`;
  const SWAP_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13m0 0-3-3m3 3-3 3"></path><path d="M20 16H7m0 0 3-3m-3 3 3 3"></path></svg>`;
  const CHECK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4.5 4.5L19 7"></path></svg>`;
  const ARROW_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m14 7 5 5-5 5"></path></svg>`;
  const EMPTY_ICON = `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="8" width="17" height="22" rx="3.2"></rect><path d="M6 14.5h17M11 14.5V30"></path><rect x="26" y="18" width="16" height="21" rx="3.2"></rect><path d="M26 24h16M30.5 24v15"></path><path d="M23 28h3"></path></svg>`;

  const FONT_NAME = '650 14px "Inter", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  const FONT_STEREO = '500 10px "Inter", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  const FONT_MEMBER = '430 12px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
  const FONT_LABEL = '500 11.5px "Inter", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  const FONT_MULT = '430 10.5px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';

  const SVG_SANS = `Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif`;
  const SVG_MONO = `ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace`;

  const SCALE_MARKERS = {
    open: 'open',
    triangle: 'triangle',
    diamond: 'diamond',
    diamondFilled: 'diamond-filled'
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    canvas: $('canvas'),
    nodePan: $('nodePan'),
    nodeLayer: $('nodeLayer'),
    edgeSvg: $('edgeSvg'),
    edgeRoot: $('edgeRoot'),
    previewRoot: $('previewRoot'),
    guideRoot: $('guideRoot'),
    toolbar: $('toolbar'),
    inspector: $('inspector'),
    saveState: $('saveState'),
    saveText: $('saveText'),
    undoBtn: $('undoBtn'),
    redoBtn: $('redoBtn'),
    addClassBtn: $('addClassBtn'),
    menuWrap: $('menuWrap'),
    fileMenuBtn: $('fileMenuBtn'),
    fileMenu: $('fileMenu'),
    fileInput: $('fileInput'),
    zoomOut: $('zoomOut'),
    zoomIn: $('zoomIn'),
    zoomReset: $('zoomReset'),
    fitBtn: $('fitBtn'),
    modeBanner: $('modeBanner'),
    modeIcon: $('modeIcon'),
    modeText: $('modeText'),
    modeCancel: $('modeCancel'),
    toast: $('toast'),
    toastMessage: $('toastMessage'),
    toastAction: $('toastAction'),
    confirmDialog: $('confirmDialog'),
    confirmTitle: $('confirmTitle'),
    confirmMessage: $('confirmMessage'),
    confirmCancel: $('confirmCancel'),
    confirmOk: $('confirmOk')
  };

  const measureCtx = document.createElement('canvas').getContext('2d');

  const state = {
    classes: [],
    relations: [],
    selection: null,
    tool: 'select',
    connect: { type: null, sourceId: null },
    view: { x: 0, y: 0, scale: 1 },
    drag: null,
    spaceDown: false
  };

  let nodeEls = new Map();
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
  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

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
    if (active && els.inspector.contains(active) && isTextEditing(active)) {
      active.blur();
    }
  }

  function blurFocusBeforeCanvasInteraction() {
    const active = document.activeElement;
    if (active && active !== document.body && active !== document.documentElement) {
      active.blur();
    }
  }

  function cleanStereotype(value) {
    return String(value ?? '').replace(/[«»]/g, '').trim();
  }

  function getClassName(cls) {
    return cls && cls.name && cls.name.trim() ? cls.name.trim() : '未命名元素';
  }

  function getTheme(cls) {
    return THEMES[cls && cls.color] || THEMES.slate;
  }

  function mapElementType(value) {
    const key = String(value ?? '').trim().toLowerCase().replace(/[\s_-]/g, '');
    if (key === 'class') return 'class';
    if (key === 'interface') return 'interface';
    if (key === 'abstract' || key === 'abstractclass') return 'abstract';
    if (key === 'enum' || key === 'enumeration' || key === 'enums') return 'enum';
    return null;
  }

  function normalizeElementType(value) {
    return mapElementType(value) || 'class';
  }

  function deriveElementType(source) {
    const mapped = mapElementType(source.type);
    if (mapped) return mapped;

    const stereotype = cleanStereotype(source.stereotype).toLowerCase();
    if (stereotype === 'interface') return 'interface';
    if (stereotype === 'enum' || stereotype === 'enumeration' || stereotype === 'enums') return 'enum';
    if (source.abstract === true || source.abstract === 'true') return 'abstract';
    return 'class';
  }

  function getElementTypeInfo(input) {
    const rawType = typeof input === 'string' ? input : input && input.type;
    const type = normalizeElementType(rawType);
    return { type, ...ELEMENT_TYPES[type] };
  }

  function elementTypeOptionsHTML(selected) {
    return ELEMENT_TYPE_ORDER.map((type) => {
      const info = ELEMENT_TYPES[type];
      return `<option value="${type}" ${type === selected ? 'selected' : ''}>${info.label} · ${info.english}</option>`;
    }).join('');
  }

  function findClass(id) {
    return state.classes.find((cls) => cls.id === id) || null;
  }

  function findRelation(id) {
    return state.relations.find((rel) => rel.id === id) || null;
  }

  function parseMemberLines(value) {
    return String(value ?? '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 120);
  }

  function defaultVisibility(kind) {
    return kind === 'method' ? '+' : '-';
  }

  function parseMemberLine(line, kind) {
    let text = String(line ?? '').trim();
    let visibility = defaultVisibility(kind);
    let isVirtual = false;
    let isAbstract = false;

    if (kind === 'method') {
      let hadFlags = false;
      text = text.replace(/\{\s*(virtual|abstract)\s*\}/gi, (match, flag) => {
        hadFlags = true;
        if (flag.toLowerCase() === 'virtual') isVirtual = true;
        else isAbstract = true;
        return ' ';
      });
      if (hadFlags) text = text.replace(/[ \t]+/g, ' ').trim();
    }

    const symbolMatch = text.match(/^([+\-#~])\s*/);
    if (symbolMatch) {
      visibility = symbolMatch[1];
      text = text.slice(symbolMatch[0].length).trim();
    } else {
      const wordMatch = text.match(/^(public|private|protected|package|internal)\b\s*/i);
      if (wordMatch) {
        visibility = VISIBILITY_WORDS[wordMatch[1].toLowerCase()] || visibility;
        text = text.slice(wordMatch[0].length).trim();
      }
    }

    if (kind === 'method') {
      let modifierMatch;
      while ((modifierMatch = text.match(/^(virtual|abstract)\b\s*/i))) {
        if (modifierMatch[1].toLowerCase() === 'virtual') isVirtual = true;
        else isAbstract = true;
        text = text.slice(modifierMatch[0].length).trim();
      }
    }

    if (kind === 'method') {
      const openIndex = text.indexOf('(');
      if (openIndex >= 0) {
        const closeIndex = text.lastIndexOf(')');
        const name = text.slice(0, openIndex).trim();
        let params = '';
        let returnType = '';
        if (closeIndex > openIndex) {
          params = text.slice(openIndex + 1, closeIndex).trim();
          returnType = text.slice(closeIndex + 1).trim();
        } else {
          params = text.slice(openIndex + 1).trim();
        }
        returnType = returnType.replace(/^:\s*/, '').trim();
        return { visibility, name, params, returnType, virtual: isVirtual, abstract: isAbstract };
      }

      const colonIndex = text.indexOf(':');
      if (colonIndex >= 0) {
        return {
          visibility,
          name: text.slice(0, colonIndex).trim(),
          params: '',
          returnType: text.slice(colonIndex + 1).trim(),
          virtual: isVirtual,
          abstract: isAbstract
        };
      }
      return {
        visibility,
        name: text,
        params: '',
        returnType: '',
        virtual: isVirtual,
        abstract: isAbstract
      };
    }

    const colonIndex = text.indexOf(':');
    if (colonIndex >= 0) {
      return {
        visibility,
        name: text.slice(0, colonIndex).trim(),
        type: text.slice(colonIndex + 1).trim()
      };
    }
    return { visibility, name: text, type: '' };
  }

  function serializeMember(member, kind) {
    const visibility = MEMBER_VISIBILITIES.some((item) => item.value === member.visibility)
      ? member.visibility
      : defaultVisibility(kind);
    const fallbackName = kind === 'method' ? 'method' : 'field';
    const name = String(member.name ?? '').trim() || fallbackName;
    const stripColon = (value) => String(value ?? '').trim().replace(/^:\s*/, '');

    if (kind === 'method') {
      let params = String(member.params ?? '').trim();
      if (params.startsWith('(') && params.endsWith(')')) {
        params = params.slice(1, -1).trim();
      }
      const returnType = stripColon(member.returnType);
      const marks = [];
      if (member.virtual) marks.push('virtual');
      if (member.abstract) marks.push('abstract');
      const markerText = marks.length ? `${marks.join(' ')} ` : '';
      return `${visibility} ${markerText}${name}(${params})${returnType ? `: ${returnType}` : ''}`;
    }

    const type = stripColon(member.type);
    return `${visibility} ${name}${type ? `: ${type}` : ''}`;
  }

  function isAbstractMethodLine(line) {
    return parseMemberLine(line, 'method').abstract === true;
  }

  function normalizeStoredMethodLine(line) {
    if (!/\{\s*(virtual|abstract)\s*\}/i.test(line)) return line;
    return serializeMember(parseMemberLine(line, 'method'), 'method');
  }

  function splitParameterList(value) {
    const source = String(value ?? '').trim();
    if (!source) return [];

    const parts = [];
    let current = '';
    let depth = 0;
    let quote = null;

    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      if (quote) {
        current += char;
        if (char === quote && source[index - 1] !== '\\') quote = null;
        continue;
      }
      if (char === '"' || char === "'" || char === '`') {
        quote = char;
        current += char;
        continue;
      }
      if (char === '(' || char === '[' || char === '{' || char === '<') {
        depth += 1;
        current += char;
        continue;
      }
      if (char === ')' || char === ']' || char === '}' || char === '>') {
        depth = Math.max(0, depth - 1);
        current += char;
        continue;
      }
      if (char === ',' && depth === 0) {
        if (current.trim()) parts.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }

    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  function normalizeLineArray(value) {
    if (Array.isArray(value)) {
      return value
        .map((line) => String(line ?? '').trim())
        .filter(Boolean)
        .slice(0, 120);
    }
    if (typeof value === 'string') return parseMemberLines(value);
    return [];
  }

  function measureText(text, font) {
    measureCtx.font = font;
    return measureCtx.measureText(text).width;
  }

  function setSaveState(kind, label) {
    els.saveState.classList.remove('saving', 'error');
    if (kind === 'saving') els.saveState.classList.add('saving');
    if (kind === 'error') els.saveState.classList.add('error');
    els.saveText.textContent = label;
  }

  /* ------------------------------------------------------------------
     Layout measurement
     ------------------------------------------------------------------ */

  function computeClassLayout(cls) {
    const info = getElementTypeInfo(cls);
    const name = getClassName(cls);
    const attributes = info.hasAttributes && Array.isArray(cls.attributes) ? cls.attributes : [];
    const methods = info.hasMethods && Array.isArray(cls.methods) ? cls.methods : [];
    const literals = info.hasLiterals && Array.isArray(cls.literals) ? cls.literals : [];
    const keyword = info.keyword;

    let contentWidth = Math.max(120, measureText(name, FONT_NAME) + 8);
    if (keyword) {
      contentWidth = Math.max(contentWidth, measureText(`«${keyword}»`, FONT_STEREO) + 8);
    }

    for (const line of attributes) {
      contentWidth = Math.max(contentWidth, measureText(line, FONT_MEMBER));
    }
    for (const line of methods) {
      contentWidth = Math.max(contentWidth, measureText(line, FONT_MEMBER));
    }
    for (const line of literals) {
      contentWidth = Math.max(contentWidth, measureText(line, FONT_MEMBER));
    }

    const width = clamp(Math.ceil(contentWidth) + 56, 220, 560);
    const titleH = keyword ? 58 : 43;
    const attrH = info.hasAttributes ? 17 + 22 * Math.max(1, attributes.length) : 0;
    const methodH = info.hasMethods ? 17 + 22 * Math.max(1, methods.length) : 0;
    const literalH = info.hasLiterals ? 17 + 22 * Math.max(1, literals.length) : 0;
    const height = 2 + titleH + attrH + methodH + literalH;

    return { width, height, titleH, attrH, methodH, literalH, type: info.type };
  }

  function recomputeLayouts() {
    for (const cls of state.classes) {
      cls._layout = computeClassLayout(cls);
    }
  }

  /* ------------------------------------------------------------------
     Data normalisation / persistence
     ------------------------------------------------------------------ */

  function normalizeDiagram(raw) {
    if (Array.isArray(raw)) raw = { classes: raw, relations: [] };
    if (!raw || typeof raw !== 'object') return null;
    if (!Array.isArray(raw.classes) && !Array.isArray(raw.relations)) return null;

    const classes = [];
    const classIds = new Set();

    for (const source of Array.isArray(raw.classes) ? raw.classes : []) {
      if (!source || typeof source !== 'object') continue;
      let id = typeof source.id === 'string' && source.id ? source.id : uid('c');
      while (classIds.has(id)) id = uid('c');
      classIds.add(id);

      const x = Number(source.x);
      const y = Number(source.y);
      const color = typeof source.color === 'string' && THEMES[source.color] ? source.color : 'slate';

      classes.push({
        id,
        name: typeof source.name === 'string' ? source.name.slice(0, 120) : '',
        type: deriveElementType(source),
        color,
        x: Number.isFinite(x) ? x : 0,
        y: Number.isFinite(y) ? y : 0,
        attributes: normalizeLineArray(source.attributes),
        methods: normalizeLineArray(source.methods).map(normalizeStoredMethodLine),
        literals: normalizeLineArray(source.literals ?? source.enumValues ?? source.values)
      });
    }

    const relations = [];
    const relationIds = new Set();

    for (const source of Array.isArray(raw.relations) ? raw.relations : []) {
      if (!source || typeof source !== 'object') continue;
      const from = String(source.from ?? '');
      const to = String(source.to ?? '');
      if (!classIds.has(from) || !classIds.has(to) || from === to) continue;

      let id = typeof source.id === 'string' && source.id ? source.id : uid('r');
      while (relationIds.has(id)) id = uid('r');
      relationIds.add(id);

      const type = Object.prototype.hasOwnProperty.call(RELATIONSHIP, source.type)
        ? source.type
        : 'association';

      relations.push({
        id,
        type,
        from,
        to,
        label: typeof source.label === 'string' ? source.label.slice(0, 100) : '',
        fromMult: typeof source.fromMult === 'string' ? source.fromMult.slice(0, 30) : '',
        toMult: typeof source.toMult === 'string' ? source.toMult.slice(0, 30) : ''
      });
    }

    return { classes, relations };
  }

  function cleanClass(cls) {
    return {
      id: cls.id,
      name: cls.name,
      type: normalizeElementType(cls.type),
      color: cls.color,
      x: fmt(cls.x),
      y: fmt(cls.y),
      attributes: [...cls.attributes],
      methods: [...cls.methods],
      literals: [...(cls.literals || [])]
    };
  }

  function cleanRelation(rel) {
    return {
      id: rel.id,
      type: rel.type,
      from: rel.from,
      to: rel.to,
      label: rel.label,
      fromMult: rel.fromMult,
      toMult: rel.toMult
    };
  }

  function serializeData() {
    return JSON.stringify({
      classes: state.classes.map(cleanClass),
      relations: state.relations.map(cleanRelation)
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
      const active = library.getActive('class');
      const stored = active ? library.load(active.id) : null;
      const data = stored ? normalizeDiagram(stored.data) : null;
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
      const data = normalizeDiagram(parsed);
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
      classes: state.classes.map(cleanClass),
      relations: state.relations.map(cleanRelation)
    };
    const library = getLibrary();
    let librarySaved = true;

    try {
      if (library) {
        let target = currentLibraryId ? library.get(currentLibraryId) : null;
        if (!target) target = library.getActive('class');

        if (!target) {
          target = library.create('class', {
            name: library.suggestName('class', '我的类图'),
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

      const payload = JSON.parse(serializeData());
      payload.version = 1;
      payload.app = 'Classo';
      payload.savedAt = Date.now();
      payload.view = view;
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
      const active = library.getActive('class');
      const stored = active ? library.load(active.id) : null;
      const data = stored ? normalizeDiagram(stored.data) : null;

      state.selection = null;
      state.tool = 'select';
      state.connect = { type: null, sourceId: null };
      hideConnectPreview();
      renderGuides([]);

      if (!active || !data) {
        const created = library.create('class', {
          name: library.suggestName('class', '未命名类图'),
          data: { classes: [], relations: [] },
          view: null,
          activate: true,
          silent: true
        });

        currentLibraryId = created ? created.id : null;
        state.classes = [];
        state.relations = [];

        refreshAll({ inspector: true });
        initHistory();

        const area = getWorkArea();
        state.view = { x: area.cx, y: area.cy, scale: 1 };
        applyView();
        setSaveState('saved', '已保存');
        els.saveState.title = created ? `${created.name} · 已载入` : '已保存';
        return;
      }

      const view = normalizeView(stored.view);
      currentLibraryId = active.id;
      state.classes = data.classes;
      state.relations = data.relations;

      refreshAll({ inspector: true });
      initHistory();

      if (view) {
        state.view = view;
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
    history = [serializeData()];
    historyIndex = 0;
    updateUndoButtons();
  }

  function commitHistory() {
    clearTimeout(historyTimer);
    historyTimer = null;
    const snapshot = serializeData();

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
    const dirty = history[historyIndex] !== serializeData();
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

    state.classes = parsed.classes || [];
    state.relations = parsed.relations || [];
    state.tool = 'select';
    state.connect = { type: null, sourceId: null };
    hideConnectPreview();
    renderGuides([]);

    if (state.selection) {
      const exists = state.selection.kind === 'class'
        ? findClass(state.selection.id)
        : findRelation(state.selection.id);
      if (!exists) state.selection = null;
    }

    refreshAll({ inspector: true });
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
    if (history[historyIndex] !== serializeData()) {
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
      classes: [
        {
          id: 'sample-drawable',
          name: 'Drawable',
          type: 'interface',
          color: 'blue',
          x: 80,
          y: 60,
          attributes: [],
          methods: ['+ draw(ctx: Context): void', '+ bounds(): Box'],
          literals: []
        },
        {
          id: 'sample-shape',
          name: 'Shape',
          type: 'abstract',
          color: 'violet',
          x: 430,
          y: 40,
          attributes: ['# id: string', '# name: string'],
          methods: ['+ area(): number', '+ draw(): void'],
          literals: []
        },
        {
          id: 'sample-canvas',
          name: 'Canvas',
          type: 'class',
          color: 'rose',
          x: 800,
          y: 70,
          attributes: ['- shapes: Shape[]', '- selected: Shape | null'],
          methods: ['+ add(shape: Shape): void', '+ render(): void'],
          literals: []
        },
        {
          id: 'sample-rect',
          name: 'Rectangle',
          type: 'class',
          color: 'emerald',
          x: 220,
          y: 360,
          attributes: ['- width: number', '- height: number'],
          methods: ['+ area(): number'],
          literals: []
        },
        {
          id: 'sample-circle',
          name: 'Circle',
          type: 'class',
          color: 'amber',
          x: 610,
          y: 380,
          attributes: ['- radius: number'],
          methods: ['+ area(): number', '+ draw(): void'],
          literals: []
        }
      ],
      relations: [
        {
          id: 'sample-rel-realization',
          type: 'realization',
          from: 'sample-rect',
          to: 'sample-drawable',
          label: '',
          fromMult: '',
          toMult: ''
        },
        {
          id: 'sample-rel-inherit-rect',
          type: 'inheritance',
          from: 'sample-rect',
          to: 'sample-shape',
          label: '',
          fromMult: '',
          toMult: ''
        },
        {
          id: 'sample-rel-inherit-circle',
          type: 'inheritance',
          from: 'sample-circle',
          to: 'sample-shape',
          label: '',
          fromMult: '',
          toMult: ''
        },
        {
          id: 'sample-rel-aggregation',
          type: 'aggregation',
          from: 'sample-canvas',
          to: 'sample-shape',
          label: 'shapes',
          fromMult: '',
          toMult: ''
        }
      ]
    };
  }

  /* ------------------------------------------------------------------
     Rendering — class nodes
     ------------------------------------------------------------------ */

  function renderNodes() {
    const selection = state.selection;
    const parts = [];

    for (const cls of state.classes) {
      const info = getElementTypeInfo(cls);
      const layout = cls._layout || computeClassLayout(cls);
      const theme = getTheme(cls);
      const name = getClassName(cls);
      const isUnnamed = !cls.name || !cls.name.trim();
      const isSelected = selection && selection.kind === 'class' && selection.id === cls.id;
      const isConnectSource = state.tool === 'connect' && state.connect.sourceId === cls.id;

      const classes = [
        'class-node',
        `element-type-${info.type}`,
        isSelected ? 'selected' : '',
        info.italicName ? 'abstract' : '',
        isUnnamed ? 'is-unnamed' : '',
        isConnectSource ? 'connect-source' : ''
      ].filter(Boolean).join(' ');

      const sections = [];

      if (info.hasAttributes) {
        const rows = cls.attributes.length
          ? cls.attributes.map((line) => `<div class="member-row" title="${esc(line)}">${esc(line)}</div>`).join('')
          : '<div class="member-row empty">暂无属性</div>';
        sections.push(`<div class="class-section" style="height:${layout.attrH}px">${rows}</div>`);
      }

      if (info.hasMethods) {
        const rows = cls.methods.length
          ? cls.methods.map((line) => {
              const abstract = isAbstractMethodLine(line);
              return `<div class="member-row${abstract ? ' is-abstract' : ''}" title="${esc(line)}">${esc(line)}</div>`;
            }).join('')
          : '<div class="member-row empty">暂无方法</div>';
        sections.push(`<div class="class-section" style="height:${layout.methodH}px">${rows}</div>`);
      }

      if (info.hasLiterals) {
        const literals = Array.isArray(cls.literals) ? cls.literals : [];
        const rows = literals.length
          ? literals.map((line) => `<div class="member-row enum-literal" title="${esc(line)}">${esc(line)}</div>`).join('')
          : '<div class="member-row empty">暂无枚举值</div>';
        sections.push(`<div class="class-section" style="height:${layout.literalH}px">${rows}</div>`);
      }

      parts.push(`
        <div class="${classes}"
             data-id="${esc(cls.id)}"
             role="group"
             aria-label="${esc(info.label)} ${esc(name)}"
             title="拖动移动 · 双击编辑"
             style="left:${fmt(cls.x)}px;top:${fmt(cls.y)}px;width:${layout.width}px;height:${layout.height}px;--accent:${theme.accent};--tint:${theme.tint}">
          <div class="class-title" style="height:${layout.titleH}px">
            ${info.keyword ? `<div class="class-stereotype">«${esc(info.keyword)}»</div>` : ''}
            <div class="class-name">${esc(name)}</div>
          </div>
          ${sections.join('')}
        </div>
      `);
    }

    els.nodeLayer.innerHTML = parts.join('');
    nodeEls = new Map();
    els.nodeLayer.querySelectorAll('.class-node').forEach((el) => {
      nodeEls.set(el.dataset.id, el);
    });
  }

  /* ------------------------------------------------------------------
     Rendering — relationships
     ------------------------------------------------------------------ */

  function getRelationOffsets() {
    const groups = new Map();
    for (const rel of state.relations) {
      const key = rel.from < rel.to ? `${rel.from}::${rel.to}` : `${rel.to}::${rel.from}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(rel);
    }

    const offsets = new Map();
    for (const group of groups.values()) {
      const count = group.length;
      group.forEach((rel, index) => {
        offsets.set(rel.id, count > 1 ? (index - (count - 1) / 2) * 20 : 0);
      });
    }
    return offsets;
  }

  function simplifyPoints(points) {
    const output = [];
    for (const point of points) {
      const previous = output[output.length - 1];
      if (!previous || Math.abs(previous.x - point.x) > 0.01 || Math.abs(previous.y - point.y) > 0.01) {
        output.push({ x: point.x, y: point.y });
      }
    }

    let changed = true;
    while (changed && output.length > 2) {
      changed = false;
      for (let index = 1; index < output.length - 1; index += 1) {
        const a = output[index - 1];
        const b = output[index];
        const c = output[index + 1];
        const sameX = Math.abs(a.x - b.x) < 0.01 && Math.abs(b.x - c.x) < 0.01;
        const sameY = Math.abs(a.y - b.y) < 0.01 && Math.abs(b.y - c.y) < 0.01;
        if (sameX || sameY) {
          output.splice(index, 1);
          changed = true;
          break;
        }
      }
    }
    return output;
  }

  function roundedPath(points, radius = 10) {
    if (!points.length) return '';
    if (points.length === 1) return `M ${fmt(points[0].x)} ${fmt(points[0].y)}`;
    if (points.length === 2) {
      return `M ${fmt(points[0].x)} ${fmt(points[0].y)} L ${fmt(points[1].x)} ${fmt(points[1].y)}`;
    }

    let d = `M ${fmt(points[0].x)} ${fmt(points[0].y)}`;
    for (let index = 1; index < points.length - 1; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      const next = points[index + 1];
      const inLength = dist(previous, current);
      const outLength = dist(current, next);
      if (inLength < 0.01 || outLength < 0.01) continue;
      const r = Math.min(radius, inLength / 2, outLength / 2);
      const p1 = {
        x: current.x + ((previous.x - current.x) / inLength) * r,
        y: current.y + ((previous.y - current.y) / inLength) * r
      };
      const p2 = {
        x: current.x + ((next.x - current.x) / outLength) * r,
        y: current.y + ((next.y - current.y) / outLength) * r
      };
      d += ` L ${fmt(p1.x)} ${fmt(p1.y)} Q ${fmt(current.x)} ${fmt(current.y)} ${fmt(p2.x)} ${fmt(p2.y)}`;
    }
    const last = points[points.length - 1];
    d += ` L ${fmt(last.x)} ${fmt(last.y)}`;
    return d;
  }

  function buildRoute(rel, offset = 0) {
    const from = findClass(rel.from);
    const to = findClass(rel.to);
    if (!from || !to) return null;

    const a = from._layout;
    const b = to._layout;
    if (!a || !b) return null;

    const acx = from.x + a.width / 2;
    const acy = from.y + a.height / 2;
    const bcx = to.x + b.width / 2;
    const bcy = to.y + b.height / 2;
    const dx = bcx - acx;
    const dy = bcy - acy;

    const hGap = Math.abs(dx) - (a.width + b.width) / 2;
    const vGap = Math.abs(dy) - (a.height + b.height) / 2;
    const horizontal = hGap >= vGap;

    let start;
    let end;
    let points;

    if (horizontal) {
      const direction = dx >= 0 ? 1 : -1;
      const maxOffsetA = Math.max(0, a.height / 2 - 18);
      const maxOffsetB = Math.max(0, b.height / 2 - 18);
      const offsetA = clamp(dy * 0.2 + offset, -maxOffsetA, maxOffsetA);
      const offsetB = clamp(-dy * 0.2 + offset, -maxOffsetB, maxOffsetB);

      start = { x: direction > 0 ? from.x + a.width : from.x, y: acy + offsetA };
      end = { x: direction > 0 ? to.x : to.x + b.width, y: bcy + offsetB };

      if (Math.abs(start.y - end.y) < 0.5) {
        points = [start, end];
      } else {
        const midX = (start.x + end.x) / 2;
        points = [
          start,
          { x: midX, y: start.y },
          { x: midX, y: end.y },
          end
        ];
      }
    } else {
      const direction = dy >= 0 ? 1 : -1;
      const maxOffsetA = Math.max(0, a.width / 2 - 18);
      const maxOffsetB = Math.max(0, b.width / 2 - 18);
      const offsetA = clamp(dx * 0.2 + offset, -maxOffsetA, maxOffsetA);
      const offsetB = clamp(-dx * 0.2 + offset, -maxOffsetB, maxOffsetB);

      start = { x: acx + offsetA, y: direction > 0 ? from.y + a.height : from.y };
      end = { x: bcx + offsetB, y: direction > 0 ? to.y : to.y + b.height };

      if (Math.abs(start.x - end.x) < 0.5) {
        points = [start, end];
      } else {
        const midY = (start.y + end.y) / 2;
        points = [
          start,
          { x: start.x, y: midY },
          { x: end.x, y: midY },
          end
        ];
      }
    }

    points = simplifyPoints(points);
    return { points, d: roundedPath(points, 10) };
  }

  function polylineLength(points) {
    let length = 0;
    for (let index = 1; index < points.length; index += 1) {
      length += dist(points[index - 1], points[index]);
    }
    return length;
  }

  function pointAtDistance(points, distance) {
    if (!points.length) return { x: 0, y: 0 };
    if (points.length === 1) return { ...points[0] };
    const total = polylineLength(points);
    const target = clamp(distance, 0, total);
    let remaining = target;

    for (let index = 1; index < points.length; index += 1) {
      const a = points[index - 1];
      const b = points[index];
      const segment = dist(a, b);
      if (segment < 0.0001) continue;
      if (remaining <= segment) {
        const t = remaining / segment;
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      }
      remaining -= segment;
    }
    return { ...points[points.length - 1] };
  }

  function isHorizontalSegment(a, b) {
    return Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
  }

  function getLabelGeometry(points) {
    const total = polylineLength(points);
    const midpoint = pointAtDistance(points, total / 2);
    const before = pointAtDistance(points, Math.max(0, total / 2 - 3));
    const after = pointAtDistance(points, Math.min(total, total / 2 + 3));
    const horizontal = isHorizontalSegment(before, after);

    return horizontal
      ? { x: midpoint.x, y: midpoint.y - 9, anchor: 'middle', horizontal }
      : { x: midpoint.x + 11, y: midpoint.y, anchor: 'start', horizontal };
  }

  function getEndpointLabelPositions(points) {
    const total = polylineLength(points);
    const inset = Math.min(26, total * 0.35);

    const startPoint = pointAtDistance(points, inset);
    const startNear = pointAtDistance(points, Math.max(0, inset - 2));
    const startFurther = pointAtDistance(points, Math.min(total, inset + 2));
    const startHorizontal = isHorizontalSegment(startNear, startFurther);
    const start = startHorizontal
      ? { x: startPoint.x, y: startPoint.y + 11, anchor: 'middle' }
      : { x: startPoint.x - 10, y: startPoint.y, anchor: 'end' };

    const endPoint = pointAtDistance(points, Math.max(0, total - inset));
    const endNear = pointAtDistance(points, Math.max(0, total - inset - 2));
    const endFurther = pointAtDistance(points, Math.min(total, total - inset + 2));
    const endHorizontal = isHorizontalSegment(endNear, endFurther);
    const end = endHorizontal
      ? { x: endPoint.x, y: endPoint.y + 11, anchor: 'middle' }
      : { x: endPoint.x - 10, y: endPoint.y, anchor: 'end' };

    return { start, end };
  }

  function markerUrl(kind, selected, prefix = 'mk') {
    if (!kind) return null;
    const base = SCALE_MARKERS[kind] || kind;
    return `url(#${prefix}-${base}${selected ? '-sel' : ''})`;
  }

  function renderEdges() {
    const selectedId = state.selection && state.selection.kind === 'relation'
      ? state.selection.id
      : null;
    const offsets = getRelationOffsets();
    const chunks = [];

    for (const rel of state.relations) {
      const route = buildRoute(rel, offsets.get(rel.id) || 0);
      if (!route) continue;

      const conf = RELATIONSHIP[rel.type] || RELATIONSHIP.association;
      const isSelected = rel.id === selectedId;
      const labelGeometry = getLabelGeometry(route.points);
      const endpoints = getEndpointLabelPositions(route.points);
      const from = findClass(rel.from);
      const to = findClass(rel.to);
      const title = `${conf.label} · ${getClassName(from)} → ${getClassName(to)}`;

      const startMarker = conf.start ? markerUrl(conf.start, isSelected) : null;
      const endMarker = conf.end ? markerUrl(conf.end, isSelected) : null;
      const label = String(rel.label || '').trim();
      const fromMult = String(rel.fromMult || '').trim();
      const toMult = String(rel.toMult || '').trim();

      chunks.push(`
        <g class="relation${isSelected ? ' selected' : ''}" data-id="${esc(rel.id)}">
          <title>${esc(title)}</title>
          <path class="edge-hit" d="${route.d}"></path>
          <path class="edge-line${conf.dashed ? ' dashed' : ''}"
                d="${route.d}"
                ${startMarker ? `marker-start="${startMarker}"` : ''}
                ${endMarker ? `marker-end="${endMarker}"` : ''}></path>
          ${label ? `<text class="rel-label" x="${fmt(labelGeometry.x)}" y="${fmt(labelGeometry.y)}" text-anchor="${labelGeometry.anchor}" dominant-baseline="central">${esc(label)}</text>` : ''}
          ${fromMult ? `<text class="mult-label" x="${fmt(endpoints.start.x)}" y="${fmt(endpoints.start.y)}" text-anchor="${endpoints.start.anchor}" dominant-baseline="central">${esc(fromMult)}</text>` : ''}
          ${toMult ? `<text class="mult-label" x="${fmt(endpoints.end.x)}" y="${fmt(endpoints.end.y)}" text-anchor="${endpoints.end.anchor}" dominant-baseline="central">${esc(toMult)}</text>` : ''}
        </g>
      `);
    }

    els.edgeRoot.innerHTML = chunks.join('');
  }

  /* ------------------------------------------------------------------
     Rendering — inspector
     ------------------------------------------------------------------ */

  function emptyInspectorHTML() {
    const classCount = state.classes.length;
    const relationCount = state.relations.length;

    return `
      <div class="inspector-empty">
        <div class="empty-icon">${EMPTY_ICON}</div>
        <h2 class="empty-title">选择元素以编辑</h2>
        <p class="empty-copy">点击画布中的元素或连线查看属性。<br>双击空白画布可快速新建一个元素。</p>
        <div class="stats">
          <div class="stat"><strong>${classCount}</strong><span>元素</span></div>
          <div class="stat"><strong>${relationCount}</strong><span>关系</span></div>
        </div>
        <div class="empty-divider"></div>
        <div class="shortcut-list">
          <div class="shortcut-row"><span>新建元素</span><span><kbd>C</kbd></span></div>
          <div class="shortcut-row"><span>删除所选</span><span><kbd>Delete</kbd></span></div>
          <div class="shortcut-row"><span>拖动 / 平移</span><span><kbd>Space</kbd> + 拖拽</span></div>
          <div class="shortcut-row"><span>适应画布</span><span><kbd>F</kbd></span></div>
          <div class="shortcut-row"><span>撤销</span><span><kbd>Ctrl</kbd><kbd>Z</kbd></span></div>
        </div>
      </div>
    `;
  }

  function connectInspectorHTML() {
    const type = state.connect.type;
    const conf = RELATIONSHIP[type] || RELATIONSHIP.association;
    const source = state.connect.sourceId ? findClass(state.connect.sourceId) : null;
    const sourceName = source ? getClassName(source) : '';

    return `
      <div class="inspector-empty">
        <div class="empty-icon">${REL_ICONS[type] || REL_ICONS.association}</div>
        <h2 class="empty-title">${source ? '选择目标元素' : '开始连接'}</h2>
        <p class="empty-copy">${esc(conf.hint)}。按 <b>Esc</b> 可随时取消。</p>
        <div class="connect-steps">
          <div class="connect-step ${source ? 'done' : ''}">
            <span class="step-num">${source ? '✓' : '1'}</span>
            <span>${source ? esc(sourceName) : '点击起点元素'}</span>
          </div>
          <div class="connect-step">
            <span class="step-num">2</span>
            <span>点击目标元素完成${esc(conf.label)}关系</span>
          </div>
        </div>
        <button class="btn ghost" type="button" data-action="cancel-connect">取消连接</button>
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
                data-color="${id}"
                style="--sw:${theme.accent}"
                title="${theme.label}"
                aria-label="主题色：${theme.label}"
                aria-pressed="${active}">
          ${CHECK_ICON}
        </button>
      `;
    }).join('');
  }

  function visibilityOptionsHTML(selected) {
    return MEMBER_VISIBILITIES.map((item) => (
      `<option value="${item.value}" ${item.value === selected ? 'selected' : ''}>${item.label} ${item.value}</option>`
    )).join('');
  }

  function paramRowHTML(param) {
    return `
      <div class="param-row">
        <input class="param-input" data-param-value type="text" value="${esc(param)}"
               placeholder="参数名: 类型，如 x: number" maxlength="120"
               autocomplete="off" spellcheck="false" aria-label="方法参数">
        <button class="param-remove" type="button" data-action="remove-param" title="删除该参数" aria-label="删除该参数">×</button>
      </div>
    `;
  }

  function memberEditorHTML(kind, line, index) {
    const member = parseMemberLine(line, kind);
    const isAttribute = kind === 'attribute';
    const kindLabel = isAttribute ? '属性' : '方法';
    const params = isAttribute ? [] : splitParameterList(member.params);

    const typeField = isAttribute
      ? `<div class="member-field member-type-field">
           <span class="member-field-label">类型</span>
           <input class="member-type" data-member-field="type" type="text" value="${esc(member.type)}" placeholder="如 string（可选）" maxlength="90" autocomplete="off" spellcheck="false" aria-label="属性类型">
         </div>`
      : '';

    const methodFields = isAttribute ? '' : `
      <div class="member-params-block">
        <div class="member-params-head">
          <span class="member-field-label">参数</span>
          <button class="add-param-btn" type="button" data-action="add-param">
            <span>+</span> 添加参数
          </button>
        </div>
        <div class="param-list">${params.map(paramRowHTML).join('')}</div>
      </div>
      <div class="member-field member-return-field">
        <span class="member-field-label">返回类型</span>
        <input class="member-return" data-member-field="returnType" type="text" value="${esc(member.returnType)}" placeholder="如 void（可选）" maxlength="70" autocomplete="off" spellcheck="false" aria-label="方法返回类型">
      </div>
      <div class="method-options">
        <span class="member-field-label">方法标记</span>
        <div class="method-flag-list">
          <label class="method-flag-toggle" title="标记为虚函数，方法名前显示 virtual">
            <input type="checkbox" data-method-flag="virtual" aria-label="标记为虚函数" ${member.virtual ? 'checked' : ''}>
            <span class="method-flag-pill">虚函数</span>
          </label>
          <label class="method-flag-toggle" title="标记为抽象方法，方法名前显示 abstract，并使用斜体">
            <input type="checkbox" data-method-flag="abstract" aria-label="标记为抽象方法" ${member.abstract ? 'checked' : ''}>
            <span class="method-flag-pill">抽象方法</span>
          </label>
        </div>
      </div>
    `;

    return `
      <div class="member-editor" data-member-kind="${kind}" data-member-index="${index}">
        <div class="member-top-row">
          <div class="member-field member-vis-field">
            <span class="member-field-label">修饰符</span>
            <select class="member-vis" data-member-field="visibility" title="选择可见性修饰符" aria-label="${kindLabel}可见性修饰符">
              ${visibilityOptionsHTML(member.visibility)}
            </select>
          </div>
          <div class="member-field member-name-field">
            <span class="member-field-label">${isAttribute ? '字段名' : '方法名'}</span>
            <input class="member-name" data-member-field="name" type="text" value="${esc(member.name)}" placeholder="${isAttribute ? '如 id' : '如 area'}" maxlength="80" autocomplete="off" spellcheck="false" aria-label="${kindLabel}名称">
          </div>
          ${typeField}
          <button class="member-remove" type="button" data-action="remove-member" title="删除该${kindLabel}" aria-label="删除该${kindLabel}">×</button>
        </div>
        ${methodFields}
      </div>
    `;
  }

  function membersSectionHTML(cls, kind) {
    const isAttribute = kind === 'attribute';
    const label = isAttribute ? '属性' : '方法';
    const lines = isAttribute ? cls.attributes : cls.methods;
    const addAction = isAttribute ? 'add-attribute' : 'add-method';

    return `
      <div class="members-section" data-members-kind="${kind}">
        <div class="members-head">
          <span class="field-label">${label}</span>
          ${lines.length ? `
            <button class="add-member-btn" type="button" data-action="${addAction}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>
              <span>添加</span>
            </button>` : ''}
        </div>
        ${lines.length
          ? `<div class="member-list">${lines.map((line, index) => memberEditorHTML(kind, line, index)).join('')}</div>`
          : `<button class="member-empty-add" type="button" data-action="${addAction}">
               <span class="empty-plus">+</span> 添加第一个${label}
             </button>`}
      </div>
    `;
  }

  function literalsSectionHTML(cls) {
    const literals = Array.isArray(cls.literals) ? cls.literals : [];
    const theme = getTheme(cls);

    return `
      <div class="members-section" data-literals-section>
        <div class="members-head">
          <span class="field-label">枚举值</span>
          ${literals.length ? `
            <button class="add-member-btn" type="button" data-action="add-literal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>
              <span>添加</span>
            </button>` : ''}
        </div>
        ${literals.length
          ? `<div class="literal-list">${literals.map((literal, index) => `
              <div class="literal-row" data-literal-index="${index}">
                <span class="literal-marker" style="--literal:${theme.accent}"></span>
                <input class="literal-input" data-literal-index="${index}" type="text" value="${esc(literal)}"
                       placeholder="如 ACTIVE" maxlength="80" autocomplete="off" spellcheck="false" aria-label="枚举值 ${index + 1}">
                <button class="param-remove" type="button" data-action="remove-literal" title="删除该枚举值" aria-label="删除该枚举值">×</button>
              </div>
            `).join('')}</div>`
          : `<button class="member-empty-add" type="button" data-action="add-literal">
               <span class="empty-plus">+</span> 添加第一个枚举值
             </button>`}
      </div>
    `;
  }

  function classInspectorHTML(cls) {
    const info = getElementTypeInfo(cls);
    const theme = getTheme(cls);
    const relationCount = state.relations.filter((rel) => rel.from === cls.id || rel.to === cls.id).length;
    const name = getClassName(cls);

    const memberTip = (info.hasAttributes || info.hasMethods)
      ? `修饰符通过下拉选择，无需手动输入 <b>+ − # ~</b> 符号。${info.hasMethods ? '方法可额外标记为虚函数或抽象方法。' : ''}`
      : '枚举值会按顺序显示在图中。';
    const typeTip = info.type === 'interface'
      ? '接口名称前会自动显示 «interface»；接口属性通常使用公开修饰符。'
      : info.type === 'abstract'
        ? '抽象类名称前会显示 «abstract»，名称同时使用斜体。'
        : info.type === 'enum'
          ? '枚举名称前会自动显示 «enumeration»。'
          : '类可同时包含属性和方法。';

    return `
      <div class="panel-head">
        <div class="panel-head-copy">
          <div class="panel-eyebrow">
            <span class="panel-chip-dot" style="--chip:${theme.accent}"></span>
            <span>${info.label}</span>
          </div>
          <div class="panel-title" id="inspectorTitle">${esc(name)}</div>
          <div class="panel-subtitle">${relationCount} 条关系 · 自动保存</div>
        </div>
        <button class="icon-btn danger-hover" type="button" data-action="delete-class" title="删除元素" aria-label="删除元素">
          ${TRASH_ICON}
        </button>
      </div>
      <div class="panel-scroll">
        <div class="field">
          <label for="propName">名称</label>
          <input id="propName" data-field="name" type="text" value="${esc(cls.name)}" maxlength="80" autocomplete="off" spellcheck="false" placeholder="ElementName">
        </div>

        <div class="field">
          <label for="elementType">元素类型</label>
          <select id="elementType" data-field="type">${elementTypeOptionsHTML(info.type)}</select>
          <p class="field-help">${info.description}</p>
        </div>

        <div class="field">
          <span class="field-label">主题色</span>
          <div class="swatches">${themeSwatchesHTML(cls.color)}</div>
        </div>

        ${info.hasAttributes ? membersSectionHTML(cls, 'attribute') : ''}
        ${info.hasMethods ? membersSectionHTML(cls, 'method') : ''}
        ${info.hasLiterals ? literalsSectionHTML(cls) : ''}

        <div class="panel-tip">
          ${typeTip}<br>
          ${memberTip}<br>
          拖动元素可移动位置；靠近其他元素边缘时会自动对齐。按住 <kbd>Alt</kbd> 拖动可临时关闭对齐。
        </div>
      </div>
    `;
  }

  function relationInspectorHTML(rel) {
    const from = findClass(rel.from);
    const to = findClass(rel.to);
    const fromName = getClassName(from);
    const toName = getClassName(to);
    const conf = RELATIONSHIP[rel.type] || RELATIONSHIP.association;
    const fromTheme = getTheme(from);
    const toTheme = getTheme(to);

    const options = Object.entries(RELATIONSHIP).map(([type, item]) => {
      const english = {
        association: 'Association',
        inheritance: 'Generalization',
        realization: 'Realization',
        aggregation: 'Aggregation',
        composition: 'Composition',
        dependency: 'Dependency'
      }[type];
      return `<option value="${type}" ${rel.type === type ? 'selected' : ''}>${item.label} · ${english}</option>`;
    }).join('');

    return `
      <div class="panel-head">
        <div class="panel-head-copy">
          <div class="panel-eyebrow">
            <span class="panel-chip-dot" style="--chip:#4F46E5"></span>
            <span>关系</span>
          </div>
          <div class="panel-title" id="inspectorTitle">${esc(fromName)} → ${esc(toName)}</div>
          <div class="panel-subtitle">${conf.label}关系 · 端点可以交换</div>
        </div>
        <button class="icon-btn danger-hover" type="button" data-action="delete-relation" title="删除关系" aria-label="删除关系">
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
          <button class="swap-btn" type="button" data-action="swap-relation" title="交换两端" aria-label="交换两端">
            ${SWAP_ICON}
          </button>
        </div>

        <div class="field">
          <label for="relType">关系类型</label>
          <select id="relType" data-field="type">${options}</select>
        </div>

        <div class="field">
          <label for="relLabel">关系标签</label>
          <input id="relLabel" data-field="label" type="text" value="${esc(rel.label)}" maxlength="80" autocomplete="off" spellcheck="false" placeholder="如 contains">
        </div>

        <div class="field-row">
          <div class="field">
            <label for="relFromMult">起点重数</label>
            <input id="relFromMult" data-field="fromMult" type="text" value="${esc(rel.fromMult)}" maxlength="20" autocomplete="off" spellcheck="false" placeholder="1">
          </div>
          <div class="field">
            <label for="relToMult">终点重数</label>
            <input id="relToMult" data-field="toMult" type="text" value="${esc(rel.toMult)}" maxlength="20" autocomplete="off" spellcheck="false" placeholder="0..*">
          </div>
        </div>

        <div class="panel-tip">
          箭头指向目标元素。选中连线后，可在此修改类型、标签与两端重数。
        </div>
      </div>
    `;
  }

  function renderInspector() {
    if (state.selection) {
      if (state.selection.kind === 'class') {
        const cls = findClass(state.selection.id);
        if (!cls) {
          state.selection = null;
        } else {
          els.inspector.classList.remove('is-empty');
          els.inspector.innerHTML = classInspectorHTML(cls);
          return;
        }
      } else if (state.selection.kind === 'relation') {
        const rel = findRelation(state.selection.id);
        if (!rel) {
          state.selection = null;
        } else {
          els.inspector.classList.remove('is-empty');
          els.inspector.innerHTML = relationInspectorHTML(rel);
          return;
        }
      }
    }

    els.inspector.classList.add('is-empty');
    els.inspector.innerHTML = state.tool === 'connect'
      ? connectInspectorHTML()
      : emptyInspectorHTML();
  }

  function updateInspectorMeta() {
    if (!state.selection) return;
    if (state.selection.kind === 'class') {
      const cls = findClass(state.selection.id);
      if (!cls) return;
      const title = els.inspector.querySelector('#inspectorTitle');
      if (title) title.textContent = getClassName(cls);
    } else if (state.selection.kind === 'relation') {
      const rel = findRelation(state.selection.id);
      if (!rel) return;
      const subtitle = els.inspector.querySelector('.panel-subtitle');
      const conf = RELATIONSHIP[rel.type] || RELATIONSHIP.association;
      if (subtitle) subtitle.textContent = `${conf.label}关系 · 端点可以交换`;
    }
  }

  /* ------------------------------------------------------------------
     Rendering — overlays / toolbar
     ------------------------------------------------------------------ */

  function updateToolUI() {
    els.toolbar.querySelectorAll('.tool-btn').forEach((button) => {
      const isSelect = button.dataset.tool === 'select';
      const active = isSelect
        ? state.tool === 'select'
        : state.tool === 'connect' && state.connect.type === button.dataset.rel;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    els.canvas.classList.toggle('connect-mode', state.tool === 'connect');
    els.canvas.classList.toggle('space-pan', state.spaceDown);
  }

  function updateConnectHighlights() {
    nodeEls.forEach((el, id) => {
      el.classList.toggle(
        'connect-source',
        state.tool === 'connect' && state.connect.sourceId === id
      );
    });
  }

  function updateModeBanner() {
    const isConnecting = state.tool === 'connect' && Boolean(state.connect.type);
    if (!isConnecting) {
      els.modeBanner.classList.remove('visible');
      els.modeBanner.setAttribute('aria-hidden', 'true');
      return;
    }

    const conf = RELATIONSHIP[state.connect.type] || RELATIONSHIP.association;
    const source = state.connect.sourceId ? findClass(state.connect.sourceId) : null;

    els.modeIcon.innerHTML = REL_ICONS[state.connect.type] || REL_ICONS.association;
    els.modeText.innerHTML = source
      ? `已选择 <strong>${esc(getClassName(source))}</strong> · 再点击目标元素`
      : `<strong>${esc(conf.label)}</strong> · ${esc(conf.hint)}`;
    els.modeBanner.classList.add('visible');
    els.modeBanner.setAttribute('aria-hidden', 'false');
  }

  function renderGuides(guides, cls) {
    if (!guides || !guides.length || !cls) {
      els.guideRoot.innerHTML = '';
      return;
    }

    const layout = cls._layout;
    const pieces = [];
    for (const guide of guides) {
      const other = findClass(guide.otherId);
      if (!other) continue;
      const otherLayout = other._layout;

      if (guide.axis === 'v') {
        const top = Math.min(cls.y, other.y) - 18;
        const bottom = Math.max(cls.y + layout.height, other.y + otherLayout.height) + 18;
        pieces.push(`<line class="align-guide" x1="${fmt(guide.value)}" y1="${fmt(top)}" x2="${fmt(guide.value)}" y2="${fmt(bottom)}"></line>`);
      } else {
        const left = Math.min(cls.x, other.x) - 18;
        const right = Math.max(cls.x + layout.width, other.x + otherLayout.width) + 18;
        pieces.push(`<line class="align-guide" x1="${fmt(left)}" y1="${fmt(guide.value)}" x2="${fmt(right)}" y2="${fmt(guide.value)}"></line>`);
      }
    }
    els.guideRoot.innerHTML = pieces.join('');
  }

  function hideConnectPreview() {
    els.previewRoot.innerHTML = '';
  }

  function updateConnectPreview(clientX, clientY) {
    if (state.tool !== 'connect' || !state.connect.sourceId) {
      hideConnectPreview();
      return;
    }

    const source = findClass(state.connect.sourceId);
    if (!source) {
      hideConnectPreview();
      return;
    }

    const rect = els.canvas.getBoundingClientRect();
    const worldX = (clientX - rect.left - state.view.x) / state.view.scale;
    const worldY = (clientY - rect.top - state.view.y) / state.view.scale;
    const layout = source._layout;

    const anchors = [
      { x: source.x + layout.width / 2, y: source.y, side: 'top' },
      { x: source.x + layout.width, y: source.y + layout.height / 2, side: 'right' },
      { x: source.x + layout.width / 2, y: source.y + layout.height, side: 'bottom' },
      { x: source.x, y: source.y + layout.height / 2, side: 'left' }
    ];

    let start = anchors[0];
    let best = Infinity;
    for (const anchor of anchors) {
      const d = Math.hypot(anchor.x - worldX, anchor.y - worldY);
      if (d < best) {
        best = d;
        start = anchor;
      }
    }

    const end = { x: worldX, y: worldY };
    let control;
    if (start.side === 'left' || start.side === 'right') {
      const direction = start.side === 'right' ? 1 : -1;
      const amount = Math.min(70, Math.abs(end.x - start.x) * 0.45 + 24);
      control = { x: start.x + direction * amount, y: start.y };
    } else {
      const direction = start.side === 'bottom' ? 1 : -1;
      const amount = Math.min(70, Math.abs(end.y - start.y) * 0.45 + 24);
      control = { x: start.x, y: start.y + direction * amount };
    }

    const d = `M ${fmt(start.x)} ${fmt(start.y)} Q ${fmt(control.x)} ${fmt(control.y)} ${fmt(end.x)} ${fmt(end.y)}`;
    els.previewRoot.innerHTML = `
      <path class="connect-preview" d="${d}"></path>
      <circle class="connect-preview-dot" cx="${fmt(end.x)}" cy="${fmt(end.y)}" r="3.6"></circle>
    `;
  }

  function applyView() {
    const { x, y, scale } = state.view;
    const width = els.canvas.clientWidth || 1;
    const height = els.canvas.clientHeight || 1;

    // CSS zoom lays the nodes out at the target size, so text is always
    // re-rasterised at the correct resolution instead of being stretched
    // from a cached transform layer.
    els.nodePan.style.transform = `translate(${x}px, ${y}px)`;
    els.nodeLayer.style.zoom = String(scale);

    // The SVG uses a live viewBox; edges and labels stay vector-sharp at
    // every zoom level and align with the zoomed DOM nodes.
    els.edgeSvg.setAttribute(
      'viewBox',
      `${fmt(-x / scale)} ${fmt(-y / scale)} ${fmt(width / scale)} ${fmt(height / scale)}`
    );
    els.edgeSvg.setAttribute('preserveAspectRatio', 'none');
    [els.edgeRoot, els.previewRoot, els.guideRoot].forEach((group) => {
      group.removeAttribute('transform');
    });

    els.canvas.style.backgroundSize = `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`;
    els.canvas.style.backgroundPosition = `${x}px ${y}px`;
    els.zoomReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function refreshAll(options = {}) {
    const renderInspectorNow = options.inspector !== false;
    recomputeLayouts();
    renderNodes();
    renderEdges();
    updateToolUI();
    updateModeBanner();
    if (renderInspectorNow) renderInspector();
    applyView();
    updateUndoButtons();
  }

  /* ------------------------------------------------------------------
     View helpers
     ------------------------------------------------------------------ */

  function getWorkArea() {
    const width = els.canvas.clientWidth;
    const height = els.canvas.clientHeight;
    const canvasRect = els.canvas.getBoundingClientRect();
    let left = 18;
    let right = width - 18;
    let top = 88;
    let bottom = height - 70;

    if (els.toolbar && els.toolbar.offsetWidth) {
      const rect = els.toolbar.getBoundingClientRect();
      left = Math.max(left, rect.right - canvasRect.left + 20);
    }
    if (els.inspector && els.inspector.offsetWidth) {
      const rect = els.inspector.getBoundingClientRect();
      right = Math.min(right, rect.left - canvasRect.left - 20);
    }

    if (right - left < 240) {
      left = Math.min(90, width * 0.2);
      right = width - 20;
    }
    if (bottom - top < 160) {
      top = 72;
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

  function getWorldCenter() {
    const area = getWorkArea();
    return {
      x: (area.cx - state.view.x) / state.view.scale,
      y: (area.cy - state.view.y) / state.view.scale
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

  function fitToView(options = {}) {
    const shouldSave = options.save !== false;
    if (!state.classes.length) {
      const area = getWorkArea();
      state.view = { x: area.cx, y: area.cy, scale: 1 };
      applyView();
      if (shouldSave) scheduleSave();
      return;
    }

    recomputeLayouts();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const cls of state.classes) {
      minX = Math.min(minX, cls.x);
      minY = Math.min(minY, cls.y);
      maxX = Math.max(maxX, cls.x + cls._layout.width);
      maxY = Math.max(maxY, cls.y + cls._layout.height);
    }

    const boundsWidth = Math.max(1, maxX - minX);
    const boundsHeight = Math.max(1, maxY - minY);
    const area = getWorkArea();
    const availableWidth = Math.max(120, area.width - 48);
    const availableHeight = Math.max(120, area.height - 48);
    const scale = clamp(
      Math.min(availableWidth / boundsWidth, availableHeight / boundsHeight),
      MIN_SCALE,
      1.25
    );

    state.view.scale = scale;
    state.view.x = area.left + (area.width - boundsWidth * scale) / 2 - minX * scale;
    state.view.y = area.top + (area.height - boundsHeight * scale) / 2 - minY * scale;
    applyView();
    if (shouldSave) scheduleSave();
  }

  /* ------------------------------------------------------------------
     Selection
     ------------------------------------------------------------------ */

  function syncSelectionClasses() {
    nodeEls.forEach((el, id) => {
      const selected = state.selection && state.selection.kind === 'class' && state.selection.id === id;
      el.classList.toggle('selected', Boolean(selected));
      const isSource = state.tool === 'connect' && state.connect.sourceId === id;
      el.classList.toggle('connect-source', Boolean(isSource));
    });
  }

  function selectElement(kind, id) {
    let next = null;
    if (kind === 'class' && findClass(id)) next = { kind: 'class', id };
    if (kind === 'relation' && findRelation(id)) next = { kind: 'relation', id };

    const current = state.selection;
    const same = (!next && !current)
      || (next && current && next.kind === current.kind && next.id === current.id);
    if (same) return;

    state.selection = next;
    syncSelectionClasses();
    renderEdges();
    renderInspector();
  }

  /* ------------------------------------------------------------------
     Mutations and editing
     ------------------------------------------------------------------ */

  function readMemberEditor(row, kind) {
    const member = {};
    row.querySelectorAll('[data-member-field]').forEach((input) => {
      member[input.dataset.memberField] = input.value;
    });

    if (kind === 'method') {
      const params = [...row.querySelectorAll('[data-param-value]')]
        .map((input) => input.value.trim())
        .filter(Boolean);
      member.params = params.join(', ');

      row.querySelectorAll('[data-method-flag]').forEach((input) => {
        member[input.dataset.methodFlag] = input.checked;
      });
    }
    return member;
  }

  function syncMemberEditor(row) {
    if (!row) return;
    const selection = state.selection;
    if (!selection || selection.kind !== 'class') return;
    const cls = findClass(selection.id);
    if (!cls) return;

    const kind = row.dataset.memberKind;
    const index = Number(row.dataset.memberIndex);
    const list = kind === 'attribute' ? cls.attributes : cls.methods;
    if (!Array.isArray(list) || !Number.isInteger(index) || index < 0 || index >= list.length) return;

    const nextLine = serializeMember(readMemberEditor(row, kind), kind);
    if (list[index] === nextLine) return;
    list[index] = nextLine;

    refreshAll({ inspector: false });
    scheduleHistory();
    scheduleSave();
  }

  function onInspectorInput(event) {
    const editor = closestEl(event.target, '.member-editor');
    const isMemberControl = event.target instanceof Element
      && (event.target.dataset.memberField !== undefined
        || event.target.dataset.paramValue !== undefined
        || event.target.dataset.methodFlag !== undefined);
    if (editor && isMemberControl) {
      syncMemberEditor(editor);
      return;
    }

    const literalRow = closestEl(event.target, '.literal-row');
    if (literalRow) {
      const selection = state.selection;
      if (!selection || selection.kind !== 'class') return;
      const cls = findClass(selection.id);
      const index = Number(literalRow.dataset.literalIndex);
      if (!cls || !Array.isArray(cls.literals) || !Number.isInteger(index) || index < 0 || index >= cls.literals.length) return;

      const input = literalRow.querySelector('[data-literal-index]');
      const nextLiteral = String(input ? input.value : '').trim();
      if (cls.literals[index] === nextLiteral) return;
      cls.literals[index] = nextLiteral;

      refreshAll({ inspector: false });
      scheduleHistory();
      scheduleSave();
      return;
    }

    const target = closestEl(event.target, '[data-field]');
    if (!target) return;

    const field = target.dataset.field;
    const selection = state.selection;
    if (!selection) return;

    if (selection.kind === 'class') {
      const cls = findClass(selection.id);
      if (!cls) return;

      switch (field) {
        case 'name':
          cls.name = target.value;
          break;
        case 'type':
          if (!Object.prototype.hasOwnProperty.call(ELEMENT_TYPES, target.value)) return;
          if (cls.type === target.value) return;
          cls.type = target.value;
          if (!Array.isArray(cls.literals)) cls.literals = [];
          refreshAll({ inspector: true });
          commitHistory();
          scheduleSave();
          return;
        default:
          return;
      }
    } else if (selection.kind === 'relation') {
      const rel = findRelation(selection.id);
      if (!rel) return;

      switch (field) {
        case 'type':
          if (!Object.prototype.hasOwnProperty.call(RELATIONSHIP, target.value)) return;
          rel.type = target.value;
          break;
        case 'label':
          rel.label = target.value;
          break;
        case 'fromMult':
          rel.fromMult = target.value;
          break;
        case 'toMult':
          rel.toMult = target.value;
          break;
        default:
          return;
      }
    } else {
      return;
    }

    refreshAll({ inspector: false });
    updateInspectorMeta();
    scheduleHistory();
    scheduleSave();
  }

  function onInspectorFocusOut(event) {
    const target = event.target;
    if (target instanceof Element && target.matches('[data-field], [data-member-field], [data-literal-index], [data-method-flag]')) {
      commitHistory();
    }
  }

  function onInspectorClick(event) {
    const colorButton = closestEl(event.target, '[data-color]');
    if (colorButton) {
      if (!state.selection || state.selection.kind !== 'class') return;
      const cls = findClass(state.selection.id);
      const color = colorButton.dataset.color;
      if (!cls || !THEMES[color] || cls.color === color) return;
      cls.color = color;
      refreshAll({ inspector: true });
      commitHistory();
      scheduleSave();
      return;
    }

    const actionButton = closestEl(event.target, '[data-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.action;

    if (action === 'add-attribute' || action === 'add-method') {
      addMember(action === 'add-attribute' ? 'attribute' : 'method');
      return;
    }

    if (action === 'add-param') {
      const row = closestEl(actionButton, '.member-editor');
      addMethodParam(row);
      return;
    }

    if (action === 'remove-param') {
      const row = closestEl(actionButton, '.member-editor');
      const paramRow = closestEl(actionButton, '.param-row');
      if (row && paramRow) {
        paramRow.remove();
        syncMemberEditor(row);
      }
      return;
    }

    if (action === 'remove-member') {
      const row = closestEl(actionButton, '.member-editor');
      if (!row) return;
      removeMember(row.dataset.memberKind, Number(row.dataset.memberIndex));
      return;
    }

    if (action === 'add-literal') {
      addLiteral();
      return;
    }

    if (action === 'remove-literal') {
      const row = closestEl(actionButton, '.literal-row');
      if (!row) return;
      removeLiteral(Number(row.dataset.literalIndex));
      return;
    }

    if (action === 'delete-class' || action === 'delete-relation') {
      deleteSelected();
    } else if (action === 'swap-relation') {
      if (!state.selection || state.selection.kind !== 'relation') return;
      const rel = findRelation(state.selection.id);
      if (!rel) return;
      const from = rel.from;
      rel.from = rel.to;
      rel.to = from;
      const fromMult = rel.fromMult;
      rel.fromMult = rel.toMult;
      rel.toMult = fromMult;
      refreshAll({ inspector: true });
      commitHistory();
      scheduleSave();
    } else if (action === 'cancel-connect') {
      cancelConnect();
    }
  }

  function addMethodParam(row) {
    if (!row) return;
    const list = row.querySelector('.param-list');
    if (!list) return;

    list.insertAdjacentHTML('beforeend', paramRowHTML(''));
    const input = list.querySelector('.param-row:last-child .param-input');
    if (input) {
      input.focus();
    }
  }

  function focusLiteral(index) {
    requestAnimationFrame(() => {
      const row = els.inspector.querySelector(`.literal-row[data-literal-index="${index}"]`);
      const input = row ? row.querySelector('.literal-input') : null;
      if (input) {
        input.focus();
        input.select();
      }
    });
  }

  function addLiteral() {
    if (!state.selection || state.selection.kind !== 'class') return;
    const cls = findClass(state.selection.id);
    if (!cls || normalizeElementType(cls.type) !== 'enum') return;

    if (!Array.isArray(cls.literals)) cls.literals = [];
    const usedNames = new Set(cls.literals.map((literal) => String(literal).trim().toLowerCase()));
    let suffix = 1;
    while (usedNames.has(`value_${suffix}`)) suffix += 1;

    cls.literals.push(`VALUE_${suffix}`);
    refreshAll({ inspector: true });
    commitHistory();
    scheduleSave();
    focusLiteral(cls.literals.length - 1);
  }

  function removeLiteral(index) {
    if (!state.selection || state.selection.kind !== 'class') return;
    const cls = findClass(state.selection.id);
    if (!cls || !Array.isArray(cls.literals)) return;
    if (!Number.isInteger(index) || index < 0 || index >= cls.literals.length) return;

    cls.literals.splice(index, 1);
    refreshAll({ inspector: true });
    commitHistory();
    scheduleSave();
  }

  function focusMemberName(kind, index) {
    requestAnimationFrame(() => {
      const row = els.inspector.querySelector(
        `.member-editor[data-member-kind="${kind}"][data-member-index="${index}"]`
      );
      const input = row ? row.querySelector('.member-name') : null;
      if (input) {
        input.focus();
        input.select();
      }
    });
  }

  function addMember(kind) {
    if (kind !== 'attribute' && kind !== 'method') return;
    if (!state.selection || state.selection.kind !== 'class') return;
    const cls = findClass(state.selection.id);
    if (!cls) return;

    const list = kind === 'attribute' ? cls.attributes : cls.methods;
    const base = kind === 'attribute' ? 'field' : 'method';
    const usedNames = new Set(
      list
        .map((line) => parseMemberLine(line, kind).name.trim().toLowerCase())
        .filter(Boolean)
    );

    let suffix = 1;
    while (usedNames.has(`${base}${suffix}`)) suffix += 1;

    const isInterface = normalizeElementType(cls.type) === 'interface';
    const member = kind === 'attribute'
      ? { visibility: isInterface ? '+' : '-', name: `${base}${suffix}`, type: '' }
      : { visibility: '+', name: `${base}${suffix}`, params: '', returnType: '' };

    list.push(serializeMember(member, kind));
    refreshAll({ inspector: true });
    commitHistory();
    scheduleSave();
    focusMemberName(kind, list.length - 1);
  }

  function removeMember(kind, index) {
    if (kind !== 'attribute' && kind !== 'method') return;
    if (!state.selection || state.selection.kind !== 'class') return;
    const cls = findClass(state.selection.id);
    if (!cls) return;

    const list = kind === 'attribute' ? cls.attributes : cls.methods;
    if (!Number.isInteger(index) || index < 0 || index >= list.length) return;

    list.splice(index, 1);
    refreshAll({ inspector: true });
    commitHistory();
    scheduleSave();
  }

  function deleteSelected() {
    const selection = state.selection;
    if (!selection) return;

    if (selection.kind === 'class') {
      const cls = findClass(selection.id);
      if (!cls) return;
      const name = getClassName(cls);
      state.classes = state.classes.filter((item) => item.id !== selection.id);
      state.relations = state.relations.filter((rel) => rel.from !== selection.id && rel.to !== selection.id);
      state.selection = null;
      refreshAll({ inspector: true });
      commitHistory();
      scheduleSave();
      showToast(`已删除「${name}」`, { label: '撤销', onClick: undo });
    } else if (selection.kind === 'relation') {
      const rel = findRelation(selection.id);
      if (!rel) return;
      state.relations = state.relations.filter((item) => item.id !== selection.id);
      state.selection = null;
      refreshAll({ inspector: true });
      commitHistory();
      scheduleSave();
      showToast('已删除关系', { label: '撤销', onClick: undo });
    }
  }

  function nudgeSelected(deltaX, deltaY) {
    if (!state.selection || state.selection.kind !== 'class') return;
    const cls = findClass(state.selection.id);
    if (!cls) return;
    cls.x += deltaX;
    cls.y += deltaY;
    const el = nodeEls.get(cls.id);
    if (el) {
      el.style.left = `${cls.x}px`;
      el.style.top = `${cls.y}px`;
    }
    renderEdges();
    scheduleHistory();
    scheduleSave();
  }

  function nextClassName() {
    const names = new Set(state.classes.map((cls) => String(cls.name || '').trim()));
    let index = 1;
    while (names.has(`Class${index}`)) index += 1;
    return `Class${index}`;
  }

  function findOpenSpot(x, y, width, height) {
    const existing = state.classes
      .filter((cls) => cls._layout)
      .map((cls) => ({
        x: cls.x,
        y: cls.y,
        width: cls._layout.width,
        height: cls._layout.height
      }));

    let px = Math.round(x);
    let py = Math.round(y);
    let attempts = 0;

    const overlaps = () => existing.some((rect) => (
      px < rect.x + rect.width + 16
      && px + width + 16 > rect.x
      && py < rect.y + rect.height + 16
      && py + height + 16 > rect.y
    ));

    while (overlaps() && attempts < 40) {
      px += 32;
      py += 26;
      attempts += 1;
    }
    return { x: px, y: py };
  }

  function addClassAt(worldX, worldY) {
    blurActiveEditor();

    const draft = {
      id: uid('c'),
      name: nextClassName(),
      type: 'class',
      color: 'slate',
      x: 0,
      y: 0,
      attributes: [],
      methods: [],
      literals: []
    };
    const layout = computeClassLayout(draft);
    const spot = findOpenSpot(worldX - layout.width / 2, worldY - layout.height / 2, layout.width, layout.height);
    draft.x = spot.x;
    draft.y = spot.y;

    state.tool = 'select';
    state.connect = { type: null, sourceId: null };
    state.classes.push(draft);
    state.selection = { kind: 'class', id: draft.id };
    hideConnectPreview();

    refreshAll({ inspector: true });
    commitHistory();
    scheduleSave();
    focusInspectorName();
  }

  function addClassAtCenter() {
    const center = getWorldCenter();
    addClassAt(center.x, center.y);
  }

  function focusInspectorName() {
    requestAnimationFrame(() => {
      const input = els.inspector.querySelector('[data-field="name"]');
      if (input) {
        input.focus();
        input.select();
      }
    });
  }

  /* ------------------------------------------------------------------
     Connection mode
     ------------------------------------------------------------------ */

  function startRelationMode(type) {
    if (!RELATIONSHIP[type]) return;
    if (state.tool === 'connect' && state.connect.type === type) {
      cancelConnect();
      return;
    }

    blurActiveEditor();
    state.tool = 'connect';
    state.connect = { type, sourceId: null };
    state.selection = null;
    hideConnectPreview();
    refreshAll({ inspector: true });
  }

  function setSelectTool() {
    if (state.tool === 'connect' || state.connect.type) {
      cancelConnect();
      return;
    }
    state.tool = 'select';
    updateToolUI();
    updateModeBanner();
  }

  function cancelConnect() {
    const wasConnecting = state.tool === 'connect' || Boolean(state.connect.type);
    state.tool = 'select';
    state.connect = { type: null, sourceId: null };
    hideConnectPreview();

    if (wasConnecting) {
      refreshAll({ inspector: true });
    } else {
      updateToolUI();
      updateModeBanner();
    }
  }

  function handleConnectClick(classId) {
    if (state.tool !== 'connect' || !state.connect.type) return;
    const cls = findClass(classId);
    if (!cls) return;

    if (!state.connect.sourceId) {
      state.connect.sourceId = classId;
      updateConnectHighlights();
      updateModeBanner();
      renderInspector();
      hideConnectPreview();
      return;
    }

    if (state.connect.sourceId === classId) {
      showToast('请在另一个元素上结束连线');
      return;
    }

    const source = findClass(state.connect.sourceId);
    if (!source) {
      state.connect.sourceId = null;
      updateConnectHighlights();
      updateModeBanner();
      return;
    }

    const type = state.connect.type;
    const relation = {
      id: uid('r'),
      type,
      from: source.id,
      to: cls.id,
      label: '',
      fromMult: '',
      toMult: ''
    };

    state.relations.push(relation);
    state.selection = { kind: 'relation', id: relation.id };
    state.tool = 'select';
    state.connect = { type: null, sourceId: null };
    hideConnectPreview();

    refreshAll({ inspector: true });
    commitHistory();
    scheduleSave();
  }

  /* ------------------------------------------------------------------
     Node dragging
     ------------------------------------------------------------------ */

  function computeDragSnap(cls, rawX, rawY, disabled) {
    if (disabled) return { x: rawX, y: rawY, guides: [] };

    const layout = cls._layout;
    const threshold = 7 / state.view.scale;
    const xValues = [rawX, rawX + layout.width / 2, rawX + layout.width];
    const yValues = [rawY, rawY + layout.height / 2, rawY + layout.height];

    let bestVertical = null;
    let bestHorizontal = null;

    for (const other of state.classes) {
      if (other.id === cls.id) continue;
      const otherLayout = other._layout;
      if (!otherLayout) continue;

      const otherX = [other.x, other.x + otherLayout.width / 2, other.x + otherLayout.width];
      const otherY = [other.y, other.y + otherLayout.height / 2, other.y + otherLayout.height];

      for (let index = 0; index < 3; index += 1) {
        const xDiff = otherX[index] - xValues[index];
        if (Math.abs(xDiff) <= threshold
          && (!bestVertical || Math.abs(xDiff) < Math.abs(bestVertical.diff))) {
          bestVertical = {
            axis: 'v',
            diff: xDiff,
            value: otherX[index],
            otherId: other.id
          };
        }

        const yDiff = otherY[index] - yValues[index];
        if (Math.abs(yDiff) <= threshold
          && (!bestHorizontal || Math.abs(yDiff) < Math.abs(bestHorizontal.diff))) {
          bestHorizontal = {
            axis: 'h',
            diff: yDiff,
            value: otherY[index],
            otherId: other.id
          };
        }
      }
    }

    const guides = [];
    let x = rawX;
    let y = rawY;

    if (bestVertical) {
      x += bestVertical.diff;
      guides.push(bestVertical);
    }
    if (bestHorizontal) {
      y += bestHorizontal.diff;
      guides.push(bestHorizontal);
    }

    return { x, y, guides };
  }

  function onNodePointerDown(event) {
    const node = closestEl(event.target, '.class-node');
    if (!node) return;

    if (event.button !== 0 || state.spaceDown) return;

    const id = node.dataset.id;
    const cls = findClass(id);
    if (!cls) return;

    if (state.tool === 'connect') {
      event.preventDefault();
      event.stopPropagation();
      blurFocusBeforeCanvasInteraction();
      handleConnectClick(id);
      return;
    }

    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();
    blurFocusBeforeCanvasInteraction();
    selectElement('class', id);

    state.drag = {
      mode: 'node',
      pointerId: event.pointerId,
      id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: cls.x,
      originY: cls.y,
      moved: false
    };
  }

  function onNodeDoubleClick(event) {
    if (state.tool === 'connect') return;
    const node = closestEl(event.target, '.class-node');
    if (!node) return;
    event.preventDefault();
    event.stopPropagation();
    const cls = findClass(node.dataset.id);
    if (!cls) return;
    selectElement('class', cls.id);
    focusInspectorName();
  }

  /* ------------------------------------------------------------------
     Canvas interactions
     ------------------------------------------------------------------ */

  function startPan(event) {
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

  function onCanvasPointerDown(event) {
    if (event.button !== 0 && event.button !== 1) return;
    const node = closestEl(event.target, '.class-node');
    const wantsPan = event.button === 1 || state.spaceDown;

    if (!wantsPan && node) return;

    if (state.tool === 'connect' && event.button === 0 && !wantsPan) {
      event.preventDefault();
      blurFocusBeforeCanvasInteraction();
      cancelConnect();
      return;
    }

    event.preventDefault();
    blurFocusBeforeCanvasInteraction();

    if (!wantsPan) {
      selectElement(null);
    }

    startPan(event);
  }

  function onEdgePointerDown(event) {
    if (event.button !== 0 || state.spaceDown) return;
    const relationEl = closestEl(event.target, '.relation');
    if (!relationEl) return;

    if (state.tool === 'connect') {
      event.preventDefault();
      event.stopPropagation();
      showToast('请选择一个元素作为连接端点');
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    blurFocusBeforeCanvasInteraction();
    selectElement('relation', relationEl.dataset.id);
  }

  function onWindowPointerMove(event) {
    const drag = state.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();

    if (drag.mode === 'pan') {
      const dx = event.clientX - drag.startClientX;
      const dy = event.clientY - drag.startClientY;
      if (!drag.moved && Math.hypot(dx, dy) > 2) drag.moved = true;
      state.view.x = drag.originX + dx;
      state.view.y = drag.originY + dy;
      applyView();
      return;
    }

    if (drag.mode === 'node') {
      const cls = findClass(drag.id);
      if (!cls) return;
      const screenDx = event.clientX - drag.startClientX;
      const screenDy = event.clientY - drag.startClientY;

      if (!drag.moved && Math.hypot(screenDx, screenDy) < 3) return;
      if (!drag.moved) {
        drag.moved = true;
        const el = nodeEls.get(cls.id);
        if (el) el.classList.add('dragging');
      }

      const rawX = drag.originX + screenDx / state.view.scale;
      const rawY = drag.originY + screenDy / state.view.scale;
      const snapped = computeDragSnap(cls, rawX, rawY, event.altKey);

      cls.x = snapped.x;
      cls.y = snapped.y;

      const el = nodeEls.get(cls.id);
      if (el) {
        el.style.left = `${fmt(cls.x)}px`;
        el.style.top = `${fmt(cls.y)}px`;
      }

      renderEdges();
      renderGuides(snapped.guides, cls);
    }
  }

  function onWindowPointerUp(event) {
    const drag = state.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (drag.mode === 'node' && drag.moved) {
      const cls = findClass(drag.id);
      if (cls) {
        cls.x = Math.round(cls.x);
        cls.y = Math.round(cls.y);
        const el = nodeEls.get(cls.id);
        if (el) {
          el.style.left = `${cls.x}px`;
          el.style.top = `${cls.y}px`;
          el.classList.remove('dragging');
        }
        renderEdges();
      }
      commitHistory();
      scheduleSave();
    } else if (drag.mode === 'pan' && drag.moved) {
      scheduleSave();
    }

    els.canvas.classList.remove('panning');
    els.nodeLayer.querySelectorAll('.class-node.dragging').forEach((el) => el.classList.remove('dragging'));
    renderGuides([]);
    state.drag = null;
  }

  function onCanvasPointerMove(event) {
    if (state.drag) return;
    if (state.tool === 'connect' && state.connect.sourceId) {
      updateConnectPreview(event.clientX, event.clientY);
    }
  }

  function onCanvasPointerLeave() {
    if (!state.drag) hideConnectPreview();
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

  function onCanvasDoubleClick(event) {
    if (state.tool !== 'select') return;
    if (closestEl(event.target, '.class-node') || closestEl(event.target, '.relation')) return;
    event.preventDefault();

    const rect = els.canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const worldX = (screenX - state.view.x) / state.view.scale;
    const worldY = (screenY - state.view.y) / state.view.scale;
    addClassAt(worldX, worldY);
  }

  /* ------------------------------------------------------------------
     Menus, modal, toast
     ------------------------------------------------------------------ */

  function openFileMenu() {
    els.fileMenu.hidden = false;
    els.fileMenuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeFileMenu() {
    els.fileMenu.hidden = true;
    els.fileMenuBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleFileMenu() {
    if (els.fileMenu.hidden) openFileMenu();
    else closeFileMenu();
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
    if (!state.classes.length) {
      showToast('画布上还没有元素');
      return;
    }

    const payload = {
      version: 1,
      app: 'Classo',
      exportedAt: new Date().toISOString(),
      classes: state.classes.map(cleanClass),
      relations: state.relations.map(cleanRelation)
    };

    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }),
      `class-diagram-${dateSuffix()}.json`
    );
    showToast('已导出 JSON');
  }

  function exportSVG() {
    const built = buildExportSVG();
    if (!built) {
      showToast('画布上还没有元素');
      return;
    }
    const content = `<?xml version="1.0" encoding="UTF-8"?>\n${built.svg}`;
    downloadBlob(
      new Blob([content], { type: 'image/svg+xml;charset=utf-8' }),
      `class-diagram-${dateSuffix()}.svg`
    );
    showToast('已导出 SVG');
  }

  async function exportPNG() {
    const built = buildExportSVG();
    if (!built) {
      showToast('画布上还没有元素');
      return;
    }

    try {
      const blob = await rasterizeSVG(built.svg, built.width, built.height);
      downloadBlob(blob, `class-diagram-${dateSuffix()}.png`);
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

  function importJSONFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        const data = normalizeDiagram(parsed);
        if (!data) throw new Error('invalid diagram');
        if (!data.classes.length) throw new Error('empty diagram');

        commitHistory();
        state.classes = data.classes;
        state.relations = data.relations;
        state.selection = null;
        state.tool = 'select';
        state.connect = { type: null, sourceId: null };
        hideConnectPreview();

        refreshAll({ inspector: true });
        fitToView({ save: false });
        commitHistory();
        persistNow();
        showToast(`已导入 ${data.classes.length} 个元素`, { label: '撤销', onClick: undo });
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
    return state.classes.length > 0 || state.relations.length > 0;
  }

  function loadSample() {
    const data = createSampleData();
    commitHistory();
    state.classes = data.classes;
    state.relations = data.relations;
    state.selection = null;
    state.tool = 'select';
    state.connect = { type: null, sourceId: null };
    hideConnectPreview();
    refreshAll({ inspector: true });
    fitToView({ save: false });
    commitHistory();
    persistNow();
    showToast('示例图已载入', { label: '撤销', onClick: undo });
  }

  function clearCanvas() {
    commitHistory();
    state.classes = [];
    state.relations = [];
    state.selection = null;
    state.tool = 'select';
    state.connect = { type: null, sourceId: null };
    hideConnectPreview();
    refreshAll({ inspector: true });
    commitHistory();
    scheduleSave();
    showToast('画布已清空', { label: '撤销', onClick: undo });
  }

  async function handleFileAction(action) {
    closeFileMenu();
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
          title: '加载示例图？',
          message: '当前画布将被示例内容替换，此操作仍可通过撤销恢复。',
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
        message: '所有类和关系都会被删除。此操作可以通过撤销恢复。',
        confirmLabel: '清空画布',
        tone: 'danger'
      });
      if (!confirmed) return;
      clearCanvas();
    }
  }

  /* ------------------------------------------------------------------
     Export SVG builder
     ------------------------------------------------------------------ */

  function buildExportSVG() {
    recomputeLayouts();
    if (!state.classes.length) return null;

    const offsets = getRelationOffsets();
    const routeItems = [];

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const cls of state.classes) {
      minX = Math.min(minX, cls.x);
      minY = Math.min(minY, cls.y);
      maxX = Math.max(maxX, cls.x + cls._layout.width);
      maxY = Math.max(maxY, cls.y + cls._layout.height);
    }

    for (const rel of state.relations) {
      const route = buildRoute(rel, offsets.get(rel.id) || 0);
      if (!route) continue;
      routeItems.push({ rel, route });

      for (const point of route.points) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }

      const labelGeometry = getLabelGeometry(route.points);
      const endpointGeometry = getEndpointLabelPositions(route.points);
      const label = String(rel.label || '').trim();
      const fromMult = String(rel.fromMult || '').trim();
      const toMult = String(rel.toMult || '').trim();

      if (label) {
        measureCtx.font = FONT_LABEL;
        const width = measureCtx.measureText(label).width;
        const left = labelGeometry.anchor === 'middle' ? labelGeometry.x - width / 2 : labelGeometry.x;
        const right = labelGeometry.anchor === 'middle' ? labelGeometry.x + width / 2 : labelGeometry.x + width;
        minX = Math.min(minX, left - 4);
        maxX = Math.max(maxX, right + 4);
        minY = Math.min(minY, labelGeometry.y - 10);
        maxY = Math.max(maxY, labelGeometry.y + 10);
      }

      for (const [text, position] of [[fromMult, endpointGeometry.start], [toMult, endpointGeometry.end]]) {
        if (!text) continue;
        measureCtx.font = FONT_MULT;
        const width = measureCtx.measureText(text).width;
        const left = position.anchor === 'middle' ? position.x - width / 2 : position.x;
        const right = position.x + width;
        minX = Math.min(minX, left - 4);
        maxX = Math.max(maxX, right + 4);
        minY = Math.min(minY, position.y - 9);
        maxY = Math.max(maxY, position.y + 9);
      }
    }

    const padding = 56;
    const offsetX = padding - minX;
    const offsetY = padding - minY;
    const svgWidth = Math.ceil(maxX - minX + padding * 2);
    const svgHeight = Math.ceil(maxY - minY + padding * 2);

    const clipDefs = [];
    const cardMarkup = [];

    state.classes.forEach((cls, index) => {
      const info = getElementTypeInfo(cls);
      const layout = cls._layout;
      const theme = getTheme(cls);
      const keyword = info.keyword;
      const name = getClassName(cls);
      const isUnnamed = !cls.name || !cls.name.trim();
      const clipId = `exclip${index}`;
      const titleH = layout.titleH;
      const x = cls.x;
      const y = cls.y;
      const width = layout.width;
      const height = layout.height;

      clipDefs.push(
        `<clipPath id="${clipId}"><rect x="${fmt(x)}" y="${fmt(y)}" width="${width}" height="${height}" rx="12"></rect></clipPath>`
      );

      const nameY = keyword ? y + 37.5 : y + 22.5;
      const stereoY = y + 19.5;
      const sections = [];

      if (info.hasAttributes) {
        sections.push({
          height: layout.attrH,
          rows: cls.attributes.length ? cls.attributes : [null],
          emptyText: '暂无属性'
        });
      }
      if (info.hasMethods) {
        sections.push({
          height: layout.methodH,
          rows: cls.methods.length ? cls.methods : [null],
          emptyText: '暂无方法'
        });
      }
      if (info.hasLiterals) {
        const literals = Array.isArray(cls.literals) ? cls.literals : [];
        sections.push({
          height: layout.literalH,
          rows: literals.length ? literals : [null],
          emptyText: '暂无枚举值'
        });
      }

      const renderRows = (rows, sectionTop, emptyText) => rows.map((line, rowIndex) => {
        const centerY = sectionTop + 20 + rowIndex * 22;
        if (line === null) {
          return `<text x="${fmt(x + 17)}" y="${fmt(centerY)}" dominant-baseline="central" font-family="${SVG_SANS}" font-size="10.5" font-style="italic" fill="#B4BDC9">${emptyText}</text>`;
        }
        const italic = isAbstractMethodLine(line) ? ' font-style="italic"' : '';
        return `<text x="${fmt(x + 17)}" y="${fmt(centerY)}" dominant-baseline="central" font-family="${SVG_MONO}" font-size="12" fill="#475467"${italic}>${esc(line)}</text>`;
      }).join('');

      let sectionTop = y + 1 + titleH;
      const sectionsMarkup = sections.map((section) => {
        const top = sectionTop;
        sectionTop += section.height;
        return `
          <path d="M ${fmt(x)} ${fmt(top)} H ${fmt(x + width)}" stroke="#EAECF0" stroke-width="1"></path>
          ${renderRows(section.rows, top, section.emptyText)}
        `;
      }).join('');

      cardMarkup.push(`
        <g>
          <rect x="${fmt(x)}" y="${fmt(y)}" width="${width}" height="${height}" rx="12" fill="#FFFFFF" filter="url(#ex-card-shadow)"></rect>
          <g clip-path="url(#${clipId})">
            <rect x="${fmt(x)}" y="${fmt(y)}" width="${width}" height="${titleH}" fill="${theme.tint}"></rect>
            <rect x="${fmt(x)}" y="${fmt(y)}" width="${width}" height="3" fill="${theme.accent}" opacity="0.82"></rect>
            ${keyword ? `<text x="${fmt(x + width / 2)}" y="${fmt(stereoY)}" text-anchor="middle" dominant-baseline="central" font-family="${SVG_SANS}" font-size="10" font-weight="500" fill="#667085">«${esc(keyword)}»</text>` : ''}
            <text x="${fmt(x + width / 2)}" y="${fmt(nameY)}" text-anchor="middle" dominant-baseline="central" font-family="${SVG_SANS}" font-size="14" font-weight="650" fill="${isUnnamed ? '#A3ACBA' : '#1D2433'}" ${info.italicName || isUnnamed ? 'font-style="italic"' : ''}>${esc(name)}</text>
            ${sectionsMarkup}
          </g>
          <rect x="${fmt(x)}" y="${fmt(y)}" width="${width}" height="${height}" rx="12" fill="none" stroke="#DFE4EC" stroke-width="1"></rect>
        </g>
      `);
    });

    const edgeMarkup = routeItems.map(({ rel, route }) => {
      const conf = RELATIONSHIP[rel.type] || RELATIONSHIP.association;
      const selected = false;
      const labelGeometry = getLabelGeometry(route.points);
      const endpoints = getEndpointLabelPositions(route.points);
      const startMarker = conf.start ? markerUrl(conf.start, selected, 'ex') : null;
      const endMarker = conf.end ? markerUrl(conf.end, selected, 'ex') : null;
      const label = String(rel.label || '').trim();
      const fromMult = String(rel.fromMult || '').trim();
      const toMult = String(rel.toMult || '').trim();

      const labelMarkup = label
        ? `<text x="${fmt(labelGeometry.x)}" y="${fmt(labelGeometry.y)}" text-anchor="${labelGeometry.anchor}" dominant-baseline="central" font-family="${SVG_SANS}" font-size="11.5" font-weight="500" fill="#5B6B80" stroke="#FFFFFF" stroke-width="5" paint-order="stroke">${esc(label)}</text>`
        : '';

      const multMarkup = [
        fromMult ? `<text x="${fmt(endpoints.start.x)}" y="${fmt(endpoints.start.y)}" text-anchor="${endpoints.start.anchor}" dominant-baseline="central" font-family="${SVG_MONO}" font-size="10.5" fill="#7D899B" stroke="#FFFFFF" stroke-width="4.5" paint-order="stroke">${esc(fromMult)}</text>` : '',
        toMult ? `<text x="${fmt(endpoints.end.x)}" y="${fmt(endpoints.end.y)}" text-anchor="${endpoints.end.anchor}" dominant-baseline="central" font-family="${SVG_MONO}" font-size="10.5" fill="#7D899B" stroke="#FFFFFF" stroke-width="4.5" paint-order="stroke">${esc(toMult)}</text>` : ''
      ].join('');

      return `
        <path d="${route.d}" fill="none" stroke="#7C8A9E" stroke-width="1.7"
              stroke-linecap="round" stroke-linejoin="round"
              ${conf.dashed ? 'stroke-dasharray="7 5"' : ''}
              ${startMarker ? `marker-start="${startMarker}"` : ''}
              ${endMarker ? `marker-end="${endMarker}"` : ''}></path>
        ${labelMarkup}
        ${multMarkup}
      `;
    }).join('');

    const markerDefs = `
      <marker id="ex-open" markerWidth="16" markerHeight="16" refX="13" refY="8" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M2 2.5 13 8 2 13.5" fill="none" stroke="#7C8A9E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
      </marker>
      <marker id="ex-triangle" markerWidth="17" markerHeight="17" refX="14.5" refY="8.5" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M1.5 1.5 14.5 8.5 1.5 15.5Z" fill="#FFFFFF" stroke="#7C8A9E" stroke-width="1.4" stroke-linejoin="round"></path>
      </marker>
      <marker id="ex-diamond" markerWidth="16" markerHeight="16" refX="1" refY="8" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M1 8 8 2.5 15 8 8 13.5Z" fill="#FFFFFF" stroke="#7C8A9E" stroke-width="1.4" stroke-linejoin="round"></path>
      </marker>
      <marker id="ex-diamond-filled" markerWidth="16" markerHeight="16" refX="1" refY="8" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M1 8 8 2.5 15 8 8 13.5Z" fill="#7C8A9E" stroke="#7C8A9E" stroke-width="1.2" stroke-linejoin="round"></path>
      </marker>
    `;

    const defs = `
      <defs>
        ${markerDefs}
        <filter id="ex-card-shadow" x="-20%" y="-25%" width="140%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#101828" flood-opacity="0.08"></feDropShadow>
        </filter>
        ${clipDefs.join('')}
      </defs>
    `;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      ${defs}
      <rect width="${svgWidth}" height="${svgHeight}" fill="#FFFFFF"></rect>
      <g transform="translate(${fmt(offsetX)} ${fmt(offsetY)})">
        ${edgeMarkup}
        ${cardMarkup.join('')}
      </g>
    </svg>`;

    return { svg, width: svgWidth, height: svgHeight };
  }

  /* ------------------------------------------------------------------
     Keyboard & global events
     ------------------------------------------------------------------ */

  function onKeyDown(event) {
    if (document.body.dataset.mode === 'sequence') return;
    if (document.querySelector('dialog[open]')) return;

    if (event.key === 'Escape') {
      if (state.drag) {
        event.preventDefault();
        return;
      }
      if (!els.fileMenu.hidden) {
        closeFileMenu();
        return;
      }
      if (isTextEditing(document.activeElement)) {
        document.activeElement.blur();
        return;
      }
      if (state.tool === 'connect') {
        event.preventDefault();
        cancelConnect();
        return;
      }
      if (state.selection) {
        event.preventDefault();
        selectElement(null);
        return;
      }
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
    if (key === 'c' && !event.repeat) {
      event.preventDefault();
      addClassAtCenter();
      return;
    }
    if (key === 'f' && !event.repeat) {
      event.preventDefault();
      fitToView();
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

    if (event.key.startsWith('Arrow')) {
      if (!state.selection || state.selection.kind !== 'class') return;
      const step = event.shiftKey ? 10 : 2;
      let dx = 0;
      let dy = 0;
      if (event.key === 'ArrowLeft') dx = -step;
      if (event.key === 'ArrowRight') dx = step;
      if (event.key === 'ArrowUp') dy = -step;
      if (event.key === 'ArrowDown') dy = step;
      if (dx || dy) {
        event.preventDefault();
        nudgeSelected(dx, dy);
      }
    }
  }

  function onKeyUp(event) {
    if (event.code === 'Space') {
      state.spaceDown = false;
      els.canvas.classList.remove('space-pan');
    }
  }

  /* ------------------------------------------------------------------
     Event binding
     ------------------------------------------------------------------ */

  function bindEvents() {
    els.addClassBtn.addEventListener('click', addClassAtCenter);
    els.undoBtn.addEventListener('click', undo);
    els.redoBtn.addEventListener('click', redo);

    els.fileMenuBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleFileMenu();
    });

    els.fileMenu.addEventListener('click', (event) => {
      const item = closestEl(event.target, '[data-action]');
      if (!item) return;
      handleFileAction(item.dataset.action);
    });

    document.addEventListener('pointerdown', (event) => {
      if (!els.fileMenu.hidden && !els.menuWrap.contains(event.target)) closeFileMenu();
    });

    els.fileInput.addEventListener('change', () => {
      const file = els.fileInput.files && els.fileInput.files[0];
      if (file) importJSONFile(file);
    });

    els.zoomOut.addEventListener('click', () => zoomBy(1 / 1.2));
    els.zoomIn.addEventListener('click', () => zoomBy(1.2));
    els.zoomReset.addEventListener('click', resetZoom);
    els.fitBtn.addEventListener('click', () => fitToView());

    els.toolbar.addEventListener('click', (event) => {
      const relationButton = closestEl(event.target, '[data-rel]');
      if (relationButton) {
        startRelationMode(relationButton.dataset.rel);
        return;
      }
      const toolButton = closestEl(event.target, '[data-tool]');
      if (toolButton && toolButton.dataset.tool === 'select') {
        setSelectTool();
      }
    });

    els.modeCancel.addEventListener('click', cancelConnect);

    els.inspector.addEventListener('input', onInspectorInput);
    els.inspector.addEventListener('change', (event) => {
      if (event.target instanceof Element && event.target.matches('select[data-field], select[data-member-field]')) {
        onInspectorInput(event);
      }
    });
    els.inspector.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.isComposing
        && event.target instanceof Element && event.target.matches('.param-input')) {
        event.preventDefault();
        addMethodParam(closestEl(event.target, '.member-editor'));
      }
    });
    els.inspector.addEventListener('focusout', onInspectorFocusOut);
    els.inspector.addEventListener('click', onInspectorClick);

    els.nodeLayer.addEventListener('pointerdown', onNodePointerDown);
    els.nodeLayer.addEventListener('dblclick', onNodeDoubleClick);
    els.edgeSvg.addEventListener('pointerdown', onEdgePointerDown);
    els.edgeSvg.addEventListener('dblclick', (event) => {
      if (closestEl(event.target, '.relation')) event.stopPropagation();
    });

    els.canvas.addEventListener('pointerdown', onCanvasPointerDown);
    els.canvas.addEventListener('pointermove', onCanvasPointerMove);
    els.canvas.addEventListener('pointerleave', onCanvasPointerLeave);
    els.canvas.addEventListener('wheel', onWheel, { passive: false });
    els.canvas.addEventListener('dblclick', onCanvasDoubleClick);

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
      if (!event.detail || event.detail.kind !== 'class') return;
      if (event.detail.id === currentLibraryId) return;
      reloadActiveDiagram();
    });

    window.addEventListener('beforeunload', () => {
      if (storageBroken) return;
      persistNow();
    });
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */

  function init() {
    bindEvents();

    const restored = loadFromStorage();

    if (restored) {
      state.classes = restored.data.classes;
      state.relations = restored.data.relations;
      state.view = restored.view || { x: 0, y: 0, scale: 1 };

      refreshAll({ inspector: true });
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
      state.classes = sample.classes;
      state.relations = sample.relations;

      refreshAll({ inspector: true });
      initHistory();
      applyView();

      requestAnimationFrame(() => {
        fitToView({ save: false });
        persistNow();
        setTimeout(() => {
          showToast('已载入示例图 · 所有更改会自动保存');
        }, 500);
      });
    }
  }

  window.ClassoEditors = window.ClassoEditors || {};
  window.ClassoEditors.class = {
    flush: () => persistNow(),
    reload: () => reloadActiveDiagram()
  };

  init();
})();
