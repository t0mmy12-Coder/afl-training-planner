import { getState, subscribe, setState } from '../store.js';

let _navigate = null;

export function mountNavBar(el, navigateFn) {
  _navigate = navigateFn;
  render(el);
  subscribe(() => render(el));
}

function render(el) {
  const { activeScreen, category, categories, plans, activePlanId, playerCount } = getState();

  const activePlan = plans.find(p => p.id === activePlanId);
  const drillCount = activePlan ? activePlan.drills.length : 0;

  const catName = category
    ? (categories.find(c => c.id === category)?.name ?? category)
    : null;

  const crumbs = buildCrumbs(activeScreen, playerCount, catName);

  el.innerHTML = `
    <div class="nav-inner">
      <div class="nav-logo" id="nav-home">
        <svg class="nav-logo-oval" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="14" cy="10" rx="13" ry="9"
            fill="none" stroke="#FFD700" stroke-width="2"/>
          <line x1="14" y1="1" x2="14" y2="19" stroke="#FFD700" stroke-width="1.5"/>
          <line x1="1"  y1="10" x2="27" y2="10" stroke="#FFD700" stroke-width="1.5"/>
        </svg>
        AFL PLANNER
      </div>

      <nav class="nav-breadcrumb" aria-label="Navigation">
        ${crumbs}
      </nav>

      <div class="nav-actions">
        <button class="btn-plan" id="btn-plan-toggle" aria-label="Toggle training plan">
          📋 Training Plan
          ${drillCount > 0 ? `<span class="badge">${drillCount}</span>` : ''}
        </button>
      </div>
    </div>
  `;

  el.querySelector('#nav-home').addEventListener('click', () => {
    setState({ activeScreen: 'landing', category: null, selectedDrillId: null });
    _navigate('landing');
  });

  el.querySelector('#btn-plan-toggle').addEventListener('click', () => {
    setState({ panelOpen: !getState().panelOpen });
  });

  // Breadcrumb nav
  el.querySelectorAll('[data-crumb]').forEach(node => {
    node.addEventListener('click', () => {
      const target = node.dataset.crumb;
      if (target === 'landing') {
        setState({ activeScreen: 'landing', category: null, selectedDrillId: null });
        _navigate('landing');
      } else if (target === 'categories') {
        setState({ activeScreen: 'categories', category: null, selectedDrillId: null });
        _navigate('categories');
      }
    });
  });
}

function buildCrumbs(activeScreen, playerCount, catName) {
  const sep = '<span class="sep">›</span>';

  if (activeScreen === 'landing') {
    return `<span class="crumb active">Home</span>`;
  }

  if (activeScreen === 'categories') {
    const pc = playerCount != null ? ` · ${playerCount} players` : '';
    return [
      `<span class="crumb" data-crumb="landing">Home</span>`,
      sep,
      `<span class="crumb active">Categories${pc}</span>`
    ].join('');
  }

  if (activeScreen === 'drills') {
    return [
      `<span class="crumb" data-crumb="landing">Home</span>`,
      sep,
      `<span class="crumb" data-crumb="categories">Categories</span>`,
      sep,
      `<span class="crumb active">${catName ?? 'Drills'}</span>`
    ].join('');
  }

  return '';
}
