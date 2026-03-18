import { setState } from './store.js';
import { registerRoutes, navigate } from './router.js';
import { loadPlans } from './utils/planStorage.js';
import { loadCustomDrills, mergeWithBase } from './utils/drillStorage.js';
import { mountNavBar } from './components/navBar.js';
import { mountPlanPanel } from './components/planPanel.js';
import * as landing      from './screens/landing.js';
import * as categories   from './screens/categories.js';
import * as drillBrowser from './screens/drillBrowser.js';
import * as drillEditor  from './screens/drillEditor.js';

async function init() {
  // Load data
  let drills = [], cats = [];
  try {
    const [drillsRes, catsRes] = await Promise.all([
      fetch('./data/drills.json'),
      fetch('./data/categories.json')
    ]);
    drills = await drillsRes.json();
    cats   = await catsRes.json();
  } catch (err) {
    document.body.innerHTML = `
      <div style="
        display:flex; flex-direction:column; align-items:center;
        justify-content:center; height:100vh;
        font-family:system-ui,sans-serif; color:#FFD700;
        background:#001A4D; text-align:center; padding:2rem;">
        <h2 style="margin-bottom:1rem">⚠️ Cannot load data</h2>
        <p style="color:rgba(255,255,255,0.7); max-width:400px;">
          This app must be served over HTTP (not opened as a file://).<br><br>
          Use <strong>VS Code Live Server</strong>, run
          <code style="background:rgba(255,255,255,0.1);padding:0.2em 0.5em;border-radius:4px">
            python -m http.server
          </code> in this folder, or any other local web server.
        </p>
      </div>
    `;
    console.error('Data load failed:', err);
    return;
  }

  // Load persisted plans & custom drills
  const plans       = loadPlans();
  const activePlanId = plans.length > 0 ? plans[plans.length - 1].id : null;
  const customDrills = loadCustomDrills();
  const mergedDrills = mergeWithBase(drills, customDrills);

  // Seed store
  setState({ drills: mergedDrills, baseDrills: drills, categories: cats, plans, activePlanId });

  // Wire up router (wrap each screen's mount to inject navigate)
  const wrapScreen = (screen) => ({
    mount: (root, params) => screen.mount(root, params, navigate)
  });

  registerRoutes({
    landing:     wrapScreen(landing),
    categories:  wrapScreen(categories),
    drills:      wrapScreen(drillBrowser),
    drillEditor: wrapScreen(drillEditor)
  });

  // Mount persistent UI elements
  mountNavBar(document.getElementById('nav-bar'), navigate);
  mountPlanPanel(document.getElementById('plan-panel-root'));

  // Initial screen
  navigate('landing');
}

init();
