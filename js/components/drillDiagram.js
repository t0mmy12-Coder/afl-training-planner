import { buildDiagramSVG } from '../utils/svgHelpers.js';

export function renderDrillDiagram(drill, onAddToPlan) {
  const el = document.createElement('div');
  el.className = 'drill-diagram-card';

  const svgMarkup = buildDiagramSVG(drill.diagram);
  const hasArrows = drill.diagram.arrows && drill.diagram.arrows.length > 0;

  const legendItems = [];
  const arrowTypes = new Set((drill.diagram.arrows || []).map(a => a.type));
  if (arrowTypes.has('run'))      legendItems.push(legendItem('run', '#4CAF50', 'Run'));
  if (arrowTypes.has('kick'))     legendItems.push(legendItem('kick', '#FFD700', 'Kick', '9,5'));
  if (arrowTypes.has('handball')) legendItems.push(legendItem('handball', '#FF9800', 'Handball', '3,4'));
  // Custom types from diagram
  (drill.diagram.customTypes || []).forEach(ct => {
    if (arrowTypes.has(ct.id)) legendItems.push(legendItem(ct.id, ct.color, ct.label, ct.dash));
  });

  el.innerHTML = `
    <div class="diagram-header">
      <div class="diagram-title">${esc(drill.name)}</div>
      <div class="diagram-meta">
        <span>⏱ ${drill.durationMinutes} min</span>
        <span>👥 ${playerRange(drill)}</span>
      </div>
    </div>

    <div class="diagram-svg-container">
      ${svgMarkup}
    </div>

    <div class="diagram-description">${esc(drill.description)}</div>

    ${hasArrows ? `
      <div class="diagram-legend">
        ${legendItems.join('')}
      </div>
    ` : ''}

    <button class="btn-add-to-plan">＋ Add to Training Plan</button>
  `;

  el.querySelector('.btn-add-to-plan').addEventListener('click', () => {
    onAddToPlan(drill.id);
    const btn = el.querySelector('.btn-add-to-plan');
    btn.textContent = '✓ Added!';
    btn.style.background = '#1a7a2e';
    setTimeout(() => {
      btn.textContent = '＋ Add to Training Plan';
      btn.style.background = '';
    }, 1200);
  });

  return el;
}

function legendItem(type, color, label, dash = '') {
  const borderStyle = dash
    ? `border-top: 2.5px ${dash === '3,4' ? 'dotted' : 'dashed'} ${color}; background: transparent; height: 0;`
    : `background: ${color}; height: 2.5px;`;

  return `
    <span class="legend-item">
      <span class="legend-dash" style="${borderStyle} width:22px; display:inline-block; border-radius:1px; vertical-align:middle;"></span>
      ${label}
    </span>
  `;
}

function playerRange(drill) {
  return drill.maxPlayers >= 99
    ? `${drill.minPlayers}+ players`
    : `${drill.minPlayers}–${drill.maxPlayers} players`;
}

function fieldTypeLabel(type) {
  const labels = {
    oval_half: 'Half Oval',
    corridor:  'Corridor',
    box:       'Box Grid',
    open:      'Open Field'
  };
  return labels[type] || type;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
