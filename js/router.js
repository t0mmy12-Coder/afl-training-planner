// Screen router — mount/unmount pattern, no circular deps with screens

let _routes = {};
let _currentUnmount = null;

export function registerRoutes(routeMap) {
  _routes = routeMap;
}

export function navigate(screenName, params = {}) {
  if (_currentUnmount) {
    _currentUnmount();
    _currentUnmount = null;
  }

  const root = document.getElementById('screen-root');
  root.innerHTML = '';

  const screen = _routes[screenName];
  if (!screen) {
    console.error(`No route registered for "${screenName}"`);
    return;
  }

  const unmount = screen.mount(root, params);
  _currentUnmount = typeof unmount === 'function' ? unmount : null;
}
