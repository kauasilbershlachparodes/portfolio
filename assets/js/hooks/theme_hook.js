/*PORTFOLIO_DO_KAUÃ_SILBERSHLACH_PARODES_SITE_OFICIAL*/
'use strict';

var detectedGlobalScope =
  typeof globalThis != 'undefined' ? globalThis :
  typeof global != 'undefined' ? global :
  typeof window != 'undefined' ? window :
  typeof this != 'undefined' ? this :
  typeof self != 'undefined' ? self :
  {};

var fallbackGlobalScope =
  typeof globalThis != 'undefined' && globalThis ||
  typeof self != 'undefined' && self ||
  typeof global != 'undefined' && global ||
  detectedGlobalScope;

var globalScope = fallbackGlobalScope || detectedGlobalScope;
var MODULE_NAME = 'phoenix.theme_hook';

function arraySlice(listLike) {
  return Array.prototype.slice.call(listLike || []);
}

function arrayForEach(listLike, iteratee, context) {
  Array.prototype.forEach.call(listLike || [], iteratee, context);
}

function arrayMap(listLike, iteratee, context) {
  return Array.prototype.map.call(listLike || [], iteratee, context);
}

function arrayFilter(listLike, iteratee, context) {
  return Array.prototype.filter.call(listLike || [], iteratee, context);
}

function arrayReduce(listLike, iteratee, initialValue) {
  if (arguments.length > 2) {
    return Array.prototype.reduce.call(listLike || [], iteratee, initialValue);
  }

  return Array.prototype.reduce.call(listLike || [], iteratee);
}

function isFiniteNumber(value) {
  return typeof Number !== 'undefined' && typeof Number.isFinite === 'function'
    ? Number.isFinite(value)
    : typeof value === 'number' && isFinite(value);
}

function parseInteger(value, fallbackValue) {
  var parsed = parseInt(value, 10);

  if (isFiniteNumber(parsed)) {
    return parsed;
  }

  return arguments.length > 1 ? fallbackValue : 0;
}

function arrayIncludes(listLike, searchValue) {
  return arrayReduce(listLike, function(found, value) {
    return found || value === searchValue;
  }, false);
}

var CONFIG = Object.freeze({
  storageKey: 'theme-preference',
  defaultTheme: 'system',
  inputSelector: 'input[type="radio"][name="theme_mode"]',
  themeMetaSelector: 'meta[name="theme-color"]',
  themeEventName: 'theme:changed',
  styleId: 'phoenix-theme-hook-style',
  transitionAttribute: 'data-theme-switching',
  hookReadyAttribute: 'data-theme-hook-ready',
  singletonKey: '__PHOENIX_THEME_HOOK_SINGLETON__',
  apiName: 'PhoenixTheme'
});


var DEFAULT_APPLY_OPTIONS = Object.freeze({
  persist: true,
  dispatch: true,
  source: 'theme-hook'
});

var DEFAULT_REFRESH_OPTIONS = Object.freeze({
  dispatch: true,
  source: 'storage-refresh'
});

function shallowMerge(base, patch) {
  var out = {};
  var key;

  for (key in base) {
    if (Object.prototype.hasOwnProperty.call(base, key)) {
      out[key] = base[key];
    }
  }

  patch = patch || {};
  for (key in patch) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      out[key] = patch[key];
    }
  }

  return out;
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function toStringValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

var ALLOWED = Object.freeze(['light', 'dark', 'system']);
var THEME_COLORS = Object.freeze({
  dark: '#0a1729',
  light: '#ffffff'
});

function ensureSingleton() {
  if (globalScope[CONFIG.singletonKey]) {
    return globalScope[CONFIG.singletonKey];
  }

  var state = {
    hookCount: 0,
    styleInjected: false,
    systemWatcher: null,
    systemChangeHandler: null,
    storageChangeHandler: null,
    transitionFrameId: 0,
    inputSyncFrameId: 0
  };

  try {
    Object.defineProperty(globalScope, CONFIG.singletonKey, {
      value: state,
      writable: false,
      configurable: true,
      enumerable: false
    });
  } catch (_error) {
    globalScope[CONFIG.singletonKey] = state;
  }

  return state;
}

var singleton = ensureSingleton();

function hasDOM() {
  return typeof document !== 'undefined' && typeof HTMLElement !== 'undefined' && document.documentElement instanceof HTMLElement;
}

function getRoot() {
  return hasDOM() ? document.documentElement : null;
}

function safeTheme(value, fallback = CONFIG.defaultTheme) {
  var clean = toStringValue(value).trim().toLowerCase();
  return arrayIncludes(ALLOWED, clean) ? clean : fallback;
}

function getSystemWatcher() {
  if (singleton.systemWatcher) {
    return singleton.systemWatcher;
  }

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }

  singleton.systemWatcher = window.matchMedia('(prefers-color-scheme: dark)');
  return singleton.systemWatcher;
}

function resolveTheme(mode) {
  var safe = safeTheme(mode);

  if (safe === 'system') {
    var watcher = getSystemWatcher();
    return watcher && watcher.matches ? 'dark' : 'light';
  }

  return safe;
}

function getStoredTheme() {
  try {
    return safeTheme(globalScope.localStorage.getItem(CONFIG.storageKey));
  } catch (_error) {
    return CONFIG.defaultTheme;
  }
}

function persistTheme(mode) {
  try {
    globalScope.localStorage.setItem(CONFIG.storageKey, safeTheme(mode));
    return true;
  } catch (_error) {
    return false;
  }
}

function injectStyles() {
  if (!hasDOM()) {
    return;
  }

  if (document.getElementById(CONFIG.styleId)) {
    singleton.styleInjected = true;
    return;
  }

  var style = document.createElement('style');
  style.id = CONFIG.styleId;
  style.textContent = `
    :root[${CONFIG.transitionAttribute}="true"] *,
    :root[${CONFIG.transitionAttribute}="true"] *::before,
    :root[${CONFIG.transitionAttribute}="true"] *::after {
      transition: none !important;
      animation-duration: 0.01ms !important;
      animation-delay: 0ms !important;
      scroll-behavior: auto !important;
    }
  `;

  document.head.appendChild(style);
  singleton.styleInjected = true;
}

function scheduleFrame(callback) {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    return window.requestAnimationFrame(callback);
  }

  return globalScope.setTimeout(callback, parseInteger(16, 16));
}

function cancelScheduledFrame(frameId) {
  if (!frameId) {
    return;
  }

  if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
    window.cancelAnimationFrame(frameId);
    return;
  }

  globalScope.clearTimeout(frameId);
}

function suspendTransitions(root) {
  if (!(root instanceof HTMLElement)) {
    return;
  }

  injectStyles();
  root.setAttribute(CONFIG.transitionAttribute, 'true');

  cancelScheduledFrame(singleton.transitionFrameId);

  singleton.transitionFrameId = scheduleFrame(() => {
    singleton.transitionFrameId = scheduleFrame(() => {
      root.removeAttribute(CONFIG.transitionAttribute);
      singleton.transitionFrameId = 0;
    });
  });
}

function getThemeMetaElement() {
  if (!hasDOM()) {
    return null;
  }

  return document.querySelector(CONFIG.themeMetaSelector);
}

function updateThemeMeta(resolvedMode) {
  var meta = getThemeMetaElement();
  if (!meta) {
    return;
  }

  meta.setAttribute('content', THEME_COLORS[resolvedMode] || THEME_COLORS.light);
}

function syncInputs(root, mode) {
  if (!root || typeof root.querySelectorAll !== 'function') {
    return;
  }

  arrayForEach(root.querySelectorAll(CONFIG.inputSelector), function(input) {
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    var checked = safeTheme(input.value) === mode;
    input.checked = checked;
    input.setAttribute('aria-checked', checked ? 'true' : 'false');
  });
}

function scheduleGlobalInputSync(mode) {
  if (!hasDOM()) {
    return;
  }

  cancelScheduledFrame(singleton.inputSyncFrameId);

  singleton.inputSyncFrameId = scheduleFrame(() => {
    syncInputs(document, mode);
    singleton.inputSyncFrameId = 0;
  });
}

function dispatchThemeChange(detail) {
  if (!hasDOM() || typeof CustomEvent === 'undefined') {
    return;
  }

  try {
    document.dispatchEvent(new CustomEvent(CONFIG.themeEventName, { detail }));
  } catch (_error) {
    // no-op
  }
}

function applyTheme(mode, options = {}) {
  var settings = shallowMerge(DEFAULT_APPLY_OPTIONS, asObject(options));
  var root = getRoot();
  var safe = safeTheme(mode);
  var resolved = resolveTheme(safe);
  var persist = settings.persist !== false;
  var dispatch = settings.dispatch !== false;
  var source = toStringValue(settings.source || DEFAULT_APPLY_OPTIONS.source) || DEFAULT_APPLY_OPTIONS.source;

  if (!(root instanceof HTMLElement)) {
    if (persist) {
      persistTheme(safe);
    }

    return {
      mode: safe,
      resolvedMode: resolved,
      persisted: persist
    };
  }

  suspendTransitions(root);

  root.classList.toggle('dark-theme', resolved === 'dark');
  root.classList.toggle('light-theme', resolved !== 'dark');
  root.style.colorScheme = resolved;
  root.dataset.themeMode = safe;
  root.dataset.themeResolved = resolved;
  root.dataset.themeBootstrapped = 'true';

  updateThemeMeta(resolved);
  scheduleGlobalInputSync(safe);

  var persisted = persist ? persistTheme(safe) : false;

  if (dispatch) {
    dispatchThemeChange({
      mode: safe,
      resolvedMode: resolved,
      persisted,
      source
    });
  }

  return {
    mode: safe,
    resolvedMode: resolved,
    persisted
  };
}

function refreshThemeFromStorage(options = {}) {
  var settings = shallowMerge(DEFAULT_REFRESH_OPTIONS, asObject(options));

  return applyTheme(getStoredTheme(), {
    persist: false,
    dispatch: settings.dispatch !== false,
    source: settings.source || DEFAULT_REFRESH_OPTIONS.source
  });
}

function addMediaListener(mediaQueryList, listener) {
  if (!mediaQueryList || typeof listener !== 'function') {
    return;
  }

  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', listener);
    return;
  }

  if (typeof mediaQueryList.addListener === 'function') {
    mediaQueryList.addListener(listener);
  }
}

function removeMediaListener(mediaQueryList, listener) {
  if (!mediaQueryList || typeof listener !== 'function') {
    return;
  }

  if (typeof mediaQueryList.removeEventListener === 'function') {
    mediaQueryList.removeEventListener('change', listener);
    return;
  }

  if (typeof mediaQueryList.removeListener === 'function') {
    mediaQueryList.removeListener(listener);
  }
}

function bindGlobalObservers() {
  if (!hasDOM()) {
    return;
  }

  if (!singleton.systemChangeHandler) {
    singleton.systemChangeHandler = () => {
      if (getStoredTheme() === 'system') {
        applyTheme('system', {
          persist: false,
          dispatch: true,
          source: 'system-change'
        });
      }
    };
  }

  if (!singleton.storageChangeHandler) {
    singleton.storageChangeHandler = (event) => {
      if (event && event.key && event.key !== CONFIG.storageKey) {
        return;
      }

      refreshThemeFromStorage({
        dispatch: true,
        source: 'storage-change'
      });
    };
  }

  var watcher = getSystemWatcher();
  addMediaListener(watcher, singleton.systemChangeHandler);
  window.addEventListener('storage', singleton.storageChangeHandler);
}

function unbindGlobalObservers() {
  if (singleton.hookCount > 0) {
    return;
  }

  var watcher = getSystemWatcher();
  removeMediaListener(watcher, singleton.systemChangeHandler);

  if (typeof window !== 'undefined' && singleton.storageChangeHandler) {
    window.removeEventListener('storage', singleton.storageChangeHandler);
  }
}

function registerHook() {
  singleton.hookCount += 1;

  if (singleton.hookCount === 1) {
    bindGlobalObservers();
  }
}

function unregisterHook() {
  singleton.hookCount = Math.max(0, singleton.hookCount - 1);

  if (singleton.hookCount === 0) {
    unbindGlobalObservers();
  }
}

function isThemeInput(target) {
  return target instanceof HTMLInputElement && target.matches(CONFIG.inputSelector);
}

function defineThemeApi() {
  if (globalScope[CONFIG.apiName]) {
    return globalScope[CONFIG.apiName];
  }

  var api = Object.freeze({
    applyTheme(mode, options = {}) {
      return applyTheme(mode, options);
    },
    getStoredTheme() {
      return getStoredTheme();
    },
    resolveTheme(mode) {
      return resolveTheme(mode);
    },
    refresh() {
      return refreshThemeFromStorage({
        dispatch: true,
        source: 'api-refresh'
      });
    }
  });

  try {
    Object.defineProperty(globalScope, CONFIG.apiName, {
      value: api,
      writable: false,
      configurable: false,
      enumerable: false
    });
  } catch (_error) {
    globalScope[CONFIG.apiName] = api;
  }

  return api;
}

var ThemeHook = {
  mounted() {
    if (!(this.el instanceof HTMLElement)) {
      return;
    }

    injectStyles();
    registerHook();

    this.el.dataset.themeHookReady = 'true';
    this.currentThemeMode = getStoredTheme();

    syncInputs(this.el, this.currentThemeMode);
    applyTheme(this.currentThemeMode, {
      persist: false,
      dispatch: false,
      source: 'hook-mounted'
    });

    this.onChange = (event) => {
      var target = event.target;
      if (!isThemeInput(target)) {
        return;
      }

      this.currentThemeMode = safeTheme(target.value);
      applyTheme(this.currentThemeMode, {
        persist: true,
        dispatch: true,
        source: 'hook-change'
      });
    };

    this.el.addEventListener('change', this.onChange);
  },

  destroyed() {
    if (this.el instanceof HTMLElement && this.onChange) {
      this.el.removeEventListener('change', this.onChange);
      this.el.removeAttribute(CONFIG.hookReadyAttribute);
    }

    unregisterHook();
  }
};

if (hasDOM()) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectStyles();
      refreshThemeFromStorage({
        dispatch: false,
        source: 'dom-ready-bootstrap'
      });
    }, { once: true });
  } else {
    injectStyles();
    refreshThemeFromStorage({
      dispatch: false,
      source: 'module-bootstrap'
    });
  }
}

defineThemeApi();

export default ThemeHook;
export { applyTheme, getStoredTheme, refreshThemeFromStorage, resolveTheme, safeTheme };
