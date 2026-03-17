// Renders a single drill list item.
// Returns a DOM element; caller handles click events.

export function createDrillCard(drill, isActive, onSelect, onAdd) {
  const el = document.createElement('div');
  el.className = `drill-card${isActive ? ' active' : ''}`;
  el.dataset.drillId = drill.id;

  el.innerHTML = `
    <div class="drill-card-info">
      <div class="drill-card-name" title="${esc(drill.name)}">${esc(drill.name)}</div>
      <div class="drill-card-meta">
        ${drill.durationMinutes} min
        &nbsp;·&nbsp;
        ${playerRange(drill)}
      </div>
    </div>
    <button class="btn-add-drill" title="Add to training plan" aria-label="Add ${esc(drill.name)} to plan">+</button>
  `;

  el.addEventListener('click', e => {
    if (!e.target.closest('.btn-add-drill')) {
      onSelect(drill.id);
    }
  });

  el.querySelector('.btn-add-drill').addEventListener('click', e => {
    e.stopPropagation();
    onAdd(drill.id);
    // Brief visual feedback
    const btn = e.currentTarget;
    btn.textContent = '✓';
    btn.style.background = 'var(--afl-gold)';
    btn.style.color = 'var(--afl-navy)';
    setTimeout(() => {
      btn.textContent = '+';
      btn.style.background = '';
      btn.style.color = '';
    }, 800);
  });

  return el;
}

function playerRange(drill) {
  if (drill.maxPlayers >= 99) {
    return `${drill.minPlayers}+ players`;
  }
  return `${drill.minPlayers}–${drill.maxPlayers} players`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
