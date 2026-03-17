import { getState, setState, subscribe } from '../store.js';
import {
  savePlans, createPlan,
  addDrillToPlan, removeDrillFromPlan,
  moveDrillInPlan, renamePlan, deletePlan,
  getTotalDuration
} from '../utils/planStorage.js';

let _overlayEl = null;
let _panelEl   = null;
let _unsubscribe = null;

export function mountPlanPanel(root) {
  // Overlay (backdrop)
  _overlayEl = document.createElement('div');
  _overlayEl.className = 'plan-overlay';
  _overlayEl.addEventListener('click', () => setState({ panelOpen: false }));

  // Panel itself
  _panelEl = document.createElement('div');
  _panelEl.className = 'plan-panel';

  root.appendChild(_overlayEl);
  root.appendChild(_panelEl);

  _unsubscribe = subscribe(renderPanel);
  renderPanel(getState());
}

function renderPanel(state) {
  const { panelOpen, plans, activePlanId, drills } = state;

  // Toggle open/close classes
  _overlayEl.classList.toggle('open', panelOpen);
  _panelEl.classList.toggle('open', panelOpen);

  const activePlan = plans.find(p => p.id === activePlanId) || null;
  const totalMin   = activePlan ? getTotalDuration(activePlan, drills) : 0;

  _panelEl.innerHTML = `
    <div class="plan-panel-header">
      <span class="plan-panel-title">📋 Training Plan</span>
      <button class="btn-close-panel" aria-label="Close panel">×</button>
    </div>

    <!-- Plan selector -->
    <div class="plan-selector-row">
      <select class="plan-select" aria-label="Select plan">
        ${plans.length === 0
          ? `<option value="">No plans yet</option>`
          : plans.map(p =>
              `<option value="${p.id}" ${p.id === activePlanId ? 'selected' : ''}>${esc(p.name)}</option>`
            ).join('')}
      </select>
      <button class="btn-new-plan">+ New</button>
    </div>

    ${activePlan ? `
      <!-- Plan name editor -->
      <div class="plan-name-row">
        <input class="plan-name-input" type="text"
          value="${esc(activePlan.name)}"
          placeholder="Plan name…"
          aria-label="Rename plan"/>
        <button class="btn-save-name">Rename</button>
      </div>

      <!-- Drill list -->
      <div class="plan-drills-list">
        ${activePlan.drills.length === 0
          ? `<div class="plan-empty">
               No drills added yet.<br>
               Browse drills and tap <strong>+</strong> to add them here.
             </div>`
          : activePlan.drills.map((pd, i) => {
              const drill = drills.find(d => d.id === pd.drillId);
              if (!drill) return '';
              const isFirst = i === 0;
              const isLast  = i === activePlan.drills.length - 1;
              return `
                <div class="plan-drill-item" data-drill-id="${drill.id}">
                  <span class="plan-drill-order">${i + 1}</span>
                  <div class="plan-drill-info">
                    <div class="plan-drill-name" title="${esc(drill.name)}">${esc(drill.name)}</div>
                    <div class="plan-drill-duration">⏱ ${drill.durationMinutes} min</div>
                  </div>
                  <div class="plan-move-btns">
                    <button class="btn-move btn-up"   data-id="${drill.id}" ${isFirst ? 'disabled' : ''} title="Move up">▲</button>
                    <button class="btn-move btn-down" data-id="${drill.id}" ${isLast  ? 'disabled' : ''} title="Move down">▼</button>
                  </div>
                  <button class="btn-remove-drill" data-id="${drill.id}" title="Remove">✕</button>
                </div>
              `;
            }).join('')}
      </div>

      <!-- Footer -->
      <div class="plan-footer">
        <div class="plan-total">
          Total: <strong>${totalMin} min</strong>
          ${activePlan.drills.length > 0 ? `<br><small>${activePlan.drills.length} drill${activePlan.drills.length !== 1 ? 's' : ''}</small>` : ''}
        </div>
        <button class="btn-delete-plan">Delete Plan</button>
      </div>
    ` : `
      <div class="plan-drills-list">
        <div class="plan-empty">
          Create a new plan using the <strong>+ New</strong> button above.
        </div>
      </div>
      <div class="plan-footer">
        <div class="plan-total">No active plan</div>
      </div>
    `}
  `;

  // ── Event wiring ──────────────────────────────────────────

  _panelEl.querySelector('.btn-close-panel').addEventListener('click', () => {
    setState({ panelOpen: false });
  });

  _panelEl.querySelector('.plan-select').addEventListener('change', e => {
    setState({ activePlanId: e.target.value || null });
  });

  _panelEl.querySelector('.btn-new-plan').addEventListener('click', () => {
    const name  = `Plan ${plans.length + 1}`;
    const plan  = createPlan(name, getState().playerCount || 18);
    const updated = [...plans, plan];
    savePlans(updated);
    setState({ plans: updated, activePlanId: plan.id });
  });

  if (activePlan) {
    // Rename
    _panelEl.querySelector('.btn-save-name').addEventListener('click', () => {
      const input = _panelEl.querySelector('.plan-name-input');
      const newName = input.value.trim() || activePlan.name;
      const updated = renamePlan(plans, activePlanId, newName);
      savePlans(updated);
      setState({ plans: updated });
    });

    // Move up / move down
    _panelEl.querySelectorAll('.btn-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = moveDrillInPlan(plans, activePlanId, btn.dataset.id, 'up');
        savePlans(updated);
        setState({ plans: updated });
      });
    });

    _panelEl.querySelectorAll('.btn-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = moveDrillInPlan(plans, activePlanId, btn.dataset.id, 'down');
        savePlans(updated);
        setState({ plans: updated });
      });
    });

    // Remove drill
    _panelEl.querySelectorAll('.btn-remove-drill').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = removeDrillFromPlan(plans, activePlanId, btn.dataset.id);
        savePlans(updated);
        setState({ plans: updated });
      });
    });

    // Delete plan
    _panelEl.querySelector('.btn-delete-plan').addEventListener('click', () => {
      if (!confirm(`Delete "${activePlan.name}"?`)) return;
      const updated   = deletePlan(plans, activePlanId);
      const nextId    = updated.length > 0 ? updated[updated.length - 1].id : null;
      savePlans(updated);
      setState({ plans: updated, activePlanId: nextId });
    });
  }
}

// Exposed helper — called by drill browser / drill card "+ add" buttons
export function addDrillToActivePlan(drillId) {
  const { plans, activePlanId, playerCount } = getState();

  // Auto-create a plan if none exists
  if (!activePlanId || plans.length === 0) {
    const plan    = createPlan('My Training Plan', playerCount || 18);
    const updated = [...plans, plan];
    savePlans(updated);
    const final   = addDrillToPlan(updated, plan.id, drillId);
    savePlans(final);
    setState({ plans: final, activePlanId: plan.id, panelOpen: true });
    return;
  }

  const updated = addDrillToPlan(plans, activePlanId, drillId);
  savePlans(updated);
  setState({ plans: updated });
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
