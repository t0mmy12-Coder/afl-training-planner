import { getState, setState, subscribe } from '../store.js';
import { createDrillCard } from '../components/drillCard.js';
import { renderDrillDiagram } from '../components/drillDiagram.js';
import { addDrillToActivePlan } from '../components/planPanel.js';

export function mount(root, _params, _navigate) {
  const el = document.createElement('div');
  el.className = 'screen drill-browser';
  root.appendChild(el);

  let state = getState();

  // ── Build tab bar ────────────────────────────────────────────
  const tabBar = document.createElement('div');
  tabBar.className = 'category-tabs';
  tabBar.setAttribute('role', 'tablist');

  // ── Build body ───────────────────────────────────────────────
  const body = document.createElement('div');
  body.className = 'browser-body';

  const listPane = document.createElement('div');
  listPane.className = 'drill-list';

  const diagramPane = document.createElement('div');
  diagramPane.className = 'drill-diagram-pane';

  body.appendChild(listPane);
  body.appendChild(diagramPane);

  el.appendChild(tabBar);
  el.appendChild(body);

  // ── Render tabs ──────────────────────────────────────────────
  function renderTabs() {
    state = getState();
    tabBar.innerHTML = state.categories.map(cat => `
      <button class="tab ${cat.id === state.category ? 'active' : ''}"
              data-cat="${cat.id}"
              role="tab"
              aria-selected="${cat.id === state.category}">
        ${cat.icon} ${cat.name}
      </button>
    `).join('');

    tabBar.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        setState({ category: tab.dataset.cat, selectedDrillId: null });
      });
    });
  }

  // ── Render drill list ────────────────────────────────────────
  function renderList() {
    state = getState();
    const { drills, category, playerCount, selectedDrillId } = state;

    const filtered = drills.filter(d =>
      d.category === category && playerCountMatch(d, playerCount)
    );

    listPane.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'drill-list-header';
    header.textContent = `${filtered.length} drill${filtered.length !== 1 ? 's' : ''}`;
    listPane.appendChild(header);

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <div class="empty-state-icon">🏉</div>
        <div class="empty-state-title">No drills found</div>
        <p>No drills match ${playerCount} players in this category.<br>
        Try selecting a different player count on the home screen.</p>
      `;
      listPane.appendChild(empty);
      return;
    }

    filtered.forEach(drill => {
      const card = createDrillCard(
        drill,
        drill.id === selectedDrillId,
        id => setState({ selectedDrillId: id }),
        id => addDrillToActivePlan(id)
      );
      listPane.appendChild(card);
    });
  }

  // ── Render diagram ───────────────────────────────────────────
  function renderDiagram() {
    state = getState();
    const { drills, selectedDrillId } = state;
    diagramPane.innerHTML = '';

    if (!selectedDrillId) {
      diagramPane.innerHTML = `
        <div class="empty-diagram">
          <div class="empty-diagram-icon">📋</div>
          <p>Select a drill to preview its diagram</p>
        </div>
      `;
      return;
    }

    const drill = drills.find(d => d.id === selectedDrillId);
    if (!drill) return;

    const card = renderDrillDiagram(drill, id => addDrillToActivePlan(id));
    diagramPane.appendChild(card);
  }

  // ── Subscribe to store ───────────────────────────────────────
  let prevCategory      = getState().category;
  let prevSelectedDrill = getState().selectedDrillId;
  let prevPlayerCount   = getState().playerCount;

  const unsubscribe = subscribe(newState => {
    const catChanged    = newState.category      !== prevCategory;
    const drillChanged  = newState.selectedDrillId !== prevSelectedDrill;
    const countChanged  = newState.playerCount   !== prevPlayerCount;

    if (catChanged || countChanged) {
      prevCategory     = newState.category;
      prevPlayerCount  = newState.playerCount;
      renderTabs();
      renderList();
    }

    if (drillChanged || catChanged) {
      prevSelectedDrill = newState.selectedDrillId;
      renderDiagram();
    }
  });

  // Initial render
  renderTabs();
  renderList();
  renderDiagram();

  // Return unmount function
  return unsubscribe;
}

function playerCountMatch(drill, playerCount) {
  if (playerCount === null) return true;
  return playerCount >= drill.minPlayers && playerCount <= drill.maxPlayers;
}
