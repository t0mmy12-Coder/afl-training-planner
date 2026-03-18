import { fieldBackground } from '../utils/svgHelpers.js';

const W = 400, H = 300, R = 13, HANDLE_R = 7;

const ROLE_STYLES = {
  leader:   { fill: '#003087', text: '#FFD700', stroke: 'rgba(255,215,0,0.6)', sw: 2 },
  attacker: { fill: '#CC0000', text: '#FFFFFF', stroke: 'rgba(0,0,0,0.3)',     sw: 1 },
  defender: { fill: '#FFFFFF', text: '#003087', stroke: '#003087',             sw: 2 },
  player:   { fill: '#4A6FA5', text: '#FFFFFF', stroke: 'rgba(0,0,0,0.3)',     sw: 1 }
};

const STD_ARROW = {
  run:      { color: '#4CAF50', dash: '' },
  kick:     { color: '#FFD700', dash: '9,5' },
  handball: { color: '#FF9800', dash: '3,4' }
};

let _seq = 0;
const uid = () => `de${Date.now()}${++_seq}`;

function toNorm(svg, cx, cy) {
  const pt = svg.createSVGPoint();
  pt.x = cx; pt.y = cy;
  const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse());
  return { x: Math.max(0, Math.min(1, x / W)), y: Math.max(0, Math.min(1, y / H)) };
}

function toFreeForm(a, players) {
  if (a.x1 !== undefined) return { ...a, id: a.id || uid() };
  const f = players.find(p => p.id === a.from);
  const t = players.find(p => p.id === a.to);
  if (!f || !t) return null;
  return { id: uid(), x1: f.x, y1: f.y, x2: t.x, y2: t.y, type: a.type };
}

export function createDiagramEditor(initDiagram, onChange) {
  let d = JSON.parse(JSON.stringify(initDiagram));
  d.arrows = (d.arrows || []).map(a => toFreeForm(a, d.players)).filter(Boolean);
  d.players.forEach(p => { if (!p.id) p.id = uid(); });
  if (!d.customTypes) d.customTypes = [];

  let tool  = 'select';
  let role  = 'player';
  let aType = 'run';
  let selId = null;
  let draft = null;
  let showCtForm = false; // inline custom type form

  const wrap = document.createElement('div');
  wrap.className = 'de-wrap';

  const toolbar    = document.createElement('div');
  const canvasWrap = document.createElement('div');
  const legendWrap = document.createElement('div');
  toolbar.className    = 'de-toolbar';
  canvasWrap.className = 'de-canvas-wrap';
  wrap.append(toolbar, canvasWrap, legendWrap);

  function emit() { onChange(JSON.parse(JSON.stringify(d))); }

  function arrowStyle(type) {
    if (STD_ARROW[type]) return STD_ARROW[type];
    const ct = d.customTypes.find(t => t.id === type);
    return ct ? { color: ct.color, dash: ct.dash } : STD_ARROW.run;
  }

  function nextLabel() {
    if (role === 'leader') return 'L';
    const nums = d.players.map(p => parseInt(p.label)).filter(n => !isNaN(n));
    let n = 1; while (nums.includes(n)) n++; return String(n);
  }

  // ── SVG content ───────────────────────────────────────────────────────────
  // KEY FIX: bg rect is FIRST (lowest z-order) so players/arrows sit on top.
  // fieldBackground is wrapped in pointer-events:none so field graphics don't
  // steal events from the background rect.
  function svgContent() {
    const stdMarkers = Object.entries(STD_ARROW).map(([id, s]) =>
      `<marker id="de-${id}" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="${s.color}"/>
      </marker>`).join('');
    const customMarkers = d.customTypes.map(ct =>
      `<marker id="de-${ct.id}" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="${ct.color}"/>
      </marker>`).join('');

    const cursor = (tool === 'addPlayer' || tool === 'addArrow') ? 'crosshair'
                 : tool === 'delete' ? 'default' : 'default';

    const arrows = d.arrows.map(a => {
      const { color, dash } = arrowStyle(a.type);
      const dashAttr = dash ? `stroke-dasharray="${dash}"` : '';
      const isSel = a.id === selId;
      const x1 = (a.x1*W).toFixed(1), y1 = (a.y1*H).toFixed(1);
      const x2 = (a.x2*W).toFixed(1), y2 = (a.y2*H).toFixed(1);
      const arrowCursor = tool === 'delete' ? 'pointer'
                        : (tool === 'select' || isSel) ? 'grab' : 'default';
      return `
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
          stroke="${color}" stroke-width="2" ${dashAttr} stroke-linecap="round"
          marker-end="url(#de-${a.type})" pointer-events="none"/>
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
          stroke="rgba(255,255,255,0.01)" stroke-width="14" pointer-events="all"
          data-arrow="${a.id}" class="de-arrow-hit" style="cursor:${arrowCursor}"/>
        ${isSel ? `
          <circle cx="${x1}" cy="${y1}" r="${HANDLE_R}" fill="${color}" opacity="0.9"
            class="de-handle" data-handle="start" data-arrow="${a.id}"
            style="cursor:crosshair"/>
          <circle cx="${x2}" cy="${y2}" r="${HANDLE_R}" fill="${color}" opacity="0.9"
            class="de-handle" data-handle="end" data-arrow="${a.id}"
            style="cursor:crosshair"/>
        ` : ''}
      `;
    }).join('');

    const draftLine = draft ? (() => {
      const { color, dash } = arrowStyle(aType);
      return `<line x1="${(draft.x1*W).toFixed(1)}" y1="${(draft.y1*H).toFixed(1)}"
        x2="${(draft.x2*W).toFixed(1)}" y2="${(draft.y2*H).toFixed(1)}"
        stroke="${color}" stroke-width="2" ${dash ? `stroke-dasharray="${dash}"` : ''}
        stroke-linecap="round" opacity="0.55" pointer-events="none"/>`;
    })() : '';

    const players = d.players.map(p => {
      const s = ROLE_STYLES[p.role] || ROLE_STYLES.player;
      const isSel = p.id === selId;
      const cx = (p.x*W).toFixed(1), cy = (p.y*H).toFixed(1);
      const pCursor = tool === 'delete' ? 'pointer'
                    : (tool === 'select' || tool === 'addArrow') ? 'grab' : 'default';
      return `
        <circle cx="${cx}" cy="${cy}" r="${R}"
          fill="${s.fill}" stroke="${isSel ? '#FFD700' : s.stroke}"
          stroke-width="${isSel ? 3 : s.sw}" pointer-events="all"
          data-player="${p.id}" class="de-player" style="cursor:${pCursor}"/>
        <text x="${cx}" y="${(p.y*H+4.5).toFixed(1)}" text-anchor="middle"
          font-family="system-ui,sans-serif" font-size="10" font-weight="700"
          fill="${s.text}" pointer-events="none">${p.label}</text>
      `;
    }).join('');

    return `
      <defs>${stdMarkers}${customMarkers}</defs>
      <rect width="${W}" height="${H}" fill="transparent" class="de-bg"
        pointer-events="all" style="cursor:${cursor}"/>
      <g pointer-events="none">${fieldBackground(d.fieldType)}</g>
      ${arrows}
      ${draftLine}
      ${players}
    `;
  }

  function refreshSVG() {
    const svg = canvasWrap.querySelector('svg');
    if (svg) svg.innerHTML = svgContent();
  }

  function renderCanvas() {
    canvasWrap.innerHTML = `<svg class="de-svg" viewBox="0 0 ${W} ${H}"
      xmlns="http://www.w3.org/2000/svg">
      ${svgContent()}
    </svg>`;
    canvasWrap.querySelector('svg').addEventListener('pointerdown', onDown);
  }

  // ── Toolbar ───────────────────────────────────────────────────────────────
  function renderToolbar() {
    const tools = [
      { id:'select',    label:'↖ Select'  },
      { id:'addPlayer', label:'+ Player'  },
      { id:'addArrow',  label:'→ Arrow'   },
      { id:'delete',    label:'✕ Delete'  }
    ];
    const roles = ['player','leader','attacker','defender'];
    const stdTypes = Object.keys(STD_ARROW);
    const allTypes = [...stdTypes, ...d.customTypes.map(t => t.id)];
    const typeLabel = { run:'Run', kick:'Kick', handball:'Handball',
      ...Object.fromEntries(d.customTypes.map(t => [t.id, t.label])) };
    const fields = { oval_half:'Half Oval', corridor:'Corridor', box:'Box', open:'Open' };

    toolbar.innerHTML = `
      <div class="de-tool-group">
        ${tools.map(t => `<button class="de-tool-btn ${tool===t.id?'active':''}"
          data-tool="${t.id}">${t.label}</button>`).join('')}
      </div>
      ${tool === 'addPlayer' ? `
        <div class="de-tool-group">
          <span class="de-label">Role:</span>
          ${roles.map(r => `<button class="de-tool-btn ${role===r?'active':''}"
            data-role="${r}">${r}</button>`).join('')}
        </div>` : ''}
      ${tool === 'addArrow' ? `
        <div class="de-tool-group">
          <span class="de-label">Type:</span>
          ${allTypes.map(t => `<button class="de-tool-btn ${aType===t?'active':''}"
            data-atype="${t}">${typeLabel[t]||t}</button>`).join('')}
          <button class="de-tool-btn ${showCtForm?'active':''}" id="de-btn-newtype">+ Custom</button>
        </div>
        ${showCtForm ? `
          <div class="de-tool-group de-ct-form">
            <input class="de-input de-ct-label" placeholder="Label" maxlength="20">
            <input type="color" class="de-ct-color" value="#FF44AA" title="Colour">
            <select class="de-select de-ct-dash">
              <option value="">Solid</option>
              <option value="9,5">Dashed</option>
              <option value="3,4">Dotted</option>
            </select>
            <button class="de-tool-btn" id="de-ct-confirm">Add</button>
          </div>` : ''}
      ` : ''}
      <div class="de-tool-group">
        <span class="de-label">Field:</span>
        <select class="de-select" data-field>
          ${Object.entries(fields).map(([v,l]) =>
            `<option value="${v}" ${d.fieldType===v?'selected':''}>${l}</option>`).join('')}
        </select>
      </div>
    `;

    toolbar.querySelectorAll('[data-tool]').forEach(b =>
      b.addEventListener('click', () => {
        tool = b.dataset.tool; selId = null; draft = null; showCtForm = false; renderAll();
      }));
    toolbar.querySelectorAll('[data-role]').forEach(b =>
      b.addEventListener('click', () => { role = b.dataset.role; renderToolbar(); }));
    toolbar.querySelectorAll('[data-atype]').forEach(b =>
      b.addEventListener('click', () => { aType = b.dataset.atype; showCtForm = false; renderToolbar(); }));
    toolbar.querySelector('[data-field]')?.addEventListener('change', e => {
      d.fieldType = e.target.value; emit(); refreshSVG();
    });
    toolbar.querySelector('#de-btn-newtype')?.addEventListener('click', () => {
      showCtForm = !showCtForm; renderToolbar();
    });
    toolbar.querySelector('#de-ct-confirm')?.addEventListener('click', () => {
      const label = toolbar.querySelector('.de-ct-label').value.trim();
      if (!label) return;
      const color = toolbar.querySelector('.de-ct-color').value;
      const dash  = toolbar.querySelector('.de-ct-dash').value;
      const id    = `ct_${Date.now()}`;
      d.customTypes.push({ id, label, color, dash });
      aType = id;
      showCtForm = false;
      emit(); renderAll();
    });
  }

  // ── Legend ────────────────────────────────────────────────────────────────
  function renderLegend() {
    legendWrap.innerHTML = `
      <div class="de-legend-editor">
        <div class="de-legend-title">Legend</div>
        <div class="de-legend-std">
          <span class="de-legend-item"><span class="de-swatch" style="background:#4CAF50"></span>Run</span>
          <span class="de-legend-item"><span class="de-swatch de-swatch-dash" style="border-color:#FFD700"></span>Kick</span>
          <span class="de-legend-item"><span class="de-swatch de-swatch-dot" style="border-color:#FF9800"></span>Handball</span>
          ${d.customTypes.map(ct => `
            <span class="de-legend-item">
              <span class="de-swatch" style="background:${ct.color}"></span>
              ${ct.label}
              <button class="de-legend-del" data-deltype="${ct.id}" title="Remove">✕</button>
            </span>`).join('')}
        </div>
      </div>
    `;
    legendWrap.querySelectorAll('[data-deltype]').forEach(b =>
      b.addEventListener('click', () => {
        const id = b.dataset.deltype;
        d.customTypes = d.customTypes.filter(t => t.id !== id);
        d.arrows = d.arrows.filter(a => a.type !== id);
        if (aType === id) aType = 'run';
        emit(); renderAll();
      }));
  }

  function renderAll() { renderToolbar(); renderCanvas(); renderLegend(); }

  // ── Drag & interaction ────────────────────────────────────────────────────
  let dragState = null;

  function onDown(e) {
    e.preventDefault();
    const svg  = canvasWrap.querySelector('svg');
    const norm = toNorm(svg, e.clientX, e.clientY);
    const tgt  = e.target;

    // Arrow endpoint handle
    if (tgt.classList.contains('de-handle')) {
      dragState = { kind: 'arrowHandle', id: tgt.dataset.arrow, handle: tgt.dataset.handle };
      window.addEventListener('pointermove', onDragMove);
      window.addEventListener('pointerup',   onDragEnd);
      return;
    }

    // Player circle
    if (tgt.classList.contains('de-player')) {
      const pid = tgt.dataset.player;
      if (tool === 'delete') {
        d.players = d.players.filter(p => p.id !== pid);
        selId = null; emit(); renderAll(); return;
      }
      selId = pid;
      dragState = { kind: 'player', id: pid };
      window.addEventListener('pointermove', onDragMove);
      window.addEventListener('pointerup',   onDragEnd);
      refreshSVG();
      return;
    }

    // Arrow body (wide transparent hit area)
    if (tgt.classList.contains('de-arrow-hit')) {
      const aid = tgt.dataset.arrow;
      if (tool === 'delete') {
        d.arrows = d.arrows.filter(a => a.id !== aid);
        selId = null; emit(); renderAll(); return;
      }
      selId = aid;
      dragState = { kind: 'arrowBody', id: aid, prevX: norm.x, prevY: norm.y };
      window.addEventListener('pointermove', onDragMove);
      window.addEventListener('pointerup',   onDragEnd);
      refreshSVG();
      return;
    }

    // Background
    if (tool === 'addPlayer') {
      d.players.push({ id: uid(), x: norm.x, y: norm.y, role, label: nextLabel() });
      selId = null; emit(); renderAll();
    } else if (tool === 'addArrow') {
      draft = { x1: norm.x, y1: norm.y, x2: norm.x, y2: norm.y };
      window.addEventListener('pointermove', onDraftMove);
      window.addEventListener('pointerup',   onDraftEnd);
    } else {
      selId = null; refreshSVG();
    }
  }

  function onDragMove(e) {
    const svg  = canvasWrap.querySelector('svg');
    if (!svg || !dragState) return;
    const norm = toNorm(svg, e.clientX, e.clientY);

    if (dragState.kind === 'player') {
      const p = d.players.find(p => p.id === dragState.id);
      if (p) { p.x = norm.x; p.y = norm.y; refreshSVG(); }

    } else if (dragState.kind === 'arrowHandle') {
      const a = d.arrows.find(a => a.id === dragState.id);
      if (a) {
        if (dragState.handle === 'start') { a.x1 = norm.x; a.y1 = norm.y; }
        else                              { a.x2 = norm.x; a.y2 = norm.y; }
        refreshSVG();
      }

    } else if (dragState.kind === 'arrowBody') {
      const a = d.arrows.find(a => a.id === dragState.id);
      if (a) {
        const dx = norm.x - dragState.prevX;
        const dy = norm.y - dragState.prevY;
        a.x1 = Math.max(0, Math.min(1, a.x1 + dx));
        a.y1 = Math.max(0, Math.min(1, a.y1 + dy));
        a.x2 = Math.max(0, Math.min(1, a.x2 + dx));
        a.y2 = Math.max(0, Math.min(1, a.y2 + dy));
        dragState.prevX = norm.x;
        dragState.prevY = norm.y;
        refreshSVG();
      }
    }
  }

  function onDragEnd() {
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup',   onDragEnd);
    emit();
    dragState = null;
  }

  function onDraftMove(e) {
    const svg = canvasWrap.querySelector('svg');
    if (!svg || !draft) return;
    const norm = toNorm(svg, e.clientX, e.clientY);
    draft.x2 = norm.x; draft.y2 = norm.y;
    refreshSVG();
  }

  function onDraftEnd(e) {
    window.removeEventListener('pointermove', onDraftMove);
    window.removeEventListener('pointerup',   onDraftEnd);
    if (draft) {
      const dx = (draft.x2 - draft.x1) * W;
      const dy = (draft.y2 - draft.y1) * H;
      if (Math.sqrt(dx*dx + dy*dy) > 10) {
        d.arrows.push({ id: uid(), x1: draft.x1, y1: draft.y1,
          x2: draft.x2, y2: draft.y2, type: aType });
        emit();
      }
      draft = null;
      refreshSVG();
    }
  }

  renderAll();
  return wrap;
}
