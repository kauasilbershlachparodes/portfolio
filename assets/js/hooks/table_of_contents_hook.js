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
var MODULE_NAME = 'phoenix.table_of_contents_hook';

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
  headingSelector: 'h2, h3',
  linkSelector: 'a[data-toc-target-id]',
  buttonsId: 'aside-buttons',
  topOffset: 150
});


var DEFAULT_SCROLL_OPTIONS = Object.freeze({
  behavior: 'smooth',
  block: 'start'
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

function slugifyHeadingText(text) {
  return toStringValue(text)
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'section';
}

function getContentHeadings() {
  return arrayFilter(document.querySelectorAll(CONFIG.headingSelector), function(heading) {
    return heading instanceof HTMLElement && !heading.closest('aside') && !heading.closest('footer');
  });
}

function ensureHeadingId(heading, usedIds) {
  var existingId = heading.id || heading.querySelector('[id]')?.id;
  if (existingId) {
    if (!arrayIncludes(usedIds, existingId)) {
      usedIds.push(existingId);
    }

    if (!heading.id) {
      heading.id = existingId;
    }

    return existingId;
  }

  var baseId = slugifyHeadingText(heading.textContent);
  var nextId = baseId;
  var index = 2;

  while (arrayIncludes(usedIds, nextId) || document.getElementById(nextId)) {
    nextId = `${baseId}-${index}`;
    index += 1;
  }

  heading.id = nextId;
  usedIds.push(nextId);
  return nextId;
}

function createEmptyState() {
  var wrapper = document.createElement('div');
  wrapper.className = 'relative min-h-0 text-sm ms-px overflow-auto [scrollbar-width:none] mask-[linear-gradient(to_bottom,transparent,white_16px,white_calc(100%-16px),transparent)] py-3';

  var card = document.createElement('div');
  card.className = 'rounded-lg border bg-fd-card p-3 text-xs text-fd-muted-foreground';
  card.textContent = 'No Headings';

  wrapper.appendChild(card);
  return wrapper;
}

function createListItem(heading, targetId) {
  var listItem = document.createElement('li');
  var isPrimaryHeading = heading.tagName.toLowerCase() === 'h2';

  listItem.setAttribute('data-level', isPrimaryHeading ? '1' : '2');
  listItem.id = `toc_${targetId}`;
  listItem.className = [
    'relative py-1.5 pr-3 leading-[18px] text-sm transition-colors duration-160 h-[32px] flex items-center hover:text-gray-1000 text-gray-900',
    isPrimaryHeading ? 'pl-0' : 'pl-3'
  ].join(' ');

  var link = document.createElement('a');
  link.href = `#${targetId}`;
  link.dataset.zone = 'null';
  link.dataset.tocTargetId = targetId;
  link.className = 'link-module__Q1NRQq__link no-underline truncate w-full block';
  link.textContent = (heading.textContent || '').trim();

  listItem.appendChild(link);
  return listItem;
}

function findActiveHeading(headings) {
  if (!Array.isArray(headings) || headings.length === 0) {
    return null;
  }

  for (var index = headings.length - 1; index >= 0; index -= 1) {
    var rect = headings[index].getBoundingClientRect();
    if (rect.top <= CONFIG.topOffset) {
      return headings[index];
    }
  }

  return headings[0];
}

function revealAsideButtons() {
  var buttons = document.getElementById(CONFIG.buttonsId);
  if (buttons instanceof HTMLElement) {
    buttons.classList.remove('opacity-0');
  }
}

function updateActiveLinkState(root, activeHeading) {
  if (!(root instanceof HTMLElement)) {
    return;
  }

  var activeId = activeHeading instanceof HTMLElement ? activeHeading.id : '';

  arrayForEach(root.querySelectorAll('li[id^="toc_"]'), function(item) {
    if (!(item instanceof HTMLElement)) {
      return;
    }

    var isActive = item.id === `toc_${activeId}`;
    item.classList.toggle('text-gray-1000', isActive);
    item.classList.toggle('text-gray-900', !isActive);
  });
}

var TableOfContentsHook = {
  mounted() {
    if (!(this.el instanceof HTMLElement)) {
      return;
    }

    this.boundHeadings = [];
    this.buildToken = 0;

    this.onPageLoadingStop = () => {
      globalScope.setTimeout(() => this.buildTOC(), 100);
    };

    this.onClick = (event) => {
      var link = event.target instanceof Element
        ? event.target.closest(CONFIG.linkSelector)
        : null;

      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }

      event.preventDefault();

      var targetId = link.dataset.tocTargetId || '';
      var scrollTarget = document.getElementById(targetId);
      if (!(scrollTarget instanceof HTMLElement)) {
        return;
      }

      scrollTarget.scrollIntoView(shallowMerge(DEFAULT_SCROLL_OPTIONS, asObject({})));

      if (globalScope.history && typeof globalScope.history.pushState === 'function') {
        globalScope.history.pushState(null, '', `#${targetId}`);
      }
    };

    this.onScroll = () => {
      if (this.scrollFrameId) {
        return;
      }

      this.scrollFrameId = scheduleFrame(() => {
        updateActiveLinkState(this.el, findActiveHeading(this.boundHeadings));
        this.scrollFrameId = 0;
      });
    };

    this.el.addEventListener('click', this.onClick);
    globalScope.addEventListener('scroll', this.onScroll, { passive: true });
    globalScope.addEventListener('phx:page-loading-stop', this.onPageLoadingStop);

    this.buildTOC();
  },

  updated() {
    this.buildTOC();
  },

  destroyed() {
    if (this.el instanceof HTMLElement && this.onClick) {
      this.el.removeEventListener('click', this.onClick);
    }

    if (this.onScroll) {
      globalScope.removeEventListener('scroll', this.onScroll);
    }

    if (this.onPageLoadingStop) {
      globalScope.removeEventListener('phx:page-loading-stop', this.onPageLoadingStop);
    }

    cancelFrame(this.scrollFrameId);
  },

  buildTOC() {
    if (!(this.el instanceof HTMLElement)) {
      return;
    }

    this.buildToken += 1;
    var headings = getContentHeadings();
    var usedIds = [];
    var list = document.createElement('ul');
    list.className = 'mt-2 max-h-[calc(100vh-35vh)] relative overflow-y-auto';

    arrayForEach(headings, function(heading) {
      var targetId = ensureHeadingId(heading, usedIds);
      list.appendChild(createListItem(heading, targetId));
    });

    this.boundHeadings = headings;

    if (headings.length === 0) {
      this.el.replaceChildren(createEmptyState());
      revealAsideButtons();
      return;
    }

    this.el.replaceChildren(list);
    revealAsideButtons();
    this.onScroll?.();
  }
};

export default TableOfContentsHook;
