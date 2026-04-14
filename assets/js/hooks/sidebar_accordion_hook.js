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
var MODULE_NAME = 'phoenix.sidebar_accordion_hook';

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
  storagePrefix: 'sidebar-accordion:',
  singletonKey: '__PHOENIX_SIDEBAR_ACCORDION_SINGLETON__'
});


var DEFAULT_SYNC_CHEVRON_OPTIONS = Object.freeze({
  isInitial: false
});

var DEFAULT_APPLY_STATE_OPTIONS = Object.freeze({
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
    transitionFrameIds: new WeakMap()
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

function readStored(menuId) {
  try {
    var value = globalScope.sessionStorage.getItem(`${CONFIG.storagePrefix}${menuId}`);
    if (value === 'true') return true;
    if (value === 'false') return false;
  } catch (_error) {
    // no-op
  }

  return null;
}

function writeStored(menuId, expanded) {
  try {
    globalScope.sessionStorage.setItem(`${CONFIG.storagePrefix}${menuId}`, String(expanded));
  } catch (_error) {
    // no-op
  }
}

function getSvg(button) {
  return button instanceof HTMLElement ? button.querySelector('svg') : null;
}

function getPanelFromButton(button) {
  var menuId = button instanceof HTMLElement ? toStringValue(button.getAttribute('aria-controls')) : '';
  if (!menuId) return null;

  var list = document.getElementById(menuId);
  return list instanceof HTMLElement ? list.parentElement : null;
}

function togglePanelInteractivity(panel, expanded) {
  if (!(panel instanceof HTMLElement)) return;

  if (expanded) {
    panel.removeAttribute('inert');
    panel.removeAttribute('aria-hidden');
    return;
  }

  panel.setAttribute('inert', '');
  panel.setAttribute('aria-hidden', 'true');
}

function syncChevron(svg, expanded, options = {}) {
  var settings = shallowMerge(DEFAULT_SYNC_CHEVRON_OPTIONS, asObject(options));

  if (!(svg instanceof SVGElement || svg instanceof HTMLElement)) {
    return;
  }

  var isInitial = settings.isInitial === true;
  var existingFrameId = singleton.transitionFrameIds.get(svg);
  cancelFrame(existingFrameId);

  if (isInitial) {
    svg.style.setProperty('transition', 'none', 'important');
  }

  svg.classList.toggle('rotate-90', expanded);
  svg.classList.toggle('rotate-0', !expanded);
  svg.classList.remove('-rotate-90');

  if (!isInitial) {
    return;
  }

  var frameId = scheduleFrame(() => {
    var nestedFrameId = scheduleFrame(() => {
      svg.style.removeProperty('transition');
      singleton.transitionFrameIds.delete(svg);
    });

    singleton.transitionFrameIds.set(svg, nestedFrameId);
  });

  singleton.transitionFrameIds.set(svg, frameId);
}

function applyState(button, panel, expanded, options = {}) {
  var settings = shallowMerge(DEFAULT_APPLY_STATE_OPTIONS, asObject(options));

  if (!(button instanceof HTMLElement) || !(panel instanceof HTMLElement)) {
    return;
  }

  togglePanelInteractivity(panel, expanded);
  button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  button.dataset.state = expanded ? 'open' : 'closed';

  syncChevron(getSvg(button), expanded, settings);
}

function isAccordionButton(target) {
  return target instanceof HTMLElement && target.matches('button[aria-controls]');
}

var SidebarAccordionHook = {
  mounted() {
    if (!isAccordionButton(this.el)) {
      return;
    }

    var button = this.el;
    var menuId = button.getAttribute('aria-controls');
    var panel = getPanelFromButton(button);

    if (!menuId || !(panel instanceof HTMLElement)) {
      return;
    }

    var stored = readStored(menuId);
    var initialExpanded = stored !== null
      ? stored
      : button.getAttribute('aria-expanded') === 'true';

    applyState(button, panel, initialExpanded, { isInitial: true });

    this.onToggle = (event) => {
      event.preventDefault();
      event.stopPropagation();

      var nextExpanded = button.getAttribute('aria-expanded') !== 'true';
      applyState(button, panel, nextExpanded);
      writeStored(menuId, nextExpanded);
    };

    button.addEventListener('click', this.onToggle);

    var wrapper = button.closest('.flex.w-full.items-center');
    var label = wrapper instanceof HTMLElement
      ? wrapper.querySelector('[data-nav-accordion-label], .text-heading-16')
      : null;

    if (label instanceof HTMLElement) {
      this.onLabelClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        button.click();
      };

      label.addEventListener('click', this.onLabelClick);
      this.labelElement = label;
    }
  },

  updated() {
    if (!isAccordionButton(this.el)) {
      return;
    }

    var button = this.el;
    var menuId = button.getAttribute('aria-controls');
    var panel = getPanelFromButton(button);

    if (!menuId || !(panel instanceof HTMLElement)) {
      return;
    }

    var stored = readStored(menuId);
    var expanded = stored !== null
      ? stored
      : button.getAttribute('aria-expanded') === 'true';

    applyState(button, panel, expanded);
  },

  destroyed() {
    if (this.el instanceof HTMLElement && this.onToggle) {
      this.el.removeEventListener('click', this.onToggle);
    }

    if (this.labelElement instanceof HTMLElement && this.onLabelClick) {
      this.labelElement.removeEventListener('click', this.onLabelClick);
    }
  }
};

export default SidebarAccordionHook;
