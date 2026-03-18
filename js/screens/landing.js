import { getState, setState } from '../store.js';

const PLAYER_COUNT_OPTIONS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export function mount(root, _params, navigate) {
  const el = document.createElement('div');
  el.className = 'screen landing';

  el.innerHTML = `
    <div class="landing-bg" aria-hidden="true">
      ${ovalSVG()}
    </div>

    <div class="landing-content">
      <h1 class="landing-title">AFL Training<br>Planner</h1>
      <p class="landing-subtitle">Build your perfect session — pick drills, track duration, save your plan.</p>

      <div class="player-count-label">How many players today?</div>

      <div class="player-count-pills" role="group" aria-label="Select player count">
        ${PLAYER_COUNT_OPTIONS.map(n => `
          <button class="pill" data-value="${n}" aria-pressed="false">${n}</button>
        `).join('')}
      </div>

      <button class="btn-continue" disabled>Choose Category →</button>
    </div>
  `;

  root.appendChild(el);

  const continueBtn = el.querySelector('.btn-continue');
  let selectedCount = getState().playerCount;

  function updatePills() {
    el.querySelectorAll('.pill').forEach(pill => {
      const val = pill.dataset.value;
      const active = String(selectedCount) === String(val);
      pill.classList.toggle('selected', active);
      pill.setAttribute('aria-pressed', String(active));
    });
    continueBtn.disabled = selectedCount === null;
  }

  // Restore previous selection if any
  updatePills();

  el.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const raw = pill.dataset.value;
      // '24+' maps to a numeric value of 24 for filtering
      selectedCount = raw === '24+' ? 24 : Number(raw);
      setState({ playerCount: selectedCount });
      updatePills();
    });
  });

  continueBtn.addEventListener('click', () => {
    if (selectedCount === null) return;
    setState({ activeScreen: 'categories' });
    navigate('categories');
  });

  // Store navigate ref for external use (nav bar home click)
  el._navigate = navigate;
}

function ovalSVG() {
  return `
    <svg viewBox="0 0 500 380" width="500" height="380"
         xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <!-- Outer oval -->
      <ellipse cx="250" cy="190" rx="240" ry="175"
        fill="#2D5A1B" stroke="white" stroke-width="3"/>
      <!-- Inner oval -->
      <ellipse cx="250" cy="190" rx="190" ry="135"
        fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
      <!-- Centre circle -->
      <circle cx="250" cy="190" r="50"
        fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
      <!-- Centre square -->
      <rect x="225" y="165" width="50" height="50"
        fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.2"/>
      <!-- Centre dot -->
      <circle cx="250" cy="190" r="4" fill="rgba(255,255,255,0.5)"/>
      <!-- Half-way line -->
      <line x1="10" y1="190" x2="490" y2="190"
        stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
      <!-- Goal squares (top) -->
      <rect x="215" y="16" width="70" height="28"
        fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2"/>
      <!-- Goal squares (bottom) -->
      <rect x="215" y="336" width="70" height="28"
        fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2"/>
    </svg>
  `;
}
