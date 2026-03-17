const STORAGE_KEY = 'afl_training_plans';

export function loadPlans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePlans(plans) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch (e) {
    console.warn('Could not save plans to localStorage:', e);
  }
}

export function createPlan(name, playerCount) {
  return {
    id: `plan_${Date.now()}`,
    name: name || 'New Training Plan',
    playerCount: playerCount || 18,
    drills: []
  };
}

export function addDrillToPlan(plans, planId, drillId) {
  return plans.map(plan => {
    if (plan.id !== planId) return plan;
    if (plan.drills.some(d => d.drillId === drillId)) return plan;
    return {
      ...plan,
      drills: [...plan.drills, { drillId, order: plan.drills.length }]
    };
  });
}

export function removeDrillFromPlan(plans, planId, drillId) {
  return plans.map(plan => {
    if (plan.id !== planId) return plan;
    const filtered = plan.drills.filter(d => d.drillId !== drillId);
    return { ...plan, drills: filtered.map((d, i) => ({ ...d, order: i })) };
  });
}

export function moveDrillInPlan(plans, planId, drillId, direction) {
  return plans.map(plan => {
    if (plan.id !== planId) return plan;
    const drills = [...plan.drills];
    const idx = drills.findIndex(d => d.drillId === drillId);
    if (idx === -1) return plan;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= drills.length) return plan;
    [drills[idx], drills[newIdx]] = [drills[newIdx], drills[idx]];
    return { ...plan, drills: drills.map((d, i) => ({ ...d, order: i })) };
  });
}

export function renamePlan(plans, planId, newName) {
  return plans.map(plan =>
    plan.id === planId ? { ...plan, name: newName } : plan
  );
}

export function deletePlan(plans, planId) {
  return plans.filter(plan => plan.id !== planId);
}

export function getTotalDuration(plan, allDrills) {
  return plan.drills.reduce((sum, pd) => {
    const drill = allDrills.find(d => d.id === pd.drillId);
    return sum + (drill ? drill.durationMinutes : 0);
  }, 0);
}
