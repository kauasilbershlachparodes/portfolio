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
var MODULE_NAME = 'phoenix.sidebar_active_hook';

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
  navSelector: 'a[data-nav-route-bound="true"]',
  styleId: 'forensic-sidebar-dynamic-styles',
  singletonKey: '__PHOENIX_SIDEBAR_ACTIVE_SINGLETON__'
});

var ACTIVE_ICON_PALETTE = Object.freeze([
  'var(--ds-teal-600)',
  'var(--ds-blue-600)',
  'var(--ds-purple-600)',
  'var(--ds-pink-600)',
  'var(--ds-amber-600)',
  'var(--ds-green-600)',
  'var(--ds-red-600)'
]);

var NAV_TOKENS = Object.freeze({
  active: ['text-gray-1000!', '[:hover,:focus-visible]:text-gray-1000!'],
  inactive: ['font-normal', 'text-inherit'],
  childOverlay:
    'pointer-events-none absolute inset-y-0 left-0 right-2 bg-gray-alpha-100 dark:bg-gray-alpha-200 rounded-md -mr-4 -ml-5',
  parentOverlay:
    'pointer-events-none absolute inset-y-0 left-0 right-2 bg-gray-alpha-100 dark:bg-gray-alpha-200 rounded-md -mr-4 -ml-2',
  childBar: 'absolute w-px bg-gray-900 top-[15%] bottom-[15%] left-2'
});


var DEFAULT_EXPAND_OPTIONS = Object.freeze({
  isInitial: false
});

var DEFAULT_ACTIVE_OPTIONS = Object.freeze({
  isInitial: false
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

function ensureSingleton() {
  if (globalScope[CONFIG.singletonKey]) {
    return globalScope[CONFIG.singletonKey];
  }

  var state = {
    styleInjected: false
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

function scheduleFrame(callback) {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    return window.requestAnimationFrame(callback);
  }

  return globalScope.setTimeout(callback, parseInteger(16, 16));
}

function cancelFrame(frameId) {
  if (!frameId) return;

  if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
    window.cancelAnimationFrame(frameId);
    return;
  }

  globalScope.clearTimeout(frameId);
}

function hashString(value) {
  var input = toStringValue(value);
  var hash = 0;

  for (var index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function normalizeRoute(raw) {
  var value = toStringValue(raw).trim();
  if (!value) return '';

  var normalized = value.toLowerCase();

  if (normalized.startsWith('#')) {
    normalized = normalized.substring(1);
  }

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  return normalized;
}

function getRouteLinks(root) {
  return root instanceof HTMLElement
    ? arraySlice(root.querySelectorAll(CONFIG.navSelector))
    : [];
}

function getLinkRow(link) {
  return link instanceof HTMLElement
    ? link.closest('div.flex.w-full.items-center.relative')
    : null;
}

function isParentCategoryLink(link) {
  var row = getLinkRow(link);
  return !!(row && row.querySelector('button[aria-controls]'));
}

function getOverlayForRow(row) {
  return row instanceof HTMLElement
    ? row.querySelector(':scope > .absolute.inset-y-0')
    : null;
}

function getActiveIconColor(link) {
  if (!(link instanceof HTMLElement) || isParentCategoryLink(link)) {
    return '';
  }

  var explicit =
    (link.getAttribute('data-active-icon-color') || '').trim() ||
    (link.closest('li')?.getAttribute('data-active-icon-color') || '').trim();

  if (explicit) {
    return explicit;
  }

  var seed = normalizeRoute(link.getAttribute('href')) || link.textContent || '';
  return ACTIVE_ICON_PALETTE[hashString(seed) % ACTIVE_ICON_PALETTE.length];
}

function createActiveOverlay(isParent) {
  var overlay = document.createElement('div');
  overlay.className = isParent ? NAV_TOKENS.parentOverlay : NAV_TOKENS.childOverlay;

  if (!isParent) {
    var bar = document.createElement('span');
    bar.className = NAV_TOKENS.childBar;
    overlay.appendChild(bar);
  }

  return overlay;
}

function rememberBaseClasses(link) {
  if (!(link instanceof HTMLElement) || link.dataset.navBaseClass) {
    return;
  }

  var cleaned = arrayFilter(link.classList, function(token) {
    return !arrayIncludes(NAV_TOKENS.active, token) && !arrayIncludes(NAV_TOKENS.inactive, token);
  });

  link.dataset.navBaseClass = cleaned.join(' ');
}

function setLinkClassState(link, active) {
  if (!(link instanceof HTMLElement)) {
    return;
  }

  rememberBaseClasses(link);

  link.className = [
    link.dataset.navBaseClass || '',
    ...(active ? NAV_TOKENS.active : NAV_TOKENS.inactive)
  ]
    .filter(Boolean)
    .join(' ');
}

function clearVisualActiveState(root) {
  arrayForEach(getRouteLinks(root), function(link) {
    link.setAttribute('aria-current', 'false');
    setLinkClassState(link, false);

    var listItem = link.closest('li');
    if (listItem instanceof HTMLElement) {
      listItem.dataset.navActive = 'false';
      listItem.style.removeProperty('--forensic-active-icon-color');
    }

    var overlay = getOverlayForRow(getLinkRow(link));
    if (overlay) {
      overlay.remove();
    }
  });
}

function applyVisualActiveState(link) {
  if (!(link instanceof HTMLElement)) {
    return;
  }

  var isParent = isParentCategoryLink(link);
  var row = getLinkRow(link);

  link.setAttribute('aria-current', 'page');
  setLinkClassState(link, true);

  var listItem = link.closest('li');
  if (listItem instanceof HTMLElement) {
    listItem.dataset.navActive = 'true';

    var color = getActiveIconColor(link);
    if (color) {
      listItem.style.setProperty('--forensic-active-icon-color', color);
    } else {
      listItem.style.removeProperty('--forensic-active-icon-color');
    }
  }

  if (row && !getOverlayForRow(row)) {
    row.insertBefore(createActiveOverlay(isParent), row.firstChild);
  }
}

function updateNavEdgeFade(nav) {
  if (!(nav instanceof HTMLElement)) return;

  var maxScroll = Math.max(0, nav.scrollHeight - nav.clientHeight);
  var scrollTop = Math.max(0, nav.scrollTop);

  nav.dataset.fadeReady = 'true';
  nav.dataset.fadeTop = scrollTop > 2 ? 'true' : 'false';
  nav.dataset.fadeBottom = maxScroll - scrollTop > 2 ? 'true' : 'false';
}

function expandParentsForLink(link, options = {}) {
  var settings = shallowMerge(DEFAULT_EXPAND_OPTIONS, asObject(options));

  if (!(link instanceof HTMLElement)) {
    return;
  }

  var isInitial = settings.isInitial === true;
  var currentList = link.closest('ul');

  while (currentList instanceof HTMLElement) {
    var panel = currentList.closest('div.grid');
    if (!(panel instanceof HTMLElement)) {
      break;
    }

    var row = panel.previousElementSibling;
    var button = row instanceof HTMLElement
      ? row.querySelector('button[aria-controls]')
      : null;

    if (button instanceof HTMLElement) {
      button.setAttribute('aria-expanded', 'true');
      panel.removeAttribute('inert');

      var svg = button.querySelector('svg');
      if (svg instanceof SVGElement || svg instanceof HTMLElement) {
        if (isInitial) {
          svg.style.setProperty('transition', 'none', 'important');
        }

        svg.classList.remove('rotate-0');
        svg.classList.add('rotate-90');
        svg.classList.remove('-rotate-90');

        if (isInitial) {
          scheduleFrame(() => {
            scheduleFrame(() => {
              svg.style.removeProperty('transition');
            });
          });
        }
      }
    }

    var parentListItem = panel.closest('li');
    currentList = parentListItem ? parentListItem.closest('ul') : null;
  }
}

function findActiveLink(root) {
  var currentPath = globalScope.location.pathname;
  if (globalScope.location.hash) {
    currentPath += globalScope.location.hash;
  }

  var normalizedRoute = normalizeRoute(currentPath);
  if (!normalizedRoute) {
    return null;
  }

  return getRouteLinks(root).find((link) => {
    return normalizeRoute(link.getAttribute('href')) === normalizedRoute;
  }) || null;
}

function applyActiveState(root, options = {}) {
  var settings = shallowMerge(DEFAULT_ACTIVE_OPTIONS, asObject(options));

  if (!(root instanceof HTMLElement)) {
    return;
  }

  arrayForEach(getRouteLinks(root), rememberBaseClasses);
  clearVisualActiveState(root);

  var activeLink = findActiveLink(root);
  if (activeLink) {
    applyVisualActiveState(activeLink);
    expandParentsForLink(activeLink, settings);
  }

  scheduleFrame(() => updateNavEdgeFade(root));
}

function injectDynamicStyles() {
  if (singleton.styleInjected || document.getElementById(CONFIG.styleId)) {
    singleton.styleInjected = true;
    return;
  }

  var style = document.createElement('style');
  style.id = CONFIG.styleId;
  style.textContent = `
    nav#forensicNavAiSidebarNav li[data-nav-active="true"] > div > div > a svg,
    nav#forensicNavAiSidebarNav li[data-nav-active="true"] > div > div > a svg * {
      color: var(--forensic-active-icon-color, currentColor) !important;
    }

    nav#forensicNavAiSidebarNav div.flex:not(:has(button[aria-controls])) a[aria-current="false"],
    nav#forensicNavAiSidebarNav li[data-nav-active="false"] > div.flex:not(:has(button[aria-controls])) > div > a,
    nav#forensicNavAiSidebarNav li[data-nav-active="false"] > div.flex:not(:has(button[aria-controls])) > div > span {
      color: var(--ds-gray-900, currentColor) !important;
    }

    nav#forensicNavAiSidebarNav div.flex:has(button[aria-controls]) > div > a,
    nav#forensicNavAiSidebarNav div.flex:has(button[aria-controls]) > div > a *,
    nav#forensicNavAiSidebarNav button[aria-controls],
    nav#forensicNavAiSidebarNav button[aria-controls] * {
      color: var(--ds-gray-1000, currentColor) !important;
    }

    nav#forensicNavAiSidebarNav div.flex:not(:has(button[aria-controls])) a[aria-current="false"]:hover,
    nav#forensicNavAiSidebarNav div.flex:not(:has(button[aria-controls])) a[aria-current="false"]:focus-visible,
    nav#forensicNavAiSidebarNav li[data-nav-active="false"]:hover > div.flex:not(:has(button[aria-controls])) > div > a,
    nav#forensicNavAiSidebarNav li[data-nav-active="false"]:focus-within > div.flex:not(:has(button[aria-controls])) > div > a,
    nav#forensicNavAiSidebarNav li[data-nav-active="false"]:hover > div.flex:not(:has(button[aria-controls])) > div > span,
    nav#forensicNavAiSidebarNav li[data-nav-active="false"]:focus-within > div.flex:not(:has(button[aria-controls])) > div > span {
      color: var(--ds-gray-1000, currentColor) !important;
    }
  `;

  document.head.appendChild(style);
  singleton.styleInjected = true;
}

function createResizeObserver(callback) {
  if (typeof ResizeObserver !== 'function' || typeof callback !== 'function') {
    return null;
  }

  return new ResizeObserver(callback);
}

var SidebarActiveHook = {
  mounted() {
    if (!(this.el instanceof HTMLElement)) {
      return;
    }

    var nav = this.el;
    injectDynamicStyles();
    applyActiveState(nav, { isInitial: true });

    this.scheduleEdgeFade = () => {
      cancelFrame(this.edgeFadeFrameId);
      this.edgeFadeFrameId = scheduleFrame(() => {
        updateNavEdgeFade(nav);
        this.edgeFadeFrameId = 0;
      });
    };

    this.syncActiveState = () => {
      cancelFrame(this.syncFrameId);
      this.syncFrameId = scheduleFrame(() => {
        applyActiveState(nav);
        this.syncFrameId = 0;
      });
    };

    this.onHashChange = this.syncActiveState;
    this.onPageLoadingStop = this.syncActiveState;
    this.onScroll = this.scheduleEdgeFade;
    this.onClick = (event) => {
      var link = event.target instanceof Element
        ? event.target.closest(CONFIG.navSelector)
        : null;

      if (!(link instanceof HTMLElement)) {
        return;
      }

      if (link.getAttribute('aria-current') === 'page') {
        event.preventDefault();
        return;
      }

      this.syncActiveState();
    };

    globalScope.addEventListener('hashchange', this.onHashChange);
    globalScope.addEventListener('phx:page-loading-stop', this.onPageLoadingStop);
    nav.addEventListener('scroll', this.onScroll, { passive: true });
    nav.addEventListener('click', this.onClick);

    this.resizeObserver = createResizeObserver(this.scheduleEdgeFade);

    if (this.resizeObserver && typeof this.resizeObserver.observe === 'function') {
      this.resizeObserver.observe(nav);
      arrayForEach(nav.children, function(child) {
        if (child instanceof HTMLElement) {
          this.resizeObserver.observe(child);
        }
      }, this);
    }

    this.scheduleEdgeFade();
  },

  updated() {
    if (!(this.el instanceof HTMLElement)) {
      return;
    }

    applyActiveState(this.el);
    this.scheduleEdgeFade?.();
  },

  destroyed() {
    if (this.onHashChange) {
      globalScope.removeEventListener('hashchange', this.onHashChange);
    }

    if (this.onPageLoadingStop) {
      globalScope.removeEventListener('phx:page-loading-stop', this.onPageLoadingStop);
    }

    if (this.el instanceof HTMLElement && this.onScroll) {
      this.el.removeEventListener('scroll', this.onScroll);
    }

    if (this.el instanceof HTMLElement && this.onClick) {
      this.el.removeEventListener('click', this.onClick);
    }

    this.resizeObserver?.disconnect();
    cancelFrame(this.edgeFadeFrameId);
    cancelFrame(this.syncFrameId);
  }
};

export default SidebarActiveHook;
