import { getState, setState } from '../store.js';

export function mount(root, _params, navigate) {
  const { categories, drills, playerCount } = getState();
  const el = document.createElement('div');
  el.className = 'screen categories-screen';

  const pcLabel = playerCount != null ? `${playerCount} players` : 'all squad sizes';

  el.innerHTML = `
    <div class="screen-header">
      <h2 class="screen-title">Choose a Category</h2>
      <p class="screen-subtitle">Showing drills suitable for ${pcLabel}</p>
    </div>

    <div class="category-grid">
      ${categories.map(cat => {
        const count = drills.filter(d =>
          d.category === cat.id && playerCountMatch(d, playerCount)
        ).length;

        return `
          <div class="category-card"
               data-cat="${cat.id}"
               style="--card-accent: ${cat.accentColor}"
               tabindex="0"
               role="button"
               aria-label="${cat.name} — ${count} drills">
            <span class="category-icon" aria-hidden="true">${cat.icon}</span>
            <span class="category-name">${cat.name}</span>
            <span class="category-desc">${cat.description}</span>
            <span class="category-count">${count} drill${count !== 1 ? 's' : ''}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;

  root.appendChild(el);

  el.querySelectorAll('.category-card').forEach(card => {
    const activate = () => {
      const catId = card.dataset.cat;
      setState({ category: catId, activeScreen: 'drills', selectedDrillId: null });
      navigate('drills');
    };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') activate();
    });
  });
}

function playerCountMatch(drill, playerCount) {
  if (playerCount === null) return true;
  return playerCount >= drill.minPlayers && playerCount <= drill.maxPlayers;
}
