(() => {
  'use strict';

  const INDEX_KEY = 'classo.library.v1';
  const DIAGRAM_PREFIX = 'classo.diagram.v1.';
  const LEGACY_CLASS_KEY = 'classo.uml.class-diagram.v1';
  const LEGACY_SEQUENCE_KEY = 'classo.uml.sequence-diagram.v1';

  const KINDS = ['class', 'sequence'];
  const KIND_LABEL = { class: '类图', sequence: '时序图' };

  const THEMES = {
    slate: { accent: '#64748B', tint: '#F8FAFC' },
    blue: { accent: '#3B82F6', tint: '#EFF6FF' },
    violet: { accent: '#7C3AED', tint: '#F5F3FF' },
    emerald: { accent: '#059669', tint: '#ECFDF5' },
    amber: { accent: '#D97706', tint: '#FFFBEB' },
    rose: { accent: '#E11D48', tint: '#FFF1F2' }
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    button: $('libraryBtn'),
    dialog: $('libraryDialog'),
    body: $('libraryBody'),
    subtitle: $('librarySubtitle'),
    count: $('libraryCount'),
    status: $('libraryStatus'),
    close: $('libraryClose'),
    tabs: [...document.querySelectorAll('[data-library-filter]')]
  };

  let index = null;
  let storageOk = probeStorage();
  let filter = 'all';
  let statusTimer = null;
  const deleteTimers = new Map();

  /* ------------------------------------------------------------------
     Utilities
     ------------------------------------------------------------------ */

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function uid() {
    return `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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

  function probeStorage() {
    try {
      const key = 'classo.storage.probe';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function readJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      storageOk = false;
      return false;
    }
  }

  function removeKey(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      storageOk = false;
      return false;
    }
  }

  function dataKey(id) {
    return DIAGRAM_PREFIX + id;
  }

  function themeFor(color) {
    return THEMES[color] || THEMES.slate;
  }

  function defaultName(kind) {
    return kind === 'sequence' ? '未命名时序图' : '未命名类图';
  }

  function emptyData(kind) {
    return kind === 'sequence'
      ? { lifelines: [], messages: [] }
      : { classes: [], relations: [] };
  }

  function relativeTime(timestamp) {
    const value = Number(timestamp);
    if (!Number.isFinite(value)) return '刚刚';
    const diff = Math.max(0, Date.now() - value);
    if (diff < 60_000) return '刚刚';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
    if (diff < 172_800_000) return '昨天';
    return new Date(value).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  }

  function uniqueName(items, base, kind) {
    const fallback = defaultName(kind);
    const clean = String(base || '').trim().slice(0, 80) || fallback;
    const names = new Set(
      items
        .filter((item) => !kind || item.kind === kind)
        .map((item) => String(item.name || '').trim())
    );
    if (!names.has(clean)) return clean;

    let suffix = 2;
    while (names.has(`${clean} ${suffix}`)) suffix += 1;
    return `${clean} ${suffix}`;
  }

  /* ------------------------------------------------------------------
     Index & migrations
     ------------------------------------------------------------------ */

  function normalizeIndex(raw) {
    const items = [];
    const seen = new Set();

    for (const source of Array.isArray(raw && raw.items) ? raw.items : []) {
      if (!source || typeof source !== 'object') continue;
      const kind = source.kind === 'sequence' ? 'sequence' : (source.kind === 'class' ? 'class' : null);
      if (!kind) continue;

      let id = typeof source.id === 'string' && source.id ? source.id : uid();
      while (seen.has(id)) id = uid();
      seen.add(id);

      const createdAt = Number(source.createdAt);
      const updatedAt = Number(source.updatedAt);

      items.push({
        id,
        kind,
        name: typeof source.name === 'string' && source.name.trim()
          ? source.name.trim().slice(0, 80)
          : defaultName(kind),
        createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
        updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now()
      });
    }

    const active = { class: null, sequence: null };
    for (const kind of KINDS) {
      const wanted = raw && raw.active ? raw.active[kind] : null;
      if (typeof wanted === 'string' && items.some((item) => item.id === wanted && item.kind === kind)) {
        active[kind] = wanted;
        continue;
      }
      const latest = items
        .filter((item) => item.kind === kind)
        .sort((a, b) => b.updatedAt - a.updatedAt)[0];
      active[kind] = latest ? latest.id : null;
    }

    return { version: 1, items, active };
  }

  function writeDiagram(id, kind, data, view, savedAt) {
    return writeJSON(dataKey(id), {
      version: 1,
      kind,
      data,
      view: view || null,
      savedAt: savedAt || Date.now()
    });
  }

  function migrateLegacy() {
    const items = [];
    const active = { class: null, sequence: null };

    const classRaw = readJSON(LEGACY_CLASS_KEY);
    if (classRaw && typeof classRaw === 'object' && Array.isArray(classRaw.classes)) {
      const id = uid();
      const timestamp = Number(classRaw.savedAt) || Date.now();
      const data = {
        classes: classRaw.classes,
        relations: Array.isArray(classRaw.relations) ? classRaw.relations : []
      };
      writeDiagram(id, 'class', data, classRaw.view || null, timestamp);
      items.push({
        id,
        kind: 'class',
        name: uniqueName(items, '我的类图', 'class'),
        createdAt: timestamp,
        updatedAt: timestamp
      });
      active.class = id;
    }

    const sequenceRaw = readJSON(LEGACY_SEQUENCE_KEY);
    if (sequenceRaw && typeof sequenceRaw === 'object' && Array.isArray(sequenceRaw.lifelines)) {
      const id = uid();
      const timestamp = Number(sequenceRaw.savedAt) || Date.now();
      const data = {
        lifelines: sequenceRaw.lifelines,
        messages: Array.isArray(sequenceRaw.messages) ? sequenceRaw.messages : []
      };
      writeDiagram(id, 'sequence', data, sequenceRaw.view || null, timestamp);
      items.push({
        id,
        kind: 'sequence',
        name: uniqueName(items, '我的时序图', 'sequence'),
        createdAt: timestamp,
        updatedAt: timestamp
      });
      active.sequence = id;
    }

    return { version: 1, items, active };
  }

  function ensureIndex() {
    if (index) return index;

    const raw = readJSON(INDEX_KEY);
    if (raw && typeof raw === 'object' && Array.isArray(raw.items)) {
      index = normalizeIndex(raw);
      writeJSON(INDEX_KEY, index);
      return index;
    }

    index = migrateLegacy();
    writeJSON(INDEX_KEY, index);
    return index;
  }

  function persistIndex() {
    return writeJSON(INDEX_KEY, index);
  }

  function dispatchActiveChange(kind, id) {
    window.dispatchEvent(new CustomEvent('classo:activechange', { detail: { kind, id } }));
  }

  function dispatchLibraryChange(action, id) {
    window.dispatchEvent(new CustomEvent('classo:librarychange', { detail: { action, id } }));
  }

  /* ------------------------------------------------------------------
     Library API
     ------------------------------------------------------------------ */

  function getItem(id) {
    ensureIndex();
    return index.items.find((item) => item.id === id) || null;
  }

  function list(kind) {
    ensureIndex();
    const items = kind ? index.items.filter((item) => item.kind === kind) : index.items.slice();
    return items.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  function getActive(kind) {
    ensureIndex();
    const id = index.active[kind];
    return id ? getItem(id) : null;
  }

  function setActive(kind, id) {
    ensureIndex();
    if (!KINDS.includes(kind)) return false;
    if (index.active[kind] === id) return true;

    const item = getItem(id);
    if (!item || item.kind !== kind) return false;

    const previous = index.active[kind];
    index.active[kind] = id;
    if (!persistIndex()) {
      index.active[kind] = previous;
      return false;
    }

    dispatchActiveChange(kind, id);
    return true;
  }

  function load(id) {
    ensureIndex();
    const item = getItem(id);
    if (!item) return null;

    const parsed = readJSON(dataKey(id));
    if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
      return null;
    }

    if (item.kind === 'class') {
      if (!Array.isArray(parsed.data.classes)) return null;
      if (!Array.isArray(parsed.data.relations)) parsed.data.relations = [];
    } else if (item.kind === 'sequence') {
      if (!Array.isArray(parsed.data.lifelines)) return null;
      if (!Array.isArray(parsed.data.messages)) parsed.data.messages = [];
    } else {
      return null;
    }

    return parsed;
  }

  function save(id, data, view) {
    ensureIndex();
    const item = getItem(id);
    if (!item) return false;

    const timestamp = Date.now();
    if (!writeDiagram(id, item.kind, data, view, timestamp)) return false;
    item.updatedAt = timestamp;
    return persistIndex();
  }

  function create(kind, options = {}) {
    ensureIndex();
    if (!KINDS.includes(kind)) return null;

    const id = uid();
    const timestamp = Date.now();
    const requestedName = typeof options.name === 'string' && options.name.trim()
      ? options.name.trim().slice(0, 80)
      : defaultName(kind);
    const name = uniqueName(index.items, requestedName, kind);
    const data = options.data || emptyData(kind);
    const view = options.view || null;

    if (!writeDiagram(id, kind, data, view, timestamp)) return null;

    const item = { id, kind, name, createdAt: timestamp, updatedAt: timestamp };
    index.items.push(item);

    const previousActive = index.active[kind];
    if (options.activate !== false || !previousActive) {
      index.active[kind] = id;
    }

    if (!persistIndex()) {
      index.items = index.items.filter((entry) => entry.id !== id);
      index.active[kind] = previousActive;
      return null;
    }

    if (!options.silent) {
      dispatchLibraryChange('create', id);
      if (index.active[kind] === id && previousActive !== id) {
        dispatchActiveChange(kind, id);
      }
    }

    return item;
  }

  function rename(id, name) {
    ensureIndex();
    const item = getItem(id);
    if (!item) return false;

    const next = String(name || '').trim().slice(0, 80);
    if (!next) return false;

    const unique = uniqueName(
      index.items.filter((entry) => entry.id !== id),
      next,
      item.kind
    );
    if (unique === item.name) return true;

    item.name = unique;
    item.updatedAt = Date.now();
    if (!persistIndex()) return false;

    dispatchLibraryChange('rename', id);
    return true;
  }

  function duplicate(id) {
    ensureIndex();
    const item = getItem(id);
    if (!item) return null;

    const stored = load(id);
    if (!stored) return null;

    let data;
    try {
      data = JSON.parse(JSON.stringify(stored.data));
    } catch (error) {
      return null;
    }

    return create(item.kind, {
      name: uniqueName(index.items, `${item.name} 副本`, item.kind),
      data,
      view: stored.view || null,
      activate: false
    });
  }

  function remove(id) {
    ensureIndex();
    const item = getItem(id);
    if (!item) return false;

    const kind = item.kind;
    const wasActive = index.active[kind] === id;

    index.items = index.items.filter((entry) => entry.id !== id);
    removeKey(dataKey(id));

    let nextActiveId = index.active[kind];
    if (wasActive) {
      const replacement = index.items
        .filter((entry) => entry.kind === kind)
        .sort((a, b) => b.updatedAt - a.updatedAt)[0];
      nextActiveId = replacement ? replacement.id : null;
      index.active[kind] = nextActiveId;
    }

    if (!persistIndex()) return false;

    dispatchLibraryChange('delete', id);
    if (wasActive) dispatchActiveChange(kind, nextActiveId);
    return true;
  }

  function suggestName(kind, base) {
    ensureIndex();
    return uniqueName(index.items, base || defaultName(kind), kind);
  }

  /* ------------------------------------------------------------------
     Thumbnails
     ------------------------------------------------------------------ */

  function placeholderThumbnail(kind) {
    const label = KIND_LABEL[kind] || '图表';
    return `<svg class="library-thumb" viewBox="0 0 280 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="280" height="150" fill="#FBFCFE"></rect>
      <rect x="84" y="46" width="112" height="58" rx="12" fill="#FFFFFF" stroke="#E3E8F0" stroke-dasharray="5 4"></rect>
      <text x="140" y="71" text-anchor="middle" font-family="Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="11" font-weight="600" fill="#A4ADBA">空白${label}</text>
      <text x="140" y="88" text-anchor="middle" font-family="Inter, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="9.5" fill="#C0C7D2">还没有内容</text>
    </svg>`;
  }

  function estimateTextWidth(text) {
    let width = 0;
    for (const char of String(text || '')) {
      width += char.charCodeAt(0) > 255 ? 8 : 5.6;
    }
    return width;
  }

  function classThumbnail(data) {
    const classes = Array.isArray(data.classes) ? data.classes : [];
    const relations = Array.isArray(data.relations) ? data.relations : [];
    if (!classes.length) return placeholderThumbnail('class');

    const rects = [];
    const byId = new Map();

    for (const cls of classes.slice(0, 60)) {
      if (!cls || typeof cls !== 'object') continue;
      const infoMembers = (Array.isArray(cls.attributes) ? cls.attributes.length : 0)
        + (Array.isArray(cls.methods) ? cls.methods.length : 0)
        + (Array.isArray(cls.literals) ? cls.literals.length : 0);
      const width = clamp(Math.max(92, estimateTextWidth(cls.name) + 34), 92, 220);
      const height = clamp(34 + infoMembers * 11, 44, 150);
      const x = Number(cls.x);
      const y = Number(cls.y);
      const rect = {
        id: cls.id,
        x: Number.isFinite(x) ? x : 0,
        y: Number.isFinite(y) ? y : 0,
        width,
        height,
        type: cls.type || 'class',
        color: themeFor(cls.color)
      };
      rects.push(rect);
      if (cls.id) byId.set(cls.id, rect);
    }

    if (!rects.length) return placeholderThumbnail('class');

    const minX = Math.min(...rects.map((rect) => rect.x));
    const minY = Math.min(...rects.map((rect) => rect.y));
    const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
    const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));
    const padding = 16;
    const scale = Math.min(
      (280 - padding * 2) / Math.max(1, maxX - minX),
      (150 - padding * 2) / Math.max(1, maxY - minY),
      1.15
    );
    const offsetX = (280 - (maxX - minX) * scale) / 2 - minX * scale;
    const offsetY = (150 - (maxY - minY) * scale) / 2 - minY * scale;

    const edges = relations.slice(0, 100).map((rel) => {
      if (!rel || typeof rel !== 'object') return '';
      const from = byId.get(rel.from);
      const to = byId.get(rel.to);
      if (!from || !to) return '';
      const x1 = offsetX + (from.x + from.width / 2) * scale;
      const y1 = offsetY + (from.y + from.height / 2) * scale;
      const x2 = offsetX + (to.x + to.width / 2) * scale;
      const y2 = offsetY + (to.y + to.height / 2) * scale;
      const dashed = rel.type === 'dependency' || rel.type === 'realization';
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#A9B4C3" stroke-width="1" ${dashed ? 'stroke-dasharray="3 2.5"' : ''} opacity="0.9"></line>`;
    }).join('');

    const boxes = rects.map((rect) => {
      const x = offsetX + rect.x * scale;
      const y = offsetY + rect.y * scale;
      const width = Math.max(6, rect.width * scale);
      const height = Math.max(6, rect.height * scale);
      const barHeight = Math.max(2, Math.min(3.5, 3 * scale));
      const dashed = rect.type === 'interface' ? ' stroke-dasharray="4 3"' : '';
      return `<g>
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${width.toFixed(1)}" height="${height.toFixed(1)}" rx="4" fill="${rect.color.tint}" stroke="${rect.color.accent}" stroke-opacity="0.5" stroke-width="1"${dashed}></rect>
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${width.toFixed(1)}" height="${barHeight.toFixed(1)}" rx="1.6" fill="${rect.color.accent}" opacity="0.85"></rect>
      </g>`;
    }).join('');

    return `<svg class="library-thumb" viewBox="0 0 280 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="280" height="150" fill="#FBFCFE"></rect>
      ${edges}
      ${boxes}
    </svg>`;
  }

  function sequenceThumbnail(data) {
    const lifelines = Array.isArray(data.lifelines) ? data.lifelines : [];
    const messages = Array.isArray(data.messages) ? data.messages : [];
    if (!lifelines.length) return placeholderThumbnail('sequence');

    const visible = lifelines.slice(0, 8);
    const count = visible.length;
    const margin = 28;
    const span = 280 - margin * 2;
    const xs = visible.map((_, i) => (count === 1 ? 140 : margin + i * (span / (count - 1))));
    const indexById = new Map(visible.map((lifeline, i) => [lifeline.id, i]));

    const headerY = 16;
    const headerH = 13;
    const headerW = clamp(span / Math.max(1, count) - 8, 22, 42);
    const lineBottom = 142;
    const messageStart = 44;

    const guideLines = xs.map((x) => (
      `<line x1="${x.toFixed(1)}" y1="${headerY + headerH}" x2="${x.toFixed(1)}" y2="${lineBottom}" stroke="#C9D2DE" stroke-width="1" stroke-dasharray="3 3"></line>`
    )).join('');

    const headers = visible.map((lifeline, i) => {
      const theme = themeFor(lifeline.color);
      const x = xs[i] - headerW / 2;
      return `<g>
        <rect x="${x.toFixed(1)}" y="${headerY}" width="${headerW.toFixed(1)}" height="${headerH}" rx="3" fill="${theme.tint}" stroke="${theme.accent}" stroke-opacity="0.6" stroke-width="1"></rect>
        <line x1="${(x + 5).toFixed(1)}" y1="${headerY + headerH - 1.5}" x2="${(x + headerW - 5).toFixed(1)}" y2="${headerY + headerH - 1.5}" stroke="${theme.accent}" stroke-width="1.4" stroke-linecap="round" opacity="0.85"></line>
      </g>`;
    }).join('');

    const visibleMessages = messages.slice(0, 10);
    const gap = visibleMessages.length
      ? (lineBottom - 8 - messageStart) / visibleMessages.length
      : 10;

    const arrows = visibleMessages.map((message, i) => {
      if (!message || typeof message !== 'object') return '';
      const a = indexById.get(message.from);
      const b = indexById.get(message.to);
      if (a === undefined || b === undefined) return '';
      const y = messageStart + (i + 0.5) * gap;
      const dashed = message.type === 'return' ? ' stroke-dasharray="3 2.5"' : '';

      if (a === b) {
        const x = xs[a];
        return `<path d="M ${(x + 2).toFixed(1)} ${y.toFixed(1)} h 11 v 6 h -11" fill="none" stroke="#8B97A8" stroke-width="1" stroke-linejoin="round"></path>`;
      }

      const x1 = xs[a];
      const x2 = xs[b];
      const direction = x2 > x1 ? 1 : -1;
      const tipX = x2 - direction * 3;
      const head = `M ${tipX.toFixed(1)} ${y.toFixed(1)} l ${(-direction * 4).toFixed(1)} -2.2 l 0 4.4 z`;
      return `<g>
        <line x1="${x1.toFixed(1)}" y1="${y.toFixed(1)}" x2="${tipX.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#8B97A8" stroke-width="1"${dashed}></line>
        <path d="${head}" fill="#8B97A8"></path>
      </g>`;
    }).join('');

    return `<svg class="library-thumb" viewBox="0 0 280 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect width="280" height="150" fill="#FBFCFE"></rect>
      ${guideLines}
      ${headers}
      ${arrows}
    </svg>`;
  }

  /* ------------------------------------------------------------------
     Library UI
     ------------------------------------------------------------------ */

  function flushEditor(kind) {
    const editors = window.ClassoEditors;
    const editor = editors && editors[kind];
    if (!editor || typeof editor.flush !== 'function') return;
    try {
      editor.flush();
    } catch (error) {
      console.error(error);
    }
  }

  function flushCurrentEditor() {
    const mode = document.body.dataset.mode === 'sequence' ? 'sequence' : 'class';
    flushEditor(mode);
  }

  function showStatus(message) {
    if (!els.status) return;
    clearTimeout(statusTimer);
    els.status.textContent = message;
    els.status.hidden = false;
    statusTimer = setTimeout(() => {
      els.status.hidden = true;
    }, 2600);
  }

  function hideStatus() {
    clearTimeout(statusTimer);
    if (els.status) els.status.hidden = true;
  }

  function clearDeleteTimers() {
    deleteTimers.forEach((timer) => clearTimeout(timer));
    deleteTimers.clear();
  }

  function itemCardHTML(item) {
    const stored = load(item.id);
    const isActive = index.active[item.kind] === item.id;
    const label = KIND_LABEL[item.kind] || '图表';

    let thumbnail = '';
    let meta = '内容无法读取';

    if (stored) {
      if (item.kind === 'class') {
        thumbnail = classThumbnail(stored.data);
        meta = `${stored.data.classes.length} 个元素 · ${stored.data.relations.length} 条关系`;
      } else {
        thumbnail = sequenceThumbnail(stored.data);
        meta = `${stored.data.lifelines.length} 个参与者 · ${stored.data.messages.length} 条消息`;
      }
    } else {
      thumbnail = placeholderThumbnail(item.kind);
    }

    return `
      <article class="library-item${isActive ? ' is-active' : ''}" data-library-id="${esc(item.id)}">
        <button class="library-preview" type="button" data-library-open="${esc(item.id)}" aria-label="打开「${esc(item.name)}」">
          ${thumbnail}
          <span class="library-kind-badge">${label}</span>
          ${isActive ? '<span class="library-active-badge">当前</span>' : ''}
        </button>
        <div class="library-item-body">
          <div class="library-item-title-row">
            <span class="library-item-title" title="${esc(item.name)}">${esc(item.name)}</span>
          </div>
          <div class="library-item-meta">${meta} · ${relativeTime(item.updatedAt)}</div>
          <div class="library-item-actions">
            <button class="library-action is-primary" type="button" data-library-open="${esc(item.id)}">打开</button>
            <button class="library-action" type="button" data-library-rename="${esc(item.id)}">重命名</button>
            <button class="library-action" type="button" data-library-duplicate="${esc(item.id)}">复制</button>
            <button class="library-action danger" type="button" data-library-delete="${esc(item.id)}">删除</button>
          </div>
        </div>
      </article>
    `;
  }

  function sectionHTML(kind, items) {
    const label = KIND_LABEL[kind] || '图表';
    const body = items.length
      ? `<div class="library-grid">${items.map(itemCardHTML).join('')}</div>`
      : `
        <div class="library-empty">
          <p>还没有${label}</p>
          <button class="btn" type="button" data-library-new="${kind}">新建${label}</button>
        </div>
      `;

    return `
      <section class="library-section" data-library-section="${kind}">
        <div class="library-section-head">
          <span>${label}</span>
          <span class="library-section-count">${items.length}</span>
        </div>
        ${body}
      </section>
    `;
  }

  function renderLibrary() {
    ensureIndex();
    if (!els.body) return;

    clearDeleteTimers();

    const items = list();
    const classCount = items.filter((item) => item.kind === 'class').length;
    const sequenceCount = items.length - classCount;
    const visibleItems = items.filter((item) => filter === 'all' || item.kind === filter);

    if (els.subtitle) {
      els.subtitle.textContent = storageOk
        ? `${classCount} 张类图 · ${sequenceCount} 张时序图 · 所有内容自动保存在当前浏览器`
        : '浏览器存储不可用，以下内容仅在本页面有效';
    }
    if (els.count) {
      els.count.textContent = visibleItems.length ? `共 ${visibleItems.length} 张` : '暂无图表';
    }

    els.tabs.forEach((tab) => {
      const active = tab.dataset.libraryFilter === filter;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    const kinds = filter === 'all' ? KINDS : [filter];
    els.body.innerHTML = kinds.map((kind) => (
      sectionHTML(kind, visibleItems.filter((item) => item.kind === kind))
    )).join('');
  }

  function show() {
    ensureIndex();
    if (!els.dialog) return;
    hideStatus();
    renderLibrary();
    if (!els.dialog.open) els.dialog.showModal();
  }

  function hide() {
    if (els.dialog && els.dialog.open) els.dialog.close();
  }

  function openItem(id) {
    ensureIndex();
    const item = getItem(id);
    if (!item) return;

    flushEditor(item.kind);
    if (index.active[item.kind] !== item.id) {
      setActive(item.kind, item.id);
    }
    hide();
    if (window.ClassoShell && typeof window.ClassoShell.setMode === 'function') {
      window.ClassoShell.setMode(item.kind);
    }
  }

  function handleCreate(kind) {
    if (!KINDS.includes(kind)) return;
    flushEditor(kind);

    const item = create(kind, {
      name: suggestName(kind),
      data: emptyData(kind),
      view: null,
      activate: true
    });

    if (!item) {
      showStatus('创建失败：浏览器存储不可用');
      return;
    }

    hide();
    if (window.ClassoShell && typeof window.ClassoShell.setMode === 'function') {
      window.ClassoShell.setMode(kind);
    }
  }

  function handleDuplicate(id) {
    ensureIndex();
    const item = getItem(id);
    if (!item) return;

    flushEditor(item.kind);
    const copy = duplicate(id);
    renderLibrary();

    if (!copy) {
      showStatus('复制失败：内容无法读取');
      return;
    }
    showStatus(`已复制为「${copy.name}」`);
  }

  function handleDelete(id) {
    ensureIndex();
    const item = getItem(id);
    if (!item) return;
    const name = item.name;

    if (!remove(id)) {
      showStatus('删除失败');
      renderLibrary();
      return;
    }

    renderLibrary();
    showStatus(`已删除「${name}」`);
  }

  function startRename(id) {
    const item = getItem(id);
    if (!item || !els.body) return;

    const card = els.body.querySelector(`.library-item[data-library-id="${item.id}"]`);
    const title = card ? card.querySelector('.library-item-title') : null;
    if (!title) return;

    const input = document.createElement('input');
    input.className = 'library-rename-input';
    input.type = 'text';
    input.maxLength = 80;
    input.value = item.name;
    input.setAttribute('aria-label', '图表名称');
    title.replaceWith(input);
    input.focus();
    input.select();

    let finished = false;
    const finish = (commit) => {
      if (finished) return;
      finished = true;
      const value = input.value.trim();
      if (commit && value && value !== item.name) {
        rename(item.id, value);
      }
      renderLibrary();
    };

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        finish(true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        finish(false);
      }
    });
    input.addEventListener('blur', () => finish(true));
  }

  function bindEvents() {
    if (els.button) {
      els.button.addEventListener('click', () => {
        flushCurrentEditor();
        show();
      });
    }

    if (els.close) {
      els.close.addEventListener('click', hide);
    }

    if (els.dialog) {
      els.dialog.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) return;

        const newButton = event.target.closest('[data-library-new]');
        if (newButton) {
          handleCreate(newButton.dataset.libraryNew);
          return;
        }

        const deleteButton = event.target.closest('[data-library-delete]');
        if (deleteButton) {
          const id = deleteButton.dataset.libraryDelete;
          if (deleteButton.dataset.confirm === '1') {
            clearTimeout(deleteTimers.get(id));
            deleteTimers.delete(id);
            handleDelete(id);
            return;
          }

          deleteButton.dataset.confirm = '1';
          deleteButton.textContent = '确认删除';
          deleteButton.classList.add('is-confirming');
          const timer = setTimeout(() => {
            deleteTimers.delete(id);
            if (!deleteButton.isConnected) return;
            delete deleteButton.dataset.confirm;
            deleteButton.textContent = '删除';
            deleteButton.classList.remove('is-confirming');
          }, 3000);
          deleteTimers.set(id, timer);
          return;
        }

        const renameButton = event.target.closest('[data-library-rename]');
        if (renameButton) {
          startRename(renameButton.dataset.libraryRename);
          return;
        }

        const duplicateButton = event.target.closest('[data-library-duplicate]');
        if (duplicateButton) {
          handleDuplicate(duplicateButton.dataset.libraryDuplicate);
          return;
        }

        const openButton = event.target.closest('[data-library-open]');
        if (openButton) {
          openItem(openButton.dataset.libraryOpen);
          return;
        }

        if (event.target === els.dialog) hide();
      });

      els.dialog.addEventListener('dblclick', (event) => {
        if (!(event.target instanceof Element)) return;
        const title = event.target.closest('.library-item-title');
        if (!title) return;
        const card = title.closest('.library-item');
        if (card) openItem(card.dataset.libraryId);
      });
    }

    els.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        filter = tab.dataset.libraryFilter;
        renderLibrary();
      });
    });

    window.addEventListener('classo:librarychange', () => {
      if (els.dialog && els.dialog.open) renderLibrary();
    });

    window.addEventListener('classo:activechange', () => {
      if (els.dialog && els.dialog.open) renderLibrary();
    });
  }

  window.ClassoLibrary = {
    get available() {
      return storageOk;
    },
    list,
    get: getItem,
    getActive,
    setActive,
    load,
    save,
    create,
    rename,
    duplicate,
    remove,
    suggestName,
    show,
    hide,
    refresh: renderLibrary
  };

  bindEvents();
})();
