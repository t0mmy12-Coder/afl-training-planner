import { getState, setState, subscribe } from '../store.js';
import { createDiagramEditor } from '../components/diagramEditor.js';
import {
  loadCustomDrills, saveCustomDrill, removeCustomDrill,
  markDeleted, mergeWithBase
} from '../utils/drillStorage.js';

const BLANK_DIAGRAM = {
  fieldType: 'oval_half', players: [], arrows: [], customTypes: []
};

function newDrill(categories) {
  return {
    id: `custom_${Date.now()}`,
    name: 'New Drill',
    category: categories[0]?.id || 'warm_up',
    minPlayers: 4,
    maxPlayers: 99,
    durationMinutes: 10,
    description: '',
    diagram: JSON.parse(JSON.stringify(BLANK_DIAGRAM)),
    _custom: true
  };
}

export function mount(root, _params, _navigate) {
  const el = document.createElement('div');
  el.className = 'screen drill-editor';
  root.appendChild(el);

  // 3-pane layout: list | diagram | form
  const listPane    = document.createElement('div');
  const diagramPane = document.createElement('div');
  const formPane    = document.createElement('div');
  listPane.className    = 'de-list-pane';
  diagramPane.className = 'de-diagram-pane';
  formPane.className    = 'de-form-pane';
  el.append(listPane, diagramPane, formPane);

  let state   = getState();
  let editing = null;
  let diagram = null;
  let isNew   = false;

  // ── List pane ──────────────────────────────────────────────────────────────
  function renderList() {
    state = getState();
    const custom = new Set(loadCustomDrills().map(d => d.id));

    listPane.innerHTML = `
      <div class="de-list-header">
        <span>All Drills</span>
        <button class="de-tool-btn" id="de-new">＋ New</button>
      </div>
    `;

    listPane.querySelector('#de-new').addEventListener('click', () => {
      isNew   = true;
      editing = newDrill(state.categories);
      diagram = JSON.parse(JSON.stringify(editing.diagram));
      renderDiagram();
      renderForm();
      renderList();
    });

    state.categories.forEach(cat => {
      const drills = state.drills.filter(d => d.category === cat.id);
      if (!drills.length) return;
      const group = document.createElement('div');
      group.innerHTML = `<div class="de-list-cat">${cat.icon} ${cat.name}</div>`;
      drills.forEach(drill => {
        const row = document.createElement('div');
        row.className = `de-list-row ${editing?.id === drill.id ? 'active' : ''}`;
        row.innerHTML = `
          <span class="de-list-name">${drill.name}</span>
          ${custom.has(drill.id) ? '<span class="de-custom-badge">custom</span>' : ''}
        `;
        row.addEventListener('click', () => {
          isNew   = false;
          editing = JSON.parse(JSON.stringify(drill));
          diagram = JSON.parse(JSON.stringify(editing.diagram));
          renderDiagram();
          renderForm();
          renderList();
        });
        group.appendChild(row);
      });
      listPane.appendChild(group);
    });
  }

  // ── Diagram pane ───────────────────────────────────────────────────────────
  function renderDiagram() {
    diagramPane.innerHTML = '';
    if (!editing) {
      diagramPane.innerHTML = `
        <div class="de-empty">
          <div style="font-size:2.5rem;opacity:.2">🏈</div>
          <p>Select or create a drill to edit its diagram.</p>
        </div>`;
      return;
    }
    const editorEl = createDiagramEditor(diagram, newDiag => { diagram = newDiag; });
    diagramPane.appendChild(editorEl);
  }

  // ── Form pane ──────────────────────────────────────────────────────────────
  function renderForm() {
    formPane.innerHTML = '';
    if (!editing) {
      formPane.innerHTML = `
        <div class="de-empty" style="padding:2rem 1rem">
          <p style="font-size:.85rem">Select a drill from the list.</p>
        </div>`;
      return;
    }

    const cats = state.categories;

    formPane.innerHTML = `
      <div class="de-form">
        <div class="de-form-group">
          <label class="de-form-label">Drill Name</label>
          <input class="de-input" id="de-name" value="${esc(editing.name)}">
        </div>
        <div class="de-form-group">
          <label class="de-form-label">Category</label>
          <select class="de-select" id="de-cat" style="width:100%">
            ${cats.map(c => `<option value="${c.id}" ${editing.category===c.id?'selected':''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="de-form-row">
          <div class="de-form-group">
            <label class="de-form-label">Min Players</label>
            <input class="de-input" id="de-min" type="number" min="1" max="50" value="${editing.minPlayers}">
          </div>
          <div class="de-form-group">
            <label class="de-form-label">Max Players</label>
            <input class="de-input" id="de-max" type="number" min="1" max="99" value="${editing.maxPlayers}">
          </div>
        </div>
        <div class="de-form-group">
          <label class="de-form-label">Duration (min)</label>
          <input class="de-input" id="de-dur" type="number" min="1" max="120" value="${editing.durationMinutes}">
        </div>
        <div class="de-form-group">
          <label class="de-form-label">Description</label>
          <textarea class="de-input de-textarea" id="de-desc">${esc(editing.description)}</textarea>
        </div>
        <div class="de-actions">
          <button class="btn-save-drill" id="de-save">💾 Save</button>
          ${!isNew ? `<button class="btn-del-drill" id="de-del">🗑 Delete</button>` : ''}
          <button class="btn-cancel-drill" id="de-cancel">Cancel</button>
        </div>
      </div>
    `;

    formPane.querySelector('#de-save').addEventListener('click', saveDrill);
    formPane.querySelector('#de-cancel').addEventListener('click', () => {
      editing = null; diagram = null;
      renderDiagram(); renderForm(); renderList();
    });
    formPane.querySelector('#de-del')?.addEventListener('click', () => {
      if (!confirm(`Delete "${editing.name}"?`)) return;
      const id = editing.id;
      const isBase = !loadCustomDrills().find(d => d.id === id);
      removeCustomDrill(id);
      if (isBase) markDeleted(id);
      rebuildStore();
      editing = null; diagram = null;
      renderDiagram(); renderForm(); renderList();
    });
  }

  function saveDrill() {
    const name = formPane.querySelector('#de-name').value.trim();
    if (!name) { alert('Drill name is required.'); return; }

    editing.name            = name;
    editing.category        = formPane.querySelector('#de-cat').value;
    editing.minPlayers      = parseInt(formPane.querySelector('#de-min').value) || 1;
    editing.maxPlayers      = parseInt(formPane.querySelector('#de-max').value) || 99;
    editing.durationMinutes = parseInt(formPane.querySelector('#de-dur').value) || 10;
    editing.description     = formPane.querySelector('#de-desc').value.trim();
    editing.diagram         = diagram;
    editing._custom         = true;

    saveCustomDrill(editing);
    rebuildStore();
    isNew = false;
    renderList();

    const btn = formPane.querySelector('#de-save');
    if (btn) {
      btn.textContent = '✓ Saved!'; btn.style.background = '#1a7a2e';
      setTimeout(() => { btn.textContent = '💾 Save'; btn.style.background = ''; }, 1400);
    }
  }

  function rebuildStore() {
    const { baseDrills } = getState();
    setState({ drills: mergeWithBase(baseDrills, loadCustomDrills()) });
  }

  const unsubscribe = subscribe(newState => {
    if (newState.drills !== state.drills) { state = newState; renderList(); }
  });

  renderList();
  renderDiagram();
  renderForm();

  return unsubscribe;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
