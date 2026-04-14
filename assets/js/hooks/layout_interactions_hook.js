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
var MODULE_NAME = 'phoenix.layout_interactions_hook';

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

var LAYOUT_SINGLETON_KEY = '__PHOENIX_LAYOUT_INTERACTIONS_SINGLETON__';

function ensureLayoutSingleton() {
  if (globalScope[LAYOUT_SINGLETON_KEY]) {
    return globalScope[LAYOUT_SINGLETON_KEY];
  }

  var state = {
    defaultRightSidebarState: null,
    headerNavCloseTimeout: null
  };

  try {
    Object.defineProperty(globalScope, LAYOUT_SINGLETON_KEY, {
      value: state,
      writable: false,
      configurable: true,
      enumerable: false
    });
  } catch (_error) {
    globalScope[LAYOUT_SINGLETON_KEY] = state;
  }

  return state;
}

var layoutSingleton = ensureLayoutSingleton();


var THEME_MODES = Object.freeze(['system', 'light', 'dark']);

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function toStringValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}


function cssEscapeValue(value) {
  var stringValue = toStringValue(value);

  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(stringValue);
  }

  return stringValue.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

function mergeSpaceSeparatedTokens() {
  var tokens = [];

  arrayForEach(arguments, function(value) {
    arrayForEach(toStringValue(value).split(/\s+/), function(token) {
      var normalized = token.trim().toLowerCase();
      if (normalized && !arrayIncludes(tokens, normalized)) {
        tokens.push(normalized);
      }
    });
  });

  return tokens.join(' ');
}

function setImportantStyle(element, property, value) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.style.setProperty(property, value, 'important');
}

function clearInlineStyle(element, property) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.style.removeProperty(property);
}

var SAFE_NAVIGATION_PROTOCOLS = Object.freeze(['http:', 'https:', 'mailto:', 'tel:']);
var SANITIZED_URL_ATTRIBUTES = Object.freeze(['href', 'src', 'xlink:href', 'action', 'formaction', 'poster']);
var SANITIZED_REMOVED_ELEMENT_SELECTOR = 'script, iframe, object, embed, frame, frameset, meta[http-equiv="refresh"]';

function isSafeNavigationUrl(value) {
  var raw = toStringValue(value).trim();

  if (!raw) {
    return false;
  }

  if (raw.charAt(0) === '#') {
    return true;
  }

  if (/^\/(?!\/)/.test(raw) || /^\.{1,2}\//.test(raw)) {
    return true;
  }

  try {
    var baseOrigin = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost';
    var parsed = new URL(raw, baseOrigin);
    return parsed.origin === baseOrigin || arrayIncludes(SAFE_NAVIGATION_PROTOCOLS, parsed.protocol);
  } catch (_error) {
    return false;
  }
}

function sanitizeNavigationHref(value, fallbackValue) {
  var fallback = arguments.length > 1 ? fallbackValue : '#';
  var raw = toStringValue(value).trim();
  return isSafeNavigationUrl(raw) ? raw : fallback;
}

function hardenLinkTarget(anchor) {
  if (!(anchor instanceof HTMLAnchorElement)) return;

  if (toStringValue(anchor.getAttribute('target')).trim().toLowerCase() === '_blank') {
    anchor.setAttribute('rel', mergeSpaceSeparatedTokens(anchor.getAttribute('rel'), 'noopener noreferrer'));
  }
}

function sanitizeHtmlTree(root) {
  if (!root || typeof root.querySelectorAll !== 'function') {
    return root;
  }

  arrayForEach(root.querySelectorAll(SANITIZED_REMOVED_ELEMENT_SELECTOR), function(node) {
    node.remove();
  });

  arrayForEach(root.querySelectorAll('*'), function(element) {
    arrayForEach(arraySlice(element.attributes), function(attribute) {
      var attributeName = toStringValue(attribute.name).trim();
      var normalizedAttributeName = attributeName.toLowerCase();

      if (!normalizedAttributeName) {
        return;
      }

      if (normalizedAttributeName.indexOf('on') === 0 || normalizedAttributeName === 'srcdoc') {
        element.removeAttribute(attributeName);
        return;
      }

      if (arrayIncludes(SANITIZED_URL_ATTRIBUTES, normalizedAttributeName) && !isSafeNavigationUrl(attribute.value)) {
        element.removeAttribute(attributeName);
      }
    });

    if (element instanceof HTMLAnchorElement) {
      var href = element.getAttribute('href');
      if (href) {
        element.setAttribute('href', sanitizeNavigationHref(href));
      }

      hardenLinkTarget(element);
    }
  });

  return root;
}

function normalizeThemeMode(mode) {
  var normalized = toStringValue(mode).trim().toLowerCase();
  return arrayIncludes(THEME_MODES, normalized) ? normalized : 'system';
}

/**
 * LayoutInteractionsHook
 *
 * Interações globais do layout:
 * - menu avatar
 * - colapso da sidebar esquerda
 * - swap completo do sidebar direito para o painel Ask AI
 */

var AI_PANEL_STORAGE_KEY = 'docs-right-sidebar-ai-open'
var MOBILE_DOCS_NAV_OPEN_CLASS = 'docs-mobile-nav-open'
var MOBILE_DOCS_NAV_BREAKPOINT = 1024
var HEADER_NAV_DESKTOP_BREAKPOINT = 1150
var HEADER_MOBILE_MENU_OPEN_CLASS = 'header-mobile-menu-open'
var COLLAPSED_SIDEBAR_WIDTH = 'var(--forensic-sidebar-collapsed-width, 10px)'

function getViewportWidth() {
  return parseInteger(globalScope.innerWidth, 0)
}

var isDesktopHeaderNavViewport = () => getViewportWidth() >= HEADER_NAV_DESKTOP_BREAKPOINT


var isMobileDocsViewport = () => getViewportWidth() < MOBILE_DOCS_NAV_BREAKPOINT

var getAskAiPanelEdgeGap = () => isMobileDocsViewport() ? '0px' : COLLAPSED_SIDEBAR_WIDTH

var syncMobileDocsNavTriggerState = () => {
  var isOpen = document.body.classList.contains(MOBILE_DOCS_NAV_OPEN_CLASS)
  var triggers = document.querySelectorAll('[data-mobile-nav-trigger="true"]')

  arrayForEach(triggers, function(trigger) {
    trigger.setAttribute('aria-expanded', String(isOpen))
    trigger.setAttribute(
      'aria-label',
      isOpen ? 'Close navigation menu' : 'Open navigation menu'
    )
  })
}

var openMobileDocsNav = () => {
  if (!isMobileDocsViewport()) return

  closeMobileHeaderMenu()
  document.body.classList.add(MOBILE_DOCS_NAV_OPEN_CLASS)
  syncMobileDocsNavTriggerState()
}

var closeMobileDocsNav = () => {
  document.body.classList.remove(MOBILE_DOCS_NAV_OPEN_CLASS)
  syncMobileDocsNavTriggerState()
}

var toggleMobileDocsNav = () => {
  if (document.body.classList.contains(MOBILE_DOCS_NAV_OPEN_CLASS)) {
    closeMobileDocsNav()
  } else {
    openMobileDocsNav()
  }
}

var isMobileHeaderMenuViewport = () => getViewportWidth() < HEADER_NAV_DESKTOP_BREAKPOINT

var getMobileHeaderMenuRoot = () => document.getElementById('mobile-header-menu-panel')
var getMobileHeaderMenuToggle = () => document.querySelector('[data-mobile-header-menu-toggle="true"]')
var getMobileHeaderSectionTriggers = () => arraySlice(document.querySelectorAll('[data-mobile-header-section-trigger]'))
var getMobileHeaderSectionPanels = () => arraySlice(document.querySelectorAll('[data-mobile-header-section-panel]'))

var syncMobileHeaderMenuTriggerState = () => {
  var toggle = getMobileHeaderMenuToggle()
  var isOpen = document.body.classList.contains(HEADER_MOBILE_MENU_OPEN_CLASS)

  if (!toggle) return

  toggle.setAttribute('aria-expanded', String(isOpen))
  toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu')
  toggle.setAttribute('data-expanded', isOpen ? 'true' : 'false')
}

var closeMobileHeaderSections = () => {
  arrayForEach(getMobileHeaderSectionTriggers(), function(trigger) {
    trigger.setAttribute('data-state', 'closed')
    trigger.setAttribute('aria-expanded', 'false')
  })

  arrayForEach(getMobileHeaderSectionPanels(), function(panel) {
    panel.setAttribute('data-state', 'closed')
  })
}

var syncThemeOptionInputs = (mode) => {
  arrayForEach(document.querySelectorAll('[data-theme-option]'), function(input) {
    if (input instanceof HTMLInputElement) {
      input.checked = input.value === mode
    }
  })
}

var getPreferredThemeMode = () => {
  try {
    return normalizeThemeMode(localStorage.getItem('theme-preference') || localStorage.getItem('theme') || 'system')
  } catch (_error) {
    return 'system'
  }
}

var applyThemeMode = (mode) => {
  var normalizedMode = normalizeThemeMode(mode)
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  var effectiveDark = normalizedMode === 'dark' || (normalizedMode === 'system' && prefersDark)
  var root = document.documentElement
  var body = document.body

  root.classList.toggle('dark', effectiveDark)
  root.classList.toggle('dark-theme', effectiveDark)
  body.classList.toggle('dark', effectiveDark)
  body.classList.toggle('dark-theme', effectiveDark)
  root.setAttribute('data-theme', normalizedMode)

  try {
    localStorage.setItem('theme-preference', normalizedMode)
    localStorage.setItem('theme', normalizedMode)
  } catch (_error) {}

  syncThemeOptionInputs(normalizedMode)
}


var escapeHtml = (value) =>
  toStringValue(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

var replaceChildrenFromClone = (target, source) => {
  if (!(target instanceof HTMLElement) || !(source instanceof HTMLElement)) return

  target.replaceChildren()
  arrayForEach(source.childNodes, function(node) {
    target.appendChild(node.cloneNode(true))
  })
}

var fragmentFromHtml = (html) => {
  var parser = new DOMParser()
  var doc = parser.parseFromString(String(html || ''), 'text/html')
  sanitizeHtmlTree(doc.body)

  var fragment = document.createDocumentFragment()
  arrayForEach(doc.body.childNodes, function(node) {
    fragment.appendChild(node.cloneNode(true))
  })
  return fragment
}

var setElementContentFromHtml = (target, html) => {
  if (!(target instanceof HTMLElement)) return
  target.replaceChildren(fragmentFromHtml(html))
}

var buildMobileHeaderSectionFragment = (key) => {
  var source = document.querySelector(`[data-header-nav-content="${cssEscapeValue(key)}"]`)
  var list = document.createElement('ul')

  if (!(source instanceof HTMLElement)) return list

  var links = arraySlice(source.querySelectorAll('a.navigation-menu-module__AENi4G__menuSubLink'))
  arrayForEach(links, function(sourceLink) {
    if (!(sourceLink instanceof HTMLAnchorElement)) return

    var item = document.createElement('li')
    var link = document.createElement('a')
    link.className = 'forensic-mobile-header-menu__item-link'
    link.setAttribute('href', sanitizeNavigationHref(sourceLink.getAttribute('href') || '#'))

    arrayForEach(['target', 'rel', 'data-zone', 'data-prefetch'], function(attribute) {
      var value = sourceLink.getAttribute(attribute)
      if (value) {
        link.setAttribute(attribute, value)
      }
    })

    hardenLinkTarget(link)

    var iconSource = sourceLink.querySelector('.navigation-menu-module__AENi4G__icons')
    if (iconSource instanceof HTMLElement) {
      link.appendChild(iconSource.cloneNode(true))
    }

    var copy = document.createElement('span')
    copy.className = 'forensic-mobile-header-menu__item-copy'

    var title = document.createElement('span')
    title.className = 'forensic-mobile-header-menu__item-title'
    title.textContent =
      sourceLink.querySelector('.navigation-menu-module__AENi4G__menuItemHeading')?.textContent?.trim() ||
      sourceLink.textContent?.trim() ||
      ''

    var description = document.createElement('span')
    description.className = 'forensic-mobile-header-menu__item-description'
    description.textContent =
      sourceLink.querySelector('.navigation-menu-module__AENi4G__menuItemText')?.textContent?.trim() || ''

    copy.appendChild(title)
    copy.appendChild(description)
    link.appendChild(copy)
    item.appendChild(link)
    list.appendChild(item)
  })

  return list
}

var buildMobileHeaderSectionList = (key) => buildMobileHeaderSectionFragment(key)

var populateMobileHeaderSections = () => {
  arrayForEach(getMobileHeaderSectionPanels(), function(panel) {
    var key = panel.getAttribute('data-mobile-header-section-panel')
    if (!key || panel.getAttribute('data-populated') === 'true') return

    panel.replaceChildren(buildMobileHeaderSectionList(key))
    panel.setAttribute('data-populated', 'true')
  })
}

var toggleMobileHeaderSection = (key) => {
  var escapedKey = cssEscapeValue(key)
  var targetTrigger = document.querySelector(`[data-mobile-header-section-trigger="${escapedKey}"]`)
  var targetPanel = document.querySelector(`[data-mobile-header-section-panel="${escapedKey}"]`)
  if (!targetTrigger || !targetPanel) return

  var shouldOpen = targetTrigger.getAttribute('data-state') !== 'open'

  closeMobileHeaderSections()

  if (!shouldOpen) return

  targetTrigger.setAttribute('data-state', 'open')
  targetTrigger.setAttribute('aria-expanded', 'true')
  targetPanel.setAttribute('data-state', 'open')
}

var openMobileHeaderMenu = () => {
  if (!isMobileHeaderMenuViewport()) return

  closeMobileDocsNav()
  closeHeaderNav()
  var avatarMenu = document.getElementById('avatar-menu')
  if (avatarMenu) avatarMenu.hidden = true

  populateMobileHeaderSections()
  document.body.classList.add(HEADER_MOBILE_MENU_OPEN_CLASS)
  var root = getMobileHeaderMenuRoot()
  if (root) {
    root.hidden = false
    root.setAttribute('aria-hidden', 'false')
  }
  syncMobileHeaderMenuTriggerState()
}

var closeMobileHeaderMenu = () => {
  document.body.classList.remove(HEADER_MOBILE_MENU_OPEN_CLASS)
  var root = getMobileHeaderMenuRoot()
  if (root) {
    root.hidden = true
    root.setAttribute('aria-hidden', 'true')
  }
  closeMobileHeaderSections()
  syncMobileHeaderMenuTriggerState()
}

var toggleMobileHeaderMenu = () => {
  if (document.body.classList.contains(HEADER_MOBILE_MENU_OPEN_CLASS)) {
    closeMobileHeaderMenu()
  } else {
    openMobileHeaderMenu()
  }
}

var cloneAttributes = (source, target) => {
  arrayForEach(target.attributes, function(attr) { target.removeAttribute(attr.name) })
  arrayForEach(source.attributes, function(attr) { target.setAttribute(attr.name, attr.value) })
}

var clearHeaderNavCloseTimeout = () => {
  if (layoutSingleton.headerNavCloseTimeout) {
    globalScope.clearTimeout(layoutSingleton.headerNavCloseTimeout)
    layoutSingleton.headerNavCloseTimeout = null
  }
}

var getHeaderNavRoot = () => document.getElementById('forensic-main-nav')
var getHeaderNavViewportPosition = () =>
  document.querySelector('#forensic-main-nav [data-header-nav-viewport-position="true"]')
var getHeaderNavViewport = () =>
  document.querySelector('#forensic-main-nav [data-header-nav-viewport="true"]')
var getHeaderNavTriggers = () =>
  arraySlice(document.querySelectorAll('#forensic-main-nav [data-header-nav-trigger]'))
var getHeaderNavContents = () =>
  arraySlice(document.querySelectorAll('#forensic-main-nav [data-header-nav-content]'))

var ensureHeaderNavLayoutStyle = () => {
  if (document.getElementById('forensic-header-nav-style')) return

  var style = document.createElement('style')
  style.id = 'forensic-header-nav-style'
  style.textContent = `
    #forensic-main-nav [data-header-nav-viewport-position="true"][hidden] {
      display: none !important;
    }

    #forensic-main-nav [data-header-nav-content][aria-hidden="true"] {
      display: none !important;
    }

    #forensic-main-nav [data-header-nav-content][aria-hidden="false"] {
      display: block !important;
    }
  `

  document.head.appendChild(style)
}

var syncHeaderNavTriggerState = (activeKey = null) => {
  arrayForEach(getHeaderNavTriggers(), function(trigger) {
    var key = trigger.getAttribute('data-header-nav-trigger')
    var isActive = key === activeKey

    trigger.setAttribute('aria-expanded', String(isActive))
    trigger.setAttribute('data-state', isActive ? 'open' : 'closed')

    var chevron = trigger.querySelector('.navigation-menu-module__AENi4G__chevron svg')
    if (chevron) {
      chevron.style.transform = isActive ? 'rotate(180deg)' : 'rotate(0deg)'
    }
  })
}

var syncHeaderNavContentState = (activeKey = null) => {
  var viewportPosition = getHeaderNavViewportPosition()
  var viewport = getHeaderNavViewport()

  arrayForEach(getHeaderNavContents(), function(content) {
    var key = content.getAttribute('data-header-nav-content')
    var isActive = key === activeKey

    content.setAttribute('aria-hidden', String(!isActive))
    content.setAttribute('data-state', isActive ? 'open' : 'closed')
    content.style.display = isActive ? 'block' : 'none'
  })

  if (viewportPosition) {
    viewportPosition.hidden = !activeKey
  }

  if (viewport) {
    viewport.setAttribute('data-state', activeKey ? 'open' : 'closed')
  }
}

var positionHeaderNavViewport = (trigger) => {
  var root = getHeaderNavRoot()
  var viewportPosition = getHeaderNavViewportPosition()

  if (!root || !viewportPosition || !(trigger instanceof HTMLElement)) return

  var rootRect = root.getBoundingClientRect()
  var triggerRect = trigger.getBoundingClientRect()
  var triggerCenter = triggerRect.left + triggerRect.width / 2
  var rootCenter = rootRect.left + rootRect.width / 2
  var offset = triggerCenter - rootCenter

  viewportPosition.style.setProperty('--left-offset', `${offset}px`)
}

var openHeaderNav = (key) => {
  if (!isDesktopHeaderNavViewport()) return

  var trigger = getHeaderNavTriggers().find(
    (item) => item.getAttribute('data-header-nav-trigger') === key
  )

  if (!trigger) {
    closeHeaderNav()
    return
  }

  clearHeaderNavCloseTimeout()
  positionHeaderNavViewport(trigger)
  syncHeaderNavTriggerState(key)
  syncHeaderNavContentState(key)
}

var closeHeaderNav = () => {
  clearHeaderNavCloseTimeout()
  syncHeaderNavTriggerState(null)
  syncHeaderNavContentState(null)
}

var scheduleHeaderNavClose = () => {
  clearHeaderNavCloseTimeout()
  layoutSingleton.headerNavCloseTimeout = globalScope.setTimeout(() => {
    closeHeaderNav()
  }, 80)
}

var ensureAskAiLayoutStyle = () => {
  var style = document.getElementById('ask-ai-layout-style')
  if (!(style instanceof HTMLStyleElement)) {
    style = document.createElement('style')
    style.id = 'ask-ai-layout-style'
    document.head.appendChild(style)
  }

  style.textContent = `
    body.ask-ai-panel-open {
      --ask-ai-panel-width: min(420px, calc(100vw - 32px));
      --ask-ai-panel-edge-gap: ${COLLAPSED_SIDEBAR_WIDTH};
    }

    body.ask-ai-panel-open #right-sidebar[data-right-sidebar-mode="ask-ai"] {
      overflow: hidden !important;
      box-sizing: border-box !important;
      background: var(--ds-background-100) !important;
      z-index: 6001 !important;
    }

    @media (min-width: 1024px) {
      body.ask-ai-panel-open .header-module__6nzVrW__wrapper {
        padding-right: var(--ask-ai-panel-width) !important;
        box-sizing: border-box !important;
      }

      body.ask-ai-panel-open .header-module__6nzVrW__header {
        justify-content: flex-start !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      body.ask-ai-panel-open .header-module__6nzVrW__main,
      body.ask-ai-panel-open #forensic-main-nav {
        display: none !important;
      }

      body.ask-ai-panel-open .header-module__6nzVrW__left {
        flex: 0 0 auto !important;
        min-width: 0 !important;
      }

      body.ask-ai-panel-open .forensic-main-wrapper {
        padding-right: calc(var(--forensic-wrapper-inline-padding) + var(--ask-ai-panel-width)) !important;
        box-sizing: border-box !important;
      }

      body.ask-ai-panel-open #docs-main-content {
        flex: 1 1 auto !important;
        width: auto !important;
        max-width: none !important;
        min-width: 0 !important;
      }

      body.ask-ai-panel-open #forensic-header-actions {
        flex: 0 1 auto !important;
        margin-left: auto !important;
        margin-right: 0 !important;
        min-width: 0 !important;
      }

      body.ask-ai-panel-open #forensic-header-actions > div {
        justify-content: flex-end !important;
      }

      body.ask-ai-panel-open #forensic-header-actions .lg\\:justify-end {
        justify-content: flex-end !important;
      }

      body.ask-ai-panel-open #right-sidebar[data-right-sidebar-mode="ask-ai"] {
        position: fixed !important;
        inset: 0 0 0 auto !important;
        top: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        display: block !important;
        width: calc(var(--ask-ai-panel-width) - var(--ask-ai-panel-edge-gap)) !important;
        min-width: calc(var(--ask-ai-panel-width) - var(--ask-ai-panel-edge-gap)) !important;
        height: 100vh !important;
        margin-right: var(--ask-ai-panel-edge-gap) !important;
        margin-top: 0 !important;
        border-left: 1px solid var(--ds-gray-alpha-400) !important;
        box-shadow: -20px 0 48px rgba(15, 23, 42, 0.12) !important;
      }
    }

    @media (max-width: 1023px) {
      body.ask-ai-panel-open #right-sidebar[data-right-sidebar-mode="ask-ai"] {
        position: fixed !important;
        top: calc(var(--header-height) + 55px) !important;
        right: 0 !important;
        bottom: 0 !important;
        left: 0 !important;
        display: block !important;
        width: 100vw !important;
        min-width: 0 !important;
        height: auto !important;
        margin-right: 0 !important;
        border-left: 0 !important;
        box-shadow: none !important;
      }
    }

    body.ask-ai-panel-open #right-sidebar[data-right-sidebar-mode="ask-ai"] [data-ai-chat-panel-root] {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
    }
  `
}

var syncAskAiHeaderLayout = (isOpen) => {
  var wrapper = document.querySelector('.header-module__6nzVrW__wrapper');
  var header = document.querySelector('.header-module__6nzVrW__header');
  var headerMain = document.querySelector('.header-module__6nzVrW__main');
  var headerNav = document.getElementById('forensic-main-nav');
  var headerLeft = document.querySelector('.header-module__6nzVrW__left');
  var headerActions = document.getElementById('forensic-header-actions');
  var headerActionsRow = headerActions && headerActions.firstElementChild instanceof HTMLElement
    ? headerActions.firstElementChild
    : null;
  var headerActionsGroup = headerActionsRow
    ? headerActionsRow.querySelector('.relative')
    : null;
  var mainWrapper = document.querySelector('.forensic-main-wrapper');

  if (isOpen) {
    setImportantStyle(wrapper, 'padding-right', 'var(--ask-ai-panel-width)');
    setImportantStyle(wrapper, 'box-sizing', 'border-box');
    setImportantStyle(header, 'justify-content', 'flex-start');
    setImportantStyle(header, 'max-width', '100%');
    setImportantStyle(header, 'box-sizing', 'border-box');
    setImportantStyle(headerMain, 'display', 'none');
    setImportantStyle(headerNav, 'display', 'none');
    setImportantStyle(headerLeft, 'flex', '0 0 auto');
    setImportantStyle(headerLeft, 'min-width', '0');
    setImportantStyle(headerActions, 'flex', '0 1 auto');
    setImportantStyle(headerActions, 'margin-left', 'auto');
    setImportantStyle(headerActions, 'margin-right', '0');
    setImportantStyle(headerActions, 'min-width', '0');
    setImportantStyle(headerActionsRow, 'justify-content', 'flex-end');
    setImportantStyle(headerActionsGroup, 'justify-content', 'flex-end');
    setImportantStyle(mainWrapper, 'padding-right', 'calc(var(--forensic-wrapper-inline-padding) + var(--ask-ai-panel-width))');
    setImportantStyle(mainWrapper, 'box-sizing', 'border-box');
    return;
  }

  clearInlineStyle(wrapper, 'padding-right');
  clearInlineStyle(wrapper, 'box-sizing');
  clearInlineStyle(header, 'justify-content');
  clearInlineStyle(header, 'max-width');
  clearInlineStyle(header, 'box-sizing');
  clearInlineStyle(headerMain, 'display');
  clearInlineStyle(headerNav, 'display');
  clearInlineStyle(headerLeft, 'flex');
  clearInlineStyle(headerLeft, 'min-width');
  clearInlineStyle(headerActions, 'flex');
  clearInlineStyle(headerActions, 'margin-left');
  clearInlineStyle(headerActions, 'margin-right');
  clearInlineStyle(headerActions, 'min-width');
  clearInlineStyle(headerActionsRow, 'justify-content');
  clearInlineStyle(headerActionsGroup, 'justify-content');
  clearInlineStyle(mainWrapper, 'padding-right');
  clearInlineStyle(mainWrapper, 'box-sizing');
}


var buildAskAiSuggestionsContent = () => `
<div data-ask-ai-suggestions="true" class="px-4 pt-4 pb-2"><div dir="ltr" class="relative overflow-hidden w-full overflow-x-auto whitespace-nowrap" style="position: relative; --radix-scroll-area-corner-width: 0px; --radix-scroll-area-corner-height: 0px;"><style>[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}</style><div data-radix-scroll-area-viewport="" class="h-full w-full rounded-[inherit]" style="overflow: scroll;"><div style="min-width: 100%; display: table;"><div class="space-y-2 cursor-text w-full"><button type="submit" tabindex="0" data-react-aria-pressable="true" class="outline-none m-0 p-0 border-0 align-baseline no-underline group/trigger relative cursor-pointer select-none transform translate-z-0 flex text-[var(--themed-fg,_var(--ds-background-100))] !px-(--geist-gap-half) max-w-full items-center transition-[border-color, background,color,transform,box-shadow] duration-[150ms] ease-in-out data-[focus]:transition-none data-[focus]:shadow-[var(--ds-focus-ring)] [&_svg]:shrink-0 disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:text-[var(--ds-gray-700)] disabled:bg-[var(--ds-gray-100)] aria-disabled:text-[var(--ds-gray-700)] aria-disabled:bg-[var(--ds-gray-100)] disabled:![--themed-border:_var(--ds-gray-400)] [--x-padding:6px] [--height:32px] !pl-[var(--x-padding)] !pr-[var(--x-padding)] geist-new-themed geist-new-tertiary geist-new-tertiary-fill rounded-md bg-transparent !text-[var(--themed-bg,_var(--ds-gray-1000))] [--themed-border:_transparent] [--themed-hover-bg:_var(--ds-gray-alpha-200)] [--lighten-color:_rgba(255,_255,_255,_0.8)] data-hover:![--themed-border:_var(--ds-gray-alpha-200)] text-(length:--geist-form-small-font) [--spinner-size:16px] h-[var(--height)] data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_22%))] dark-theme:data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_80%))] data-hover:[--themed-border:var(--themed-hover-bg,_var(--ds-gray-200))] data-hover:disabled:bg-[var(--ds-gray-100)] w-full font-normal justify-start hover:!bg-gray-alpha-100" data-geist-button="" data-prefix="true" data-suffix="false" data-version="v1" style="--geist-icon-size: 16px;"><span class="mr-0.5 min-w-5 shrink-0 flex items-center justify-center"><svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color: var(--ds-gray-700);"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 1L0 15H16L8 1ZM8 4.02335L2.58477 13.5H13.4152L8 4.02335Z" fill="currentColor"></path></svg></span><span class="truncate inline-block px-1.5">What is Vercel?</span></button><button type="submit" tabindex="0" data-react-aria-pressable="true" class="outline-none m-0 p-0 border-0 align-baseline no-underline group/trigger relative cursor-pointer select-none transform translate-z-0 flex text-[var(--themed-fg,_var(--ds-background-100))] !px-(--geist-gap-half) max-w-full items-center transition-[border-color, background,color,transform,box-shadow] duration-[150ms] ease-in-out data-[focus]:transition-none data-[focus]:shadow-[var(--ds-focus-ring)] [&_svg]:shrink-0 disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:text-[var(--ds-gray-700)] disabled:bg-[var(--ds-gray-100)] aria-disabled:text-[var(--ds-gray-700)] aria-disabled:bg-[var(--ds-gray-100)] disabled:![--themed-border:_var(--ds-gray-400)] [--x-padding:6px] [--height:32px] !pl-[var(--x-padding)] !pr-[var(--x-padding)] geist-new-themed geist-new-tertiary geist-new-tertiary-fill rounded-md bg-transparent !text-[var(--themed-bg,_var(--ds-gray-1000))] [--themed-border:_transparent] [--themed-hover-bg:_var(--ds-gray-alpha-200)] [--lighten-color:_rgba(255,_255,_255,_0.8)] data-hover:![--themed-border:_var(--ds-gray-alpha-200)] text-(length:--geist-form-small-font) [--spinner-size:16px] h-[var(--height)] data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_22%))] dark-theme:data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_80%))] data-hover:[--themed-border:var(--themed-hover-bg,_var(--ds-gray-200))] data-hover:disabled:bg-[var(--ds-gray-100)] w-full font-normal justify-start hover:!bg-gray-alpha-100" data-geist-button="" data-prefix="true" data-suffix="false" data-version="v1" style="--geist-icon-size: 16px;"><span class="mr-0.5 min-w-5 shrink-0 flex items-center justify-center"><svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color: var(--ds-gray-700);"><path fill-rule="evenodd" clip-rule="evenodd" d="M0 2C0 1.44772 0.447715 1 1 1H15C15.5523 1 16 1.44772 16 2V10.5C16 11.0523 15.5523 11.5 15 11.5H8.75V14.5H9.75H10.5V16H9.75H6.25H5.5V14.5H6.25H7.25V11.5H1C0.447714 11.5 0 11.0523 0 10.5V2ZM1.5 2.5V10H14.5V2.5H1.5Z" fill="currentColor"></path></svg></span><span class="truncate inline-block px-1.5">What can I deploy with Vercel?</span></button><button type="submit" tabindex="0" data-react-aria-pressable="true" class="outline-none m-0 p-0 border-0 align-baseline no-underline group/trigger relative cursor-pointer select-none transform translate-z-0 flex text-[var(--themed-fg,_var(--ds-background-100))] !px-(--geist-gap-half) max-w-full items-center transition-[border-color, background,color,transform,box-shadow] duration-[150ms] ease-in-out data-[focus]:transition-none data-[focus]:shadow-[var(--ds-focus-ring)] [&_svg]:shrink-0 disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:text-[var(--ds-gray-700)] disabled:bg-[var(--ds-gray-100)] aria-disabled:text-[var(--ds-gray-700)] aria-disabled:bg-[var(--ds-gray-100)] disabled:![--themed-border:_var(--ds-gray-400)] [--x-padding:6px] [--height:32px] !pl-[var(--x-padding)] !pr-[var(--x-padding)] geist-new-themed geist-new-tertiary geist-new-tertiary-fill rounded-md bg-transparent !text-[var(--themed-bg,_var(--ds-gray-1000))] [--themed-border:_transparent] [--themed-hover-bg:_var(--ds-gray-alpha-200)] [--lighten-color:_rgba(255,_255,_255,_0.8)] data-hover:![--themed-border:_var(--ds-gray-alpha-200)] text-(length:--geist-form-small-font) [--spinner-size:16px] h-[var(--height)] data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_22%))] dark-theme:data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_80%))] data-hover:[--themed-border:var(--themed-hover-bg,_var(--ds-gray-200))] data-hover:disabled:bg-[var(--ds-gray-100)] w-full font-normal justify-start hover:!bg-gray-alpha-100" data-geist-button="" data-prefix="true" data-suffix="false" data-version="v1" style="--geist-icon-size: 16px;"><span class="mr-0.5 min-w-5 shrink-0 flex items-center justify-center"><svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color: var(--ds-gray-700);"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 2H9V0.75V0H10.5V0.75V2H13C13.5523 2 14 2.44772 14 3V5.5H15.25H16V7H15.25H14V9H15.25H16V10.5H15.25H14V13C14 13.5523 13.5523 14 13 14H10.5V15.25V16H9V15.25V14H7V15.25V16H5.5V15.25V14H3C2.44772 14 2 13.5523 2 13V10.5H0.75H0V9H0.75H2V7H0.75H0V5.5H0.75H2V3C2 2.44772 2.44772 2 3 2H5.5V0.75V0H7V0.75V2ZM3.5 8.98228V3.5H12.5V9H10C9.56114 9 9.29513 8.85208 9.13685 8.68588C8.96919 8.50984 8.875 8.26309 8.875 8C8.875 7.73691 8.96919 7.49016 9.13685 7.31412C9.29513 7.14792 9.56114 7 10 7V5.5C8.82792 5.5 7.9118 5.74294 7.16034 6.13019C6.41599 6.51379 5.87229 7.01955 5.42887 7.4794C5.29221 7.62111 5.17056 7.75171 5.05789 7.87267L5.05789 7.87267C4.78031 8.17066 4.55724 8.41014 4.2986 8.6132C4.04734 8.81045 3.80061 8.93775 3.5 8.98228ZM3.5 10.4907V12.5H12.5V10.5H10C9.18886 10.5 8.51737 10.2104 8.05065 9.72037C7.59331 9.24016 7.375 8.61191 7.375 8C7.375 7.91436 7.37928 7.8284 7.38788 7.74258C7.06615 7.96886 6.78522 8.23377 6.50863 8.5206C6.41912 8.61343 6.32548 8.71405 6.22828 8.8185L6.22819 8.8186C5.92315 9.14637 5.58298 9.5119 5.22484 9.79305C4.75982 10.1581 4.20727 10.437 3.5 10.4907Z" fill="currentColor"></path></svg></span><span class="truncate inline-block px-1.5">What is Fluid Compute?</span></button><button type="submit" tabindex="0" data-react-aria-pressable="true" class="outline-none m-0 p-0 border-0 align-baseline no-underline group/trigger relative cursor-pointer select-none transform translate-z-0 flex text-[var(--themed-fg,_var(--ds-background-100))] !px-(--geist-gap-half) max-w-full items-center transition-[border-color, background,color,transform,box-shadow] duration-[150ms] ease-in-out data-[focus]:transition-none data-[focus]:shadow-[var(--ds-focus-ring)] [&_svg]:shrink-0 disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:text-[var(--ds-gray-700)] disabled:bg-[var(--ds-gray-100)] aria-disabled:text-[var(--ds-gray-700)] aria-disabled:bg-[var(--ds-gray-100)] disabled:![--themed-border:_var(--ds-gray-400)] [--x-padding:6px] [--height:32px] !pl-[var(--x-padding)] !pr-[var(--x-padding)] geist-new-themed geist-new-tertiary geist-new-tertiary-fill rounded-md bg-transparent !text-[var(--themed-bg,_var(--ds-gray-1000))] [--themed-border:_transparent] [--themed-hover-bg:_var(--ds-gray-alpha-200)] [--lighten-color:_rgba(255,_255,_255,_0.8)] data-hover:![--themed-border:_var(--ds-gray-alpha-200)] text-(length:--geist-form-small-font) [--spinner-size:16px] h-[var(--height)] data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_22%))] dark-theme:data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_80%))] data-hover:[--themed-border:var(--themed-hover-bg,_var(--ds-gray-200))] data-hover:disabled:bg-[var(--ds-gray-100)] w-full font-normal justify-start hover:!bg-gray-alpha-100" data-geist-button="" data-prefix="true" data-suffix="false" data-version="v1" style="--geist-icon-size: 16px;"><span class="mr-0.5 min-w-5 shrink-0 flex items-center justify-center"><svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color: var(--ds-gray-700);"><path fill-rule="evenodd" clip-rule="evenodd" d="M14 3H2C1.72386 3 1.5 3.22386 1.5 3.5V5L14.5 5V3.5C14.5 3.22386 14.2761 3 14 3ZM1.5 12.5V6.5L14.5 6.5V12.5C14.5 12.7761 14.2761 13 14 13H2C1.72386 13 1.5 12.7761 1.5 12.5ZM2 1.5C0.895431 1.5 0 2.39543 0 3.5V12.5C0 13.6046 0.895431 14.5 2 14.5H14C15.1046 14.5 16 13.6046 16 12.5V3.5C16 2.39543 15.1046 1.5 14 1.5H2ZM4 10.75C4.41421 10.75 4.75 10.4142 4.75 10C4.75 9.58579 4.41421 9.25 4 9.25C3.58579 9.25 3.25 9.58579 3.25 10C3.25 10.4142 3.58579 10.75 4 10.75Z" fill="currentColor"></path></svg></span><span class="truncate inline-block px-1.5">How much does Vercel cost?</span></button></div></div></div></div><p class="mt-3 px-2 text-label-14 text-gray-900">Tip: You can open and close chat with<kbd class="font-sans! bg-[var(--ds-background-100)] inline-flex items-center justify-center align-middle text-center rounded-sm font-[var(--font-sans)] text-xs h-5 px-1 min-w-5 min-h-5 ml-1.5 text-gray-900 shadow-xs ring ring-gray-alpha-400" data-geist-kbd="" data-version="v1"><span class="inline-flex items-center justify-center leading-none text-xs" style="min-width: 1em;">Ctrl</span></kbd><kbd class="bg-[var(--ds-background-100)] inline-flex items-center justify-center align-middle text-center rounded-sm font-[var(--font-sans)] text-xs h-5 px-1 min-w-5 min-h-5 ml-1 text-gray-900 font-mono! shadow-xs ring ring-gray-alpha-400" data-geist-kbd="" data-version="v1"><span class="inline-flex items-center justify-center leading-none text-xs">I</span></kbd></p></div>
`

var getAskAiPageContext = () => {
  var titleCandidates = [
    '#docs-main-content h1',
    'main h1',
    'article h1',
    '[data-page-title]',
    'h1',
    'title',
  ]

  var pageTitle = 'Current Page'
  for (var selector of titleCandidates) {
    var element = document.querySelector(selector)
    var value = element?.textContent?.trim()
    if (value) {
      pageTitle = value
      break
    }
  }

  var pageUrl = window.location.href
  try {
    pageUrl = window.location.href
  } catch (_error) {}

  return { pageTitle, pageUrl }
}

var buildAskAiPanelContent = ({ pageTitle, pageUrl }) => `
<div data-ai-chat-panel-root="true" class="h-full min-w-0">
  <div class="overflow-hidden justify-end h-full flex flex-col bg-background-100">
    <div class="flex items-center justify-between pl-3.5 pr-2 py-2 sticky top-0 bg-background-100 h-16 z-10">
      <h2 class="font-semibold text-sm">Ask AI</h2>
      <div class="flex items-center gap-0.5">
        <span class="inline-flex items-center" data-testid="legacy/tooltip-trigger" data-version="v1" tabindex="0">
          <button type="button" disabled tabindex="0" data-react-aria-pressable="true" aria-label="Copy chat as markdown" data-testid="copy/button" title="Copy entire conversation as markdown" class="outline-none m-0 border-0 align-baseline no-underline group/trigger relative cursor-pointer select-none transform translate-z-0 flex text-[var(--themed-fg,_var(--ds-background-100))] font-medium !px-(--geist-gap-half) max-w-full items-center justify-center transition-[border-color, background,color,transform,box-shadow] duration-[150ms] ease-in-out data-[focus]:transition-none data-[focus]:shadow-[var(--ds-focus-ring)] [&_svg]:shrink-0 disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:text-[var(--ds-gray-700)] disabled:bg-[var(--ds-gray-100)] aria-disabled:text-[var(--ds-gray-700)] aria-disabled:bg-[var(--ds-gray-100)] disabled:![--themed-border:_var(--ds-gray-400)] shadow-none opacity-50 [--x-padding:6px] [--height:32px] geist-new-themed geist-new-tertiary geist-new-tertiary-fill rounded-md bg-transparent [--themed-border:_transparent] [--themed-hover-bg:_var(--ds-gray-alpha-200)] [--lighten-color:_rgba(255,_255,_255,_0.8)] data-hover:![--themed-border:_var(--ds-gray-alpha-200)] p-0 w-[var(--geist-form-small-height)] h-[32px] text-(length:--geist-form-small-font) [--spinner-size:16px] data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_22%))] dark-theme:data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_80%))] data-hover:[--themed-border:var(--themed-hover-bg,_var(--ds-gray-200))] data-hover:disabled:bg-[var(--ds-gray-100)] text-gray-800!" data-geist-button="" data-prefix="false" data-suffix="false" data-version="v1" style="--geist-icon-size: 16px;"><span class="truncate px-1.5 inline-flex items-center justify-center shrink-0"><svg viewBox="0 0 16 16" height="16" width="16" data-slot="geist-icon" style="color: currentcolor;"><path fill="currentColor" fill-rule="evenodd" d="M8.25 2c.14 0 .25.11.25.25V3H10v-.75C10 1.28 9.22.5 8.25.5h-5.5C1.78.5 1 1.28 1 2.25v7.5c0 .97.78 1.75 1.75 1.75H4.5V10H2.75a.25.25 0 0 1-.25-.25v-7.5c0-.14.11-.25.25-.25zm5 4c.14 0 .25.11.25.25v7.5q-.02.23-.25.25h-5.5a.25.25 0 0 1-.25-.25v-7.5c0-.14.11-.25.25-.25zm0 9.5c.97 0 1.75-.78 1.75-1.75v-7.5c0-.97-.78-1.75-1.75-1.75h-5.5C6.78 4.5 6 5.28 6 6.25v7.5c0 .97.78 1.75 1.75 1.75z" clip-rule="evenodd"></path></svg></span></button>
        </span>
        <span class="inline-flex items-center" data-testid="legacy/tooltip-trigger" data-version="v1" tabindex="0">
          <button type="submit" disabled tabindex="0" data-react-aria-pressable="true" aria-label="Share chat" class="outline-none m-0 border-0 align-baseline no-underline group/trigger relative cursor-pointer select-none transform translate-z-0 flex text-[var(--themed-fg,_var(--ds-background-100))] font-medium !px-(--geist-gap-half) max-w-full items-center justify-center transition-[border-color, background,color,transform,box-shadow] duration-[150ms] ease-in-out data-[focus]:transition-none data-[focus]:shadow-[var(--ds-focus-ring)] [&_svg]:shrink-0 disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:text-[var(--ds-gray-700)] disabled:bg-[var(--ds-gray-100)] aria-disabled:text-[var(--ds-gray-700)] aria-disabled:bg-[var(--ds-gray-100)] disabled:![--themed-border:_var(--ds-gray-400)] shadow-none opacity-50 [--x-padding:6px] [--height:32px] geist-new-themed geist-new-tertiary geist-new-tertiary-fill rounded-md bg-transparent [--themed-border:_transparent] [--themed-hover-bg:_var(--ds-gray-alpha-200)] [--lighten-color:_rgba(255,_255,_255,_0.8)] data-hover:![--themed-border:_var(--ds-gray-alpha-200)] p-0 w-[var(--geist-form-small-height)] h-[32px] text-(length:--geist-form-small-font) [--spinner-size:16px] data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_22%))] dark-theme:data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_80%))] data-hover:[--themed-border:var(--themed-hover-bg,_var(--ds-gray-200))] data-hover:disabled:bg-[var(--ds-gray-100)] text-gray-800!" data-geist-button="" data-prefix="false" data-suffix="false" data-version="v1" style="--geist-icon-size: 16px;"><span class="truncate px-1.5 inline-flex items-center justify-center shrink-0"><svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="width: 14px; height: 14px; color: currentcolor;"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.29289 1.39644C7.68342 1.00592 8.31658 1.00592 8.70711 1.39644L11.7803 4.46966L12.3107 4.99999L11.25 6.06065L10.7197 5.53032L8.75 3.56065V10.25V11H7.25V10.25V3.56065L5.28033 5.53032L4.75 6.06065L3.68934 4.99999L4.21967 4.46966L7.29289 1.39644ZM13.5 9.24999V13.5H2.5V9.24999V8.49999H1V9.24999V14C1 14.5523 1.44771 15 2 15H14C14.5523 15 15 14.5523 15 14V9.24999V8.49999H13.5V9.24999Z" fill="currentColor"></path></svg></span></button>
        </span>
        <span class="inline-flex items-center" data-testid="legacy/tooltip-trigger" data-version="v1" tabindex="0">
          <button type="submit" tabindex="0" data-react-aria-pressable="true" aria-label="Clear chat" class="outline-none m-0 border-0 align-baseline no-underline group/trigger relative cursor-pointer select-none transform translate-z-0 flex text-[var(--themed-fg,_var(--ds-background-100))] font-medium !px-(--geist-gap-half) max-w-full items-center justify-center transition-[border-color, background,color,transform,box-shadow] duration-[150ms] ease-in-out data-[focus]:transition-none data-[focus]:shadow-[var(--ds-focus-ring)] [&_svg]:shrink-0 disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:text-[var(--ds-gray-700)] disabled:bg-[var(--ds-gray-100)] aria-disabled:text-[var(--ds-gray-700)] aria-disabled:bg-[var(--ds-gray-100)] disabled:![--themed-border:_var(--ds-gray-400)] [--x-padding:6px] [--height:32px] geist-new-themed geist-new-tertiary geist-new-tertiary-fill rounded-md bg-transparent [--themed-border:_transparent] [--themed-hover-bg:_var(--ds-gray-alpha-200)] [--lighten-color:_rgba(255,_255,_255,_0.8)] data-hover:![--themed-border:_var(--ds-gray-alpha-200)] p-0 w-[var(--geist-form-small-height)] h-[32px] text-(length:--geist-form-small-font) [--spinner-size:16px] data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_22%))] dark-theme:data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_80%))] data-hover:[--themed-border:var(--themed-hover-bg,_var(--ds-gray-200))] data-hover:disabled:bg-[var(--ds-gray-100)] text-gray-800!" data-geist-button="" data-prefix="false" data-suffix="false" data-version="v1" style="--geist-icon-size: 16px;"><span class="truncate px-1.5 inline-flex items-center justify-center shrink-0"><svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="width: 14px; height: 14px; color: currentcolor;"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.75 2.75C6.75 2.05964 7.30964 1.5 8 1.5C8.69036 1.5 9.25 2.05964 9.25 2.75V3H6.75V2.75ZM5.25 3V2.75C5.25 1.23122 6.48122 0 8 0C9.51878 0 10.75 1.23122 10.75 2.75V3H12.9201H14.25H15V4.5H14.25H13.8846L13.1776 13.6917C13.0774 14.9942 11.9913 16 10.6849 16H5.31508C4.00874 16 2.92263 14.9942 2.82244 13.6917L2.11538 4.5H1.75H1V3H1.75H3.07988H5.25ZM4.31802 13.5767L3.61982 4.5H12.3802L11.682 13.5767C11.6419 14.0977 11.2075 14.5 10.6849 14.5H5.31508C4.79254 14.5 4.3581 14.0977 4.31802 13.5767Z" fill="currentColor"></path></svg></span></button>
        </span>
        <button type="submit" tabindex="0" data-react-aria-pressable="true" data-ask-ai-close="true" aria-label="Close chat" class="outline-none m-0 border-0 align-baseline no-underline group/trigger relative cursor-pointer select-none transform translate-z-0 flex text-[var(--themed-fg,_var(--ds-background-100))] font-medium !px-(--geist-gap-half) max-w-full items-center justify-center transition-[border-color, background,color,transform,box-shadow] duration-[150ms] ease-in-out data-[focus]:transition-none data-[focus]:shadow-[var(--ds-focus-ring)] [&_svg]:shrink-0 disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:text-[var(--ds-gray-700)] disabled:bg-[var(--ds-gray-100)] aria-disabled:text-[var(--ds-gray-700)] aria-disabled:bg-[var(--ds-gray-100)] disabled:![--themed-border:_var(--ds-gray-400)] [--x-padding:6px] [--height:32px] geist-new-themed geist-new-tertiary geist-new-tertiary-fill rounded-md bg-transparent [--themed-border:_transparent] [--themed-hover-bg:_var(--ds-gray-alpha-200)] [--lighten-color:_rgba(255,_255,_255,_0.8)] data-hover:![--themed-border:_var(--ds-gray-alpha-200)] p-0 w-[var(--geist-form-small-height)] h-[32px] text-(length:--geist-form-small-font) [--spinner-size:16px] data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_22%))] dark-theme:data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_80%))] data-hover:[--themed-border:var(--themed-hover-bg,_var(--ds-gray-200))] data-hover:disabled:bg-[var(--ds-gray-100)] shadow-none text-gray-800!" data-geist-button="" data-prefix="false" data-suffix="false" data-version="v1" style="--geist-icon-size: 16px;"><span class="truncate px-1.5 inline-flex items-center justify-center shrink-0"><svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="width: 14px; height: 14px; color: currentcolor;"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.8536 8.7071C13.2441 8.31657 13.2441 7.68341 12.8536 7.29288L9.03034 3.46966L8.50001 2.93933L7.43935 3.99999L7.96968 4.53032L11.4393 7.99999L7.96968 11.4697L7.43935 12L8.50001 13.0607L9.03034 12.5303L12.8536 8.7071ZM7.85356 8.7071C8.24408 8.31657 8.24408 7.68341 7.85356 7.29288L4.03034 3.46966L3.50001 2.93933L2.43935 3.99999L2.96968 4.53032L6.43935 7.99999L2.96968 11.4697L2.43935 12L3.50001 13.0607L4.03034 12.5303L7.85356 8.7071Z" fill="currentColor"></path></svg></span></button>
      </div>
    </div>
    <div class="relative overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-1" role="log"><div style="height: 100%; width: 100%; overflow: auto;"><div class="p-4"></div></div></div>
    <div class=""><div class="p-4"><div class="pb-2 pt-2 cursor-text border border-gray-300 rounded-xl shadow-xs focus-within:border-gray-500 transition-colors duration-250"><div data-page-context-wrapper="true" class="relative group"><div class="mx-4 mt-2 mb-2 cursor-pointer bg-background-100 flex items-center justify-between gap-3 rounded-lg border border-gray-400 px-3 py-2.5 animate-fade-in"><div class="flex items-center gap-2 min-w-0 flex-1"><svg class="text-gray-900 shrink-0" data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="width: 16px; height: 16px; color: currentcolor;"><path fill-rule="evenodd" clip-rule="evenodd" d="M14.5 13.5V6.5V5.41421C14.5 5.149 14.3946 4.89464 14.2071 4.70711L9.79289 0.292893C9.60536 0.105357 9.351 0 9.08579 0H8H3H1.5V1.5V13.5C1.5 14.8807 2.61929 16 4 16H12C13.3807 16 14.5 14.8807 14.5 13.5ZM13 13.5V6.5H9.5H8V5V1.5H3V13.5C3 14.0523 3.44772 14.5 4 14.5H12C12.5523 14.5 13 14.0523 13 13.5ZM9.5 5V2.12132L12.3787 5H9.5ZM5.13 5.00062H4.505V6.25062H5.13H6H6.625V5.00062H6H5.13ZM4.505 8H5.13H11H11.625V9.25H11H5.13H4.505V8ZM5.13 11H4.505V12.25H5.13H11H11.625V11H11H5.13Z" fill="currentColor"></path></svg><div class="min-w-0 flex-1"><p class="text-sm font-medium text-gray-1000 truncate m-0">${escapeHtml(pageTitle)}</p><p class="text-xs text-gray-700 truncate m-0">${escapeHtml(pageUrl)}</p></div></div><button aria-label="Remove page context card" data-remove-page-context="true" type="button" class="cursor-pointer absolute -translate-y-1/2 -translate-x-1/2 right-0 top-0 size-5 inline-flex items-center justify-center rounded-full bg-gray-1000 opacity-0 group-hover:opacity-100 transition-opacity duration-200"><svg class="text-background-100!" data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="width: 12px; height: 12px; color: currentcolor;"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z" fill="currentColor"></path></svg></button></div></div><form class="flex flex-col items-center gap-2"><textarea class="flex bg-transparent py-2 text-base disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full resize-none rounded-none shadow-none outline-hidden ring-0 font-sans min-h-0 placeholder:text-gray-600 focus-visible:ring-0 px-4" name="message" placeholder="Ask a question..."></textarea><div class="items-center w-full px-2 flex justify-end"><button type="submit" disabled tabindex="0" data-react-aria-pressable="true" aria-label="Submit" class="outline-none m-0 border-0 align-baseline no-underline group/trigger relative cursor-pointer select-none transform translate-z-0 flex text-[var(--themed-fg,_var(--ds-background-100))] bg-[var(--themed-bg,_var(--ds-gray-1000))] font-medium !px-(--geist-gap-half) max-w-full items-center justify-center transition-[border-color, background,color,transform,box-shadow] duration-[150ms] ease-in-out data-[focus]:transition-none data-[focus]:shadow-[var(--ds-focus-ring)] [&_svg]:shrink-0 disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:text-[var(--ds-gray-700)] disabled:bg-[var(--ds-gray-100)] aria-disabled:text-[var(--ds-gray-700)] aria-disabled:bg-[var(--ds-gray-100)] disabled:![--themed-border:_var(--ds-gray-400)] [--x-padding:6px] [--height:32px] !pl-[var(--x-padding)] !pr-[var(--x-padding)] rounded-md text-(length:--geist-form-small-font) [--spinner-size:16px] data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_22%))] dark-theme:data-hover:bg-[var(--themed-hover-bg,_hsl(0,_0%,_80%))] data-hover:[--themed-border:var(--themed-hover-bg,_var(--ds-gray-200))] data-hover:disabled:bg-[var(--ds-gray-100)] animate-fade-in-scale h-8 w-8 p-0" data-geist-button="" data-prefix="false" data-suffix="false" data-version="v1" style="--geist-icon-size: 16px;"><span class="truncate px-1.5 inline-flex items-center justify-center shrink-0"><svg class="h-4 w-4" data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color: currentcolor;"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.70711 1.39644C8.31659 1.00592 7.68342 1.00592 7.2929 1.39644L2.21968 6.46966L1.68935 6.99999L2.75001 8.06065L3.28034 7.53032L7.25001 3.56065V14.25V15H8.75001V14.25V3.56065L12.7197 7.53032L13.25 8.06065L14.3107 6.99999L13.7803 6.46966L8.70711 1.39644Z" fill="currentColor"></path></svg></span></button></div></form></div></div>
  </div>
</div>
`

var captureDefaultRightSidebar = (sidebar) => {
  if (!(sidebar instanceof HTMLElement)) return
  if (sidebar.getAttribute('data-right-sidebar-mode') === 'ask-ai') return

  layoutSingleton.defaultRightSidebarState = sidebar.cloneNode(true)
}

var restoreDefaultRightSidebar = () => {
  var sidebar = document.getElementById('right-sidebar')
  var snapshot = layoutSingleton.defaultRightSidebarState

  if (!(sidebar instanceof HTMLElement) || !(snapshot instanceof HTMLElement)) return

  cloneAttributes(snapshot, sidebar)
  replaceChildrenFromClone(sidebar, snapshot)
  sidebar.setAttribute('data-right-sidebar-mode', 'default')

  var asideButtons = sidebar.querySelector('#aside-buttons')
  if (asideButtons && asideButtons.classList.contains('opacity-0')) {
    var tocContainer = sidebar.querySelector('#toc-container')
    if (tocContainer && tocContainer.childNodes.length > 0 && tocContainer.textContent?.trim() !== '') {
      asideButtons.classList.remove('opacity-0')
    }
  }
}

var openAskAiPanel = () => {
  var sidebar = document.getElementById('right-sidebar')
  if (!(sidebar instanceof HTMLElement)) return

  ensureAskAiLayoutStyle()
  closeHeaderNav()
  closeMobileHeaderMenu()
  closeMobileDocsNav()
  captureDefaultRightSidebar(sidebar)
  var pageContext = getAskAiPageContext()
  setElementContentFromHtml(sidebar, buildAskAiPanelContent(pageContext))
  sidebar.setAttribute('data-right-sidebar-mode', 'ask-ai')
  sidebar.style.setProperty('position', 'fixed', 'important')
  sidebar.style.setProperty('inset', '0 0 0 auto', 'important')
  sidebar.style.setProperty('top', '0', 'important')
  sidebar.style.setProperty('right', '0', 'important')
  sidebar.style.setProperty('bottom', '0', 'important')
  sidebar.style.setProperty('height', '100vh', 'important')
  sidebar.style.setProperty('margin-top', '0', 'important')
  sidebar.style.setProperty('margin-right', getAskAiPanelEdgeGap(), 'important')
  sidebar.style.setProperty('z-index', '6001', 'important')
  document.body.classList.add('ask-ai-panel-open')
  syncAskAiHeaderLayout(true)

  try {
    sessionStorage.setItem(AI_PANEL_STORAGE_KEY, 'true')
  } catch (_error) {}
}

var closeAskAiPanel = () => {
  restoreDefaultRightSidebar()
  document.body.classList.remove('ask-ai-panel-open')
  syncAskAiHeaderLayout(false)

  try {
    sessionStorage.setItem(AI_PANEL_STORAGE_KEY, 'false')
  } catch (_error) {}
}

var restoreAskAiPanelState = () => {
  try {
    if (sessionStorage.getItem(AI_PANEL_STORAGE_KEY) === 'true') {
      openAskAiPanel()
    }
  } catch (_error) {}
}

var LayoutInteractionsHook = {
  mounted() {
    ensureAskAiLayoutStyle()
    ensureHeaderNavLayoutStyle()

    var leftSidebar = document.getElementById('forensicNavAiSidebar')
    if (leftSidebar && localStorage.getItem('sidebar-collapsed') === 'true') {
      var btn = document.getElementById('sidebar-toggle-btn')
      var nav = document.getElementById('forensicNavAiSidebarNav')
      leftSidebar.setAttribute('data-collapsed', 'true')
      leftSidebar.style.width = '10px'
      if (btn) btn.setAttribute('aria-expanded', 'false')
      if (nav) {
        nav.style.opacity = '0'
        nav.style.pointerEvents = 'none'
        nav.style.visibility = 'hidden'
      }
    }

    restoreAskAiPanelState()
    syncMobileDocsNavTriggerState()
    syncMobileHeaderMenuTriggerState()
    populateMobileHeaderSections()
    applyThemeMode(getPreferredThemeMode())
    closeHeaderNav()

    if (!isMobileDocsViewport()) {
      closeMobileDocsNav()
    }

    this.onClick = (e) => {
      var btn = document.getElementById('menu-button-_r_11_')
      var menu = document.getElementById('avatar-menu')

      if (btn && menu) {
        var resetMenu = () => {
          var items = menu.querySelectorAll('a[data-geist-menu-item]')
          arrayForEach(items, function(item) { item.removeAttribute('data-selected') })
        }

        if (btn.contains(e.target)) {
          if (menu.hidden) {
            resetMenu()
            menu.hidden = false
          } else {
            menu.hidden = true
          }
        } else if (!menu.contains(e.target)) {
          menu.hidden = true
        }
      }

      var headerNavTrigger = e.target.closest('[data-header-nav-trigger]')
      if (headerNavTrigger && isDesktopHeaderNavViewport()) {
        e.preventDefault()
        openHeaderNav(headerNavTrigger.getAttribute('data-header-nav-trigger'))
        return
      }

      var headerNavRoot = getHeaderNavRoot()
      if (headerNavRoot && !headerNavRoot.contains(e.target)) {
        closeHeaderNav()
      }

      var mobileHeaderMenuToggle = e.target.closest('[data-mobile-header-menu-toggle="true"]')
      if (mobileHeaderMenuToggle) {
        e.preventDefault()
        toggleMobileHeaderMenu()
        return
      }

      var mobileHeaderMenuClose = e.target.closest('[data-mobile-header-menu-close="true"]')
      if (mobileHeaderMenuClose) {
        e.preventDefault()
        closeMobileHeaderMenu()
        return
      }

      var mobileHeaderSectionTrigger = e.target.closest('[data-mobile-header-section-trigger]')
      if (mobileHeaderSectionTrigger) {
        e.preventDefault()
        toggleMobileHeaderSection(mobileHeaderSectionTrigger.getAttribute('data-mobile-header-section-trigger'))
        return
      }

      var mobileHeaderMenuRoot = getMobileHeaderMenuRoot()
      if (mobileHeaderMenuRoot && document.body.classList.contains(HEADER_MOBILE_MENU_OPEN_CLASS)) {
        var clickedMobileHeaderLink = e.target.closest('#mobile-header-menu-panel a[href]')
        if (clickedMobileHeaderLink) {
          closeMobileHeaderMenu()
          return
        }
      }

      var mobileNavToggle = e.target.closest('[data-mobile-nav-toggle="true"]')
      if (mobileNavToggle) {
        e.preventDefault()
        toggleMobileDocsNav()
        return
      }

      var sidebarLink = e.target.closest('#forensicNavAiSidebar a[href]')
      if (sidebarLink && document.body.classList.contains(MOBILE_DOCS_NAV_OPEN_CLASS) && isMobileDocsViewport()) {
        closeMobileDocsNav()
      }

      var sidebarToggleBtn = e.target.closest('#sidebar-toggle-btn')
      if (sidebarToggleBtn) {
        e.preventDefault()
        var sidebar = document.getElementById('forensicNavAiSidebar')
        if (sidebar) {
          var nav = document.getElementById('forensicNavAiSidebarNav')
          var isCollapsed = sidebar.getAttribute('data-collapsed') === 'true'

          if (isCollapsed) {
            localStorage.setItem('sidebar-collapsed', 'false')
            sidebar.removeAttribute('data-collapsed')
            sidebarToggleBtn.setAttribute('aria-expanded', 'true')
            sidebar.style.width = '300px'
            if (nav) {
              nav.style.opacity = '1'
              nav.style.pointerEvents = 'auto'
              nav.style.visibility = 'visible'
            }
          } else {
            localStorage.setItem('sidebar-collapsed', 'true')
            sidebar.setAttribute('data-collapsed', 'true')
            sidebarToggleBtn.setAttribute('aria-expanded', 'false')
            sidebar.style.width = '10px'
            if (nav) {
              nav.style.opacity = '0'
              nav.style.pointerEvents = 'none'
              setTimeout(() => {
                if (sidebar.getAttribute('data-collapsed') === 'true') {
                  nav.style.visibility = 'hidden'
                }
              }, 300)
            }
          }
        }
      }

      var askAiToggle = e.target.closest('[data-ask-ai-toggle="true"]')
      if (askAiToggle) {
        e.preventDefault()
        openAskAiPanel()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }

      var removePageContextBtn = e.target.closest('[data-remove-page-context="true"]')
      if (removePageContextBtn) {
        e.preventDefault()
        e.stopPropagation()

        var wrapper = removePageContextBtn.closest('[data-page-context-wrapper="true"]')
        if (wrapper) {
          var composerContainer = wrapper.parentElement
          var composerPaddingBlock = wrapper.closest('.p-4')
          var suggestionsHost = composerPaddingBlock?.parentElement
          var existingSuggestions = suggestionsHost?.querySelector('[data-ask-ai-suggestions="true"]')

          wrapper.remove()

          if (composerPaddingBlock && suggestionsHost && !existingSuggestions) {
            composerPaddingBlock.before(fragmentFromHtml(buildAskAiSuggestionsContent()))
          }
        }
        return
      }

      var askAiClose = e.target.closest('[data-ask-ai-close="true"]')
      if (askAiClose) {
        e.preventDefault()
        closeAskAiPanel()
      }
    }

    this.onMouseOver = (e) => {
      var avatarMenu = document.getElementById('avatar-menu')
      var target = e.target.closest && e.target.closest('a[data-geist-menu-item]')
      if (avatarMenu && avatarMenu.contains(target) && target) {
        var items = avatarMenu.querySelectorAll('a[data-geist-menu-item]')
        arrayForEach(items, function(item) { item.removeAttribute('data-selected') })
        target.setAttribute('data-selected', '')
      }

      var headerNavTrigger = e.target.closest && e.target.closest('[data-header-nav-trigger]')
      if (headerNavTrigger && isDesktopHeaderNavViewport()) {
        openHeaderNav(headerNavTrigger.getAttribute('data-header-nav-trigger'))
      }

      var headerNavRegion = e.target.closest && e.target.closest('#forensic-main-nav')
      if (headerNavRegion) {
        clearHeaderNavCloseTimeout()
      }

      var headerNavDirectLink = e.target.closest && e.target.closest('#forensic-main-nav [data-direct-link]')
      if (headerNavDirectLink) {
        closeHeaderNav()
      }

      var hoverBtn =
        e.target.closest && e.target.closest('#menu-button-_r_11_, [data-geist-button], #sidebar-toggle-btn')
      if (hoverBtn) {
        hoverBtn.setAttribute('data-hover', 'true')
      }
    }

    this.onMouseOut = (e) => {
      var headerNavRoot = getHeaderNavRoot()
      if (headerNavRoot && headerNavRoot.contains(e.target) && !headerNavRoot.contains(e.relatedTarget)) {
        scheduleHeaderNavClose()
      }

      var hoverBtn =
        e.target.closest && e.target.closest('#menu-button-_r_11_, [data-geist-button], #sidebar-toggle-btn')
      if (hoverBtn && !hoverBtn.contains(e.relatedTarget)) {
        hoverBtn.removeAttribute('data-hover')
      }
    }

    this.onKeyDown = (e) => {
      if (e.key === 'Escape' && document.body.classList.contains(HEADER_MOBILE_MENU_OPEN_CLASS)) {
        closeMobileHeaderMenu()
        return
      }

      if (e.key === 'Escape' && document.body.classList.contains(MOBILE_DOCS_NAV_OPEN_CLASS)) {
        closeMobileDocsNav()
        return
      }

      if (e.key === 'Escape') {
        closeHeaderNav()
      }

      var isShortcut = (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key?.toLowerCase() === 'i'
      if (!isShortcut) return

      e.preventDefault()

      var sidebar = document.getElementById('right-sidebar')
      var isAskAiOpen = document.body.classList.contains('ask-ai-panel-open') ||
        sidebar?.getAttribute('data-right-sidebar-mode') === 'ask-ai'

      if (isAskAiOpen) {
        closeAskAiPanel()
      } else {
        openAskAiPanel()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    this.onResize = () => {
      if (!isMobileDocsViewport()) {
        closeMobileDocsNav()
      } else {
        syncMobileDocsNavTriggerState()
      }

      if (!isMobileHeaderMenuViewport()) {
        closeMobileHeaderMenu()
      } else {
        syncMobileHeaderMenuTriggerState()
      }

      var sidebar = document.getElementById('right-sidebar')
      var isAskAiOpen = document.body.classList.contains('ask-ai-panel-open') ||
        sidebar?.getAttribute('data-right-sidebar-mode') === 'ask-ai'

      if (!isDesktopHeaderNavViewport()) {
        closeHeaderNav()
      }

      if (sidebar instanceof HTMLElement && isAskAiOpen) {
        sidebar.style.setProperty('margin-right', getAskAiPanelEdgeGap(), 'important')
      }

      if (isDesktopHeaderNavViewport()) {
        var activeHeaderNavTrigger = getHeaderNavTriggers().find(
          (trigger) => trigger.getAttribute('aria-expanded') === 'true'
        )

        if (activeHeaderNavTrigger) {
          positionHeaderNavViewport(activeHeaderNavTrigger)
        }
      }
    }

    this.onChange = (e) => {
      if (e.target instanceof HTMLInputElement && e.target.matches('[data-theme-option]')) {
        applyThemeMode(e.target.value)
      }
    }

    document.addEventListener('click', this.onClick, true)
    document.addEventListener('mouseover', this.onMouseOver, true)
    document.addEventListener('mouseout', this.onMouseOut, true)
    document.addEventListener('keydown', this.onKeyDown, true)
    document.addEventListener('change', this.onChange, true)
    window.addEventListener('resize', this.onResize, { passive: true })
  },

  destroyed() {
    document.removeEventListener('click', this.onClick, true)
    document.removeEventListener('mouseover', this.onMouseOver, true)
    document.removeEventListener('mouseout', this.onMouseOut, true)
    document.removeEventListener('keydown', this.onKeyDown, true)
    document.removeEventListener('change', this.onChange, true)
    window.removeEventListener('resize', this.onResize)
  },
}

export default LayoutInteractionsHook
