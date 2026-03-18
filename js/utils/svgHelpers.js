// SVG building blocks for AFL drill diagrams
// All diagrams use viewBox="0 0 400 300"

const W = 400;
const H = 300;

// ─── Field backgrounds ────────────────────────────────────────────

export function fieldBackground(type) {
  switch (type) {
    case 'oval_half': return ovalHalf();
    case 'corridor':  return corridor();
    case 'box':       return box();
    default:          return openField();
  }
}

function ovalHalf() {
  return `
    <rect width="${W}" height="${H}" fill="#2D5A1B"/>
    <!-- Oval boundary arc -->
    <path d="M 22,${H} Q 22,0 ${W/2},0 Q ${W-22},0 ${W-22},${H}"
          fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="2"/>
    <!-- 50m arc -->
    <path d="M 55,${H} Q ${W/2},155 ${W-55},${H}"
          fill="none" stroke="rgba(255,255,255,0.20)" stroke-width="1.5"
          stroke-dasharray="7,5"/>
    <!-- Goal square -->
    <rect x="170" y="2" width="60" height="22"
          fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.38)" stroke-width="1.5"/>
    <!-- Goal posts (2 big, 2 small) -->
    <line x1="155" y1="0" x2="155" y2="20" stroke="rgba(255,255,255,0.65)" stroke-width="2.5"/>
    <line x1="170" y1="0" x2="170" y2="12" stroke="rgba(255,255,255,0.65)" stroke-width="2.5"/>
    <line x1="230" y1="0" x2="230" y2="12" stroke="rgba(255,255,255,0.65)" stroke-width="2.5"/>
    <line x1="245" y1="0" x2="245" y2="20" stroke="rgba(255,255,255,0.65)" stroke-width="2.5"/>
    <!-- Centre mark -->
    <circle cx="${W/2}" cy="${H/2}" r="3" fill="rgba(255,255,255,0.28)"/>
    <circle cx="${W/2}" cy="${H/2}" r="22"
            fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
  `;
}

function corridor() {
  return `
    <rect width="${W}" height="${H}" fill="#2D5A1B"/>
    <!-- Corridor walls -->
    <rect x="100" y="0" width="200" height="${H}"
          fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.30)" stroke-width="1.5"/>
    <!-- Start / end dashed lines -->
    <line x1="100" y1="28" x2="300" y2="28"
          stroke="rgba(255,255,255,0.38)" stroke-width="1.5" stroke-dasharray="5,4"/>
    <line x1="100" y1="${H-28}" x2="300" y2="${H-28}"
          stroke="rgba(255,255,255,0.38)" stroke-width="1.5" stroke-dasharray="5,4"/>
    <!-- Centre line -->
    <line x1="100" y1="${H/2}" x2="300" y2="${H/2}"
          stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="4,5"/>
  `;
}

function box() {
  return `
    <rect width="${W}" height="${H}" fill="#2D5A1B"/>
    <!-- Box outline -->
    <rect x="52" y="22" width="296" height="256"
          fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.30)" stroke-width="1.5"/>
    <!-- Corner ticks -->
    <path d="M52,48 L52,22 L78,22" fill="none" stroke="rgba(255,255,255,0.30)" stroke-width="1"/>
    <path d="M322,22 L348,22 L348,48" fill="none" stroke="rgba(255,255,255,0.30)" stroke-width="1"/>
    <path d="M52,252 L52,278 L78,278" fill="none" stroke="rgba(255,255,255,0.30)" stroke-width="1"/>
    <path d="M322,278 L348,278 L348,252" fill="none" stroke="rgba(255,255,255,0.30)" stroke-width="1"/>
    <!-- Centre cross -->
    <line x1="${W/2}" y1="22" x2="${W/2}" y2="278"
          stroke="rgba(255,255,255,0.10)" stroke-width="1"/>
    <line x1="52" y1="${H/2}" x2="348" y2="${H/2}"
          stroke="rgba(255,255,255,0.10)" stroke-width="1"/>
  `;
}

function openField() {
  return `
    <rect width="${W}" height="${H}" fill="#2D5A1B"/>
    <!-- Subtle grass stripe texture -->
    <rect x="0"   y="0" width="${W}" height="50"  fill="rgba(0,0,0,0.04)"/>
    <rect x="0"  y="100" width="${W}" height="50" fill="rgba(0,0,0,0.04)"/>
    <rect x="0"  y="200" width="${W}" height="50" fill="rgba(0,0,0,0.04)"/>
  `;
}

// ─── SVG defs (arrowhead markers) ────────────────────────────────

export function arrowDefs(customTypes = []) {
  const std = `
    <marker id="ah-run"      markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <path d="M0,0 L7,3.5 L0,7 Z" fill="#4CAF50"/>
    </marker>
    <marker id="ah-kick"     markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <path d="M0,0 L7,3.5 L0,7 Z" fill="#FFD700"/>
    </marker>
    <marker id="ah-handball" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <path d="M0,0 L7,3.5 L0,7 Z" fill="#FF9800"/>
    </marker>
  `;
  const custom = customTypes.map(ct => `
    <marker id="ah-${ct.id}" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <path d="M0,0 L7,3.5 L0,7 Z" fill="${ct.color}"/>
    </marker>
  `).join('');
  return std + custom;
}

// ─── Arrow rendering ──────────────────────────────────────────────

const PLAYER_RADIUS = 13; // must match renderPlayer

export function renderArrow(arrow, playerMap) {
  let x1, y1, x2, y2;

  if (arrow.x1 !== undefined) {
    // Free-form arrow (normalised 0-1 coords, used by drill editor)
    x1 = (arrow.x1 * W).toFixed(1);
    y1 = (arrow.y1 * H).toFixed(1);
    x2 = (arrow.x2 * W).toFixed(1);
    y2 = (arrow.y2 * H).toFixed(1);
  } else {
    // Player-reference arrow (original format)
    const from = playerMap[arrow.from];
    const to   = playerMap[arrow.to];
    if (!from || !to) return '';

    const dx  = to.svgX - from.svgX;
    const dy  = to.svgY - from.svgY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return '';

    const ux = dx / len;
    const uy = dy / len;

    x1 = (from.svgX + ux * (PLAYER_RADIUS + 1)).toFixed(1);
    y1 = (from.svgY + uy * (PLAYER_RADIUS + 1)).toFixed(1);
    x2 = (to.svgX   - ux * (PLAYER_RADIUS + 3)).toFixed(1);
    y2 = (to.svgY   - uy * (PLAYER_RADIUS + 3)).toFixed(1);
  }

    const styles = {
    run:      { stroke: '#4CAF50', dash: '',      marker: 'ah-run'      },
    kick:     { stroke: '#FFD700', dash: '9,5',   marker: 'ah-kick'     },
    handball: { stroke: '#FF9800', dash: '3,4',   marker: 'ah-handball' }
  };

  const s = styles[arrow.type];
  const stroke  = s ? s.stroke : (arrow.color || '#4CAF50');
  const dash    = s ? s.dash   : (arrow.dash  || '');
  const markerId = s ? s.marker : `ah-${arrow.type}`;
  const dashAttr = dash ? `stroke-dasharray="${dash}"` : '';

  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
    stroke="${stroke}" stroke-width="2" stroke-linecap="round"
    ${dashAttr} marker-end="url(#${markerId})"/>`;
}

// ─── Player rendering ─────────────────────────────────────────────

const ROLE_STYLES = {
  leader:   { fill: '#003087', textFill: '#FFD700', stroke: 'rgba(255,215,0,0.6)', sw: 2 },
  attacker: { fill: '#CC0000', textFill: '#FFFFFF', stroke: 'rgba(0,0,0,0.3)',     sw: 1 },
  defender: { fill: '#FFFFFF', textFill: '#003087', stroke: '#003087',             sw: 2 },
  player:   { fill: '#4A6FA5', textFill: '#FFFFFF', stroke: 'rgba(0,0,0,0.3)',     sw: 1 }
};

export function renderPlayer(p) {
  const s = ROLE_STYLES[p.role] || ROLE_STYLES.player;
  const cx = p.svgX.toFixed(1);
  const cy = p.svgY.toFixed(1);
  const ty = (p.svgY + 4.5).toFixed(1);

  return `
    <circle cx="${cx}" cy="${cy}" r="${PLAYER_RADIUS}"
      fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.sw}"/>
    <text x="${cx}" y="${ty}" text-anchor="middle"
      font-family="system-ui,sans-serif" font-size="10" font-weight="700"
      fill="${s.textFill}">${p.label}</text>
  `;
}

// ─── Full SVG builder ─────────────────────────────────────────────

export function buildDiagramSVG(diagram) {
  // Build player map with scaled SVG coordinates
  const playerMap = {};
  diagram.players.forEach(p => {
    playerMap[p.id] = { ...p, svgX: p.x * W, svgY: p.y * H };
  });

  const bg      = fieldBackground(diagram.fieldType);
  const arrows  = diagram.arrows.map(a => renderArrow(a, playerMap)).join('\n');
  const players = Object.values(playerMap).map(p => renderPlayer(p)).join('\n');

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>${arrowDefs(diagram.customTypes || [])}</defs>
  ${bg}
  ${arrows}
  ${players}
</svg>`;
}
