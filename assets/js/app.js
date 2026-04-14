/*PORTFOLIO_DO_KAUÃ_SILBERSHLACH_PARODES_SITE_OFICIAL*/
import "phoenix_html"
import { Socket } from "phoenix"
import { LiveSocket } from "phoenix_live_view"
import { hooks as colocatedHooks } from "phoenix-colocated/portfolio_live"
import topbar from "../vendor/topbar"
import ThemeHook from "./hooks/theme_hook"
import SidebarAccordionHook from "./hooks/sidebar_accordion_hook"
import SidebarActiveHook from "./hooks/sidebar_active_hook"
import TableOfContentsHook from "./hooks/table_of_contents_hook"
import LayoutInteractionsHook from "./hooks/layout_interactions_hook"

'use strict'

var detectedGlobalScope =
  typeof globalThis != 'undefined' ? globalThis :
  typeof global != 'undefined' ? global :
  typeof window != 'undefined' ? window :
  typeof this != 'undefined' ? this :
  typeof self != 'undefined' ? self :
  {}

var fallbackGlobalScope =
  typeof globalThis != 'undefined' && globalThis ||
  typeof self != 'undefined' && self ||
  typeof global != 'undefined' && global ||
  detectedGlobalScope

var globalScope = fallbackGlobalScope || detectedGlobalScope
var MODULE_NAME = 'phoenix.app'

function arraySlice(listLike) {
  return Array.prototype.slice.call(listLike || [])
}

function arrayForEach(listLike, iteratee, context) {
  Array.prototype.forEach.call(listLike || [], iteratee, context)
}

function arrayMap(listLike, iteratee, context) {
  return Array.prototype.map.call(listLike || [], iteratee, context)
}

function arrayFilter(listLike, iteratee, context) {
  return Array.prototype.filter.call(listLike || [], iteratee, context)
}

function arrayReduce(listLike, iteratee, initialValue) {
  if (arguments.length > 2) {
    return Array.prototype.reduce.call(listLike || [], iteratee, initialValue)
  }

  return Array.prototype.reduce.call(listLike || [], iteratee)
}

function isFiniteNumber(value) {
  return typeof Number !== 'undefined' && typeof Number.isFinite === 'function'
    ? Number.isFinite(value)
    : typeof value === 'number' && isFinite(value)
}

function parseInteger(value, fallbackValue) {
  var parsed = parseInt(value, 10)

  if (isFiniteNumber(parsed)) {
    return parsed
  }

  return arguments.length > 1 ? fallbackValue : 0
}

function arrayIncludes(listLike, searchValue) {
  return arrayReduce(listLike, function(found, value) {
    return found || value === searchValue
  }, false)
}
var APP_SINGLETON_KEY = '__PHOENIX_PORTFOLIO_APP_SINGLETON__'

function ensureAppSingleton() {
  if (globalScope[APP_SINGLETON_KEY]) {
    return globalScope[APP_SINGLETON_KEY]
  }

  var state = { initialized: false, liveSocket: null }

  try {
    Object.defineProperty(globalScope, APP_SINGLETON_KEY, {
      value: state,
      writable: false,
      configurable: true,
      enumerable: false
    })
  } catch (_error) {
    globalScope[APP_SINGLETON_KEY] = state
  }

  return state
}

var appSingleton = ensureAppSingleton()


function shallowMerge(base, patch) {
  var out = {}
  var key

  for (key in base) {
    if (Object.prototype.hasOwnProperty.call(base, key)) {
      out[key] = base[key]
    }
  }

  patch = patch || {}
  for (key in patch) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      out[key] = patch[key]
    }
  }

  return out
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function toStringValue(value) {
  if (value === null || value === undefined) {
    return ""
  }

  return String(value)
}

var APP_ACCESS_FALLBACK_MATRIX = Object.freeze({
  guest: Object.freeze(["publicContent"]),
  authenticatedUser: Object.freeze([
    "publicContent",
    "privateProducts",
    "payment",
    "manageOwnAccount"
  ])
})

var APP_ACCESS_PUBLIC_CONTENT_ROUTES = Object.freeze(["home"])
var APP_ACCESS_MFA_REQUIRED_ROUTES = Object.freeze(["/panel", "/forensics"])

var APP_ACCESS_FALLBACK_ROUTE_RESOURCES = Object.freeze({
  "/": "publicContent",
  "/nirsfot-tools-freeware": "publicContent",
  "/all-utilities": "privateProducts",
  "/password-tools": "privateProducts",
  "/system-tools": "privateProducts",
  "/browser-tools": "privateProducts",
  "/programmer-tools": "privateProducts",
  "/network-tools": "privateProducts",
  "/outlook-office": "privateProducts",
  "/64-bit-download": "privateProducts",
  "/panel": "privateProducts",
  "/forensics": "privateProducts",
  "/pre-release-tools": "privateProducts"
})

var APP_ACCESS_LEGACY_ROLE_STORAGE_KEY = "illuminati-access-role"
var APP_ACCESS_LEGACY_EMAIL_STORAGE_KEY = "illuminati-authenticated-email"
var APP_ACCESS_LEGACY_RECOVERY_EMAIL_STORAGE_KEY = "illuminati-recovery-email"
var APP_ACCESS_AUTH_AAL_STORAGE_KEY = "illuminati-auth-aal"
var APP_ACCESS_MFA_VERIFIED_STORAGE_KEY = "illuminati-mfa-verified"
var APP_ACCESS_SUPABASE_PROJECT_REF = "yeuojewjvyfxcxqzxnpc"
var APP_ACCESS_SUPABASE_STORAGE_KEY = `sb-${APP_ACCESS_SUPABASE_PROJECT_REF}-auth-token`
var APP_ACCESS_SESSION_SYNC_ENDPOINT = "/auth/session"
var APP_ACCESS_CSRF_REFRESH_ENDPOINT = "/auth/csrf-token"
var APP_ACCESS_LOGOUT_ENDPOINT = "/logout"
var APP_ACCESS_SYNC_ATTEMPT_KEY = "illuminati-auth-session-sync-attempted"
var APP_ACCESS_LEGACY_STORAGE_KEYS = Object.freeze([
  APP_ACCESS_LEGACY_ROLE_STORAGE_KEY,
  APP_ACCESS_LEGACY_EMAIL_STORAGE_KEY,
  APP_ACCESS_LEGACY_RECOVERY_EMAIL_STORAGE_KEY
])

var csrfToken = document
  .querySelector("meta[name='csrf-token']")
  ?.getAttribute("content") || ""

var Hooks = {
  ...colocatedHooks,
  ThemeHook,
  SidebarAccordionHook,
  SidebarActiveHook,
  TableOfContentsHook,
  LayoutInteractionsHook
}

function normalizeRole(role) {
  var normalized = toStringValue(role || "guest").trim().toLowerCase()

  switch (normalized) {
    case "authenticateduser":
    case "authenticated_user":
    case "authenticated-user":
    case "user":
    case "member":
      return "authenticatedUser"

    case "guest":
    default:
      return "guest"
  }
}

function normalizePath(path) {
  var raw = toStringValue(path || "/").trim()
  var withoutQuery = (raw.split(/[?#]/, 1)[0] || "/").trim()
  var withLeadingSlash = withoutQuery.startsWith("/")
    ? withoutQuery
    : `/${withoutQuery}`

  if (withLeadingSlash === "") {
    return "/"
  }

  var collapsed = withLeadingSlash.replace(/\/+/g, "/")
  return collapsed !== "/" ? collapsed.replace(/\/+$/, "") : "/"
}

function safeReturnTo(current = `${window.location.pathname}${window.location.search}`) {
  var raw = toStringValue(current || "").trim()

  if (!raw || raw === "nil" || raw.startsWith("//") || /[\r\n]/.test(raw)) {
    return "/"
  }

  if (/^[a-z][a-z0-9+\-.]*:/i.test(raw)) {
    return "/"
  }

  return raw.startsWith("/") ? raw : "/"
}

function looksLikeRecoveryFragment(hash) {
  var raw = toStringValue(hash || "").trim()
  return Boolean(
    raw && (
      raw.indexOf("type=recovery") >= 0 ||
      (raw.indexOf("access_token=") >= 0 && raw.indexOf("refresh_token=") >= 0)
    )
  )
}

function redirectRecoveryFragmentIfNeeded() {
  if (typeof window === "undefined") {
    return false
  }

  var hash = toStringValue(window.location.hash || "")
  if (!looksLikeRecoveryFragment(hash)) {
    return false
  }

  var pathname = normalizePath(window.location.pathname || "/")
  if (pathname === "/reset-password") {
    return false
  }

  window.location.replace(`/reset-password${hash}`)
  return true
}

function uniqueStrings(values) {
  return arrayReduce(asArray(values), function(accumulator, value) {
    var normalized = toStringValue(value).trim()

    if (normalized && !arrayIncludes(accumulator, normalized)) {
      accumulator.push(normalized)
    }

    return accumulator
  }, [])
}

function parseJsonValue(rawValue, fallbackValue = {}) {
  if (!rawValue || typeof rawValue !== "string") {
    return fallbackValue
  }

  try {
    var parsed = JSON.parse(rawValue)
    return parsed && typeof parsed === "object" ? parsed : fallbackValue
  } catch (_error) {
    return fallbackValue
  }
}

function cloneMatrix(matrix) {
  var base = asObject(matrix)

  return Object.freeze({
    guest: Object.freeze(
      uniqueStrings(base.guest && base.guest.length ? base.guest : APP_ACCESS_FALLBACK_MATRIX.guest)
    ),
    authenticatedUser: Object.freeze(
      uniqueStrings(
        base.authenticatedUser && base.authenticatedUser.length
          ? base.authenticatedUser
          : APP_ACCESS_FALLBACK_MATRIX.authenticatedUser
      )
    )
  })
}

function readLocalStorageValue(key) {
  try {
    return window.localStorage.getItem(key)
  } catch (_error) {
    return null
  }
}

function writeLocalStorageValue(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch (_error) {
    // no-op
  }
}

function removeLocalStorageValue(key) {
  try {
    window.localStorage.removeItem(key)
  } catch (_error) {
    // no-op
  }
}

function readSessionStorageValue(key) {
  try {
    return window.sessionStorage.getItem(key)
  } catch (_error) {
    return null
  }
}

function writeSessionStorageValue(key, value) {
  try {
    window.sessionStorage.setItem(key, value)
  } catch (_error) {
    // no-op
  }
}

function removeSessionStorageValue(key) {
  try {
    window.sessionStorage.removeItem(key)
  } catch (_error) {
    // no-op
  }
}

function clearSupabaseAuthStorage(storage) {
  if (!storage) {
    return
  }

  try {
    var keys = Object.keys(storage)
    arrayForEach(keys, function(key) {
      if (/^sb-.*-auth-token$/.test(toStringValue(key))) {
        storage.removeItem(key)
      }
    })
  } catch (_error) {
    // no-op
  }
}

function clearBrowserAuthState() {
  clearSupabaseAuthStorage(window.localStorage)
  clearSupabaseAuthStorage(window.sessionStorage)
  cleanupLegacyPersistentAuthMetadata()
  clearMfaState()
  removeSessionStorageValue(APP_ACCESS_SYNC_ATTEMPT_KEY)
}

function setBootstrappedCurrentRole(role) {
  if (!document.body) {
    return
  }

  var payload = getBootstrappedAccessControl()
  payload.currentRole = normalizeRole(role)
  document.body.setAttribute("data-access-control", JSON.stringify(payload))
  document.body.setAttribute("data-auth-role", payload.currentRole)
}

function applyLoggedOutUiState(options) {
  var shouldRemount = !(options && options.remount === false)

  clearBrowserAuthState()
  setBootstrappedCurrentRole("guest")

  if (shouldRemount) {
    mountAppAccessControl()
  }
}

function getLogoutCsrfToken(form) {
  var fieldValue = toStringValue(
    form?.querySelector('input[name="_csrf_token"]')?.value || ""
  ).trim()

  return fieldValue || csrfToken
}

function updateCsrfTokenState(nextToken) {
  var normalized = toStringValue(nextToken).trim()

  if (!normalized) {
    return ""
  }

  csrfToken = normalized

  var metaTag = document.querySelector("meta[name='csrf-token']")
  if (metaTag) {
    metaTag.setAttribute("content", normalized)
  }

  arrayForEach(document.querySelectorAll('form[data-logout-form] input[name="_csrf_token"]'), function(field) {
    field.value = normalized
  })

  return normalized
}

async function refreshCsrfToken() {
  try {
    var response = await fetch(APP_ACCESS_CSRF_REFRESH_ENDPOINT, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-requested-with": "XMLHttpRequest"
      },
      credentials: "same-origin",
      cache: "no-store"
    })

    if (!response.ok) {
      return ""
    }

    var payload = await response.json().catch(function() { return {} })
    var nextToken = toStringValue(payload?.csrf_token || "").trim()
    return updateCsrfTokenState(nextToken)
  } catch (_error) {
    return ""
  }
}

function setLogoutFormPending(form, pending) {
  if (!(form instanceof HTMLFormElement)) {
    return
  }

  if (pending) {
    form.setAttribute("data-logout-pending", "true")
  } else {
    form.removeAttribute("data-logout-pending")
  }

  arrayForEach(
    form.querySelectorAll('button[type="submit"], input[type="submit"]'),
    function(control) {
      control.disabled = pending
    }
  )
}

function encodeFormBody(params) {
  var searchParams = new URLSearchParams()

  Object.keys(params || {}).forEach(function(key) {
    var value = toStringValue(params[key]).trim()
    if (value) {
      searchParams.append(key, value)
    }
  })

  return searchParams.toString()
}

function resolvePostLogoutLocation(controller = globalScope.AppAccessControl) {
  var currentPath = normalizePath(window.location.pathname || "/")
  var currentLocation = safeReturnTo(`${currentPath}${window.location.search || ""}`)

  return isPublicContentRoute(currentPath, controller) || !getResourceForPath(currentPath, controller)
    ? currentLocation
    : "/"
}

async function ensureServerSessionForLogout() {
  var session = extractSupabaseSession()

  if (!hasUnexpiredAccessToken(session)) {
    return { ok: false, reason: "no_browser_session", csrf: await refreshCsrfToken() }
  }

  var csrf = await refreshCsrfToken() || csrfToken
  if (!csrf) {
    return { ok: false, reason: "missing_csrf", csrf: "" }
  }

  try {
    var response = await fetch(APP_ACCESS_SESSION_SYNC_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "x-csrf-token": csrf,
        "x-requested-with": "XMLHttpRequest"
      },
      credentials: "same-origin",
      body: JSON.stringify({
        access_token: session.access_token,
        return_to: safeReturnTo()
      })
    })

    var payload = await response.json().catch(function() { return {} })

    if (!response.ok || payload?.ok === false) {
      return { ok: false, reason: payload?.error || "session_sync_failed", csrf: csrf }
    }

    return {
      ok: true,
      csrf: updateCsrfTokenState(payload?.csrf_token || "") || csrf,
      payload: payload
    }
  } catch (_error) {
    return { ok: false, reason: "session_sync_failed", csrf: csrf }
  }
}

async function performLogoutRequest(action, csrf) {
  var response = await fetch(action, {
    method: "DELETE",
    headers: {
      accept: "text/html,application/xhtml+xml",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-csrf-token": csrf,
      "x-requested-with": "XMLHttpRequest"
    },
    credentials: "same-origin",
    body: encodeFormBody({ _csrf_token: csrf })
  })

  var contentType = toStringValue(response.headers.get("content-type") || "").toLowerCase()
  var payload = contentType.includes("application/json")
    ? await response.json().catch(function() { return {} })
    : { redirect_to: response.redirected ? response.url : "" }

  return { response: response, payload: payload }
}

async function submitLogoutForm(form) {
  if (!(form instanceof HTMLFormElement)) {
    return
  }

  if (form.getAttribute("data-logout-pending") === "true") {
    return
  }

  var action = normalizePath(form.getAttribute("action") || "/logout")
  var logoutEndpoint = normalizePath(APP_ACCESS_LOGOUT_ENDPOINT || action || "/auth/logout")
  var controller = globalScope.AppAccessControl || mountAppAccessControl()

  setLogoutFormPending(form, true)

  try {
    var csrf = await refreshCsrfToken() || getLogoutCsrfToken(form)

    if (!csrf) {
      var bootstrapped = await ensureServerSessionForLogout()
      csrf = bootstrapped.csrf || ""
    }

    var logoutAttempt = csrf
      ? await performLogoutRequest(logoutEndpoint, csrf)
      : { response: { ok: false, status: 0 }, payload: {} }

    if (!logoutAttempt.response.ok) {
      var recovery = await ensureServerSessionForLogout()
      var retryCsrf = recovery.csrf || csrf

      if (retryCsrf) {
        logoutAttempt = await performLogoutRequest(logoutEndpoint, retryCsrf)
      }
    }

    if (!logoutAttempt.response.ok) {
      console.warn("Logout request failed; preserving authenticated UI state.")
      mountAppAccessControl()
      return
    }

    var postLogoutController = Object.freeze({
      ...(controller || {}),
      currentRole: "guest",
      serverRole: "guest",
      browserSessionPresent: false,
      browserSessionActive: false,
      allowedResources: Object.freeze(uniqueStrings((controller?.matrix || APP_ACCESS_FALLBACK_MATRIX).guest || []))
    })

    var redirectTo = safeReturnTo(
      toStringValue(logoutAttempt.payload?.redirect_to || "").trim() ||
      resolvePostLogoutLocation(postLogoutController)
    )

    applyLoggedOutUiState({ remount: false })
    window.location.replace(redirectTo || "/")
  } catch (_error) {
    mountAppAccessControl()
  } finally {
    setLogoutFormPending(form, false)
  }
}

function cleanupLegacyPersistentAuthMetadata() {
  arrayForEach(APP_ACCESS_LEGACY_STORAGE_KEYS, function(key) {
    removeLocalStorageValue(key)
    removeSessionStorageValue(key)
  })
}

function getBootstrappedAccessControl() {
  var bodyPayload = document.body?.getAttribute("data-access-control")
  return parseJsonValue(bodyPayload, {})
}

function getSupabaseSessionRecord() {
  var raw = readLocalStorageValue(APP_ACCESS_SUPABASE_STORAGE_KEY)

  if (!raw) {
    return null
  }

  var parsed = parseJsonValue(raw, null)
  if (parsed) {
    return parsed
  }

  return typeof raw === "string" && /access_token|refresh_token/.test(raw)
    ? { access_token: raw }
    : null
}

function extractSupabaseSession(record = getSupabaseSessionRecord()) {
  if (!record || typeof record !== "object") {
    return null
  }

  if (record.currentSession && typeof record.currentSession === "object") {
    return record.currentSession
  }

  if (record.session && typeof record.session === "object") {
    return record.session
  }

  if (record.access_token || record.refresh_token || record.user) {
    return record
  }

  if (Array.isArray(record)) {
    var compositeToken = record.find(value => typeof value === "string" && value.length > 20)
    return compositeToken ? { access_token: compositeToken } : null
  }

  return null
}

function hasSupabaseBrowserSession() {
  var session = extractSupabaseSession()
  return Boolean(session?.access_token)
}

function decodeJwtPayload(token) {
  if (typeof token !== "string") {
    return {}
  }

  var parts = token.split(".")
  if (parts.length < 2) {
    return {}
  }

  try {
    var normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    var paddingLength = (4 - (normalized.length % 4)) % 4
    var padded = `${normalized}${"=".repeat(paddingLength)}`
    var decoded = window.atob(padded)
    var bytes = Uint8Array.from(arrayMap(decoded, function(char) { return char.charCodeAt(0) }))
    var utf8 = new TextDecoder().decode(bytes)
    var claims = JSON.parse(utf8)
    return claims && typeof claims === "object" ? claims : {}
  } catch (_error) {
    return {}
  }
}

function getAuthenticatorAssuranceLevel(session = extractSupabaseSession()) {
  var claims = decodeJwtPayload(session?.access_token || "")
  return String(claims?.aal || "aal1").trim().toLowerCase() === "aal2" ? "aal2" : "aal1"
}

function hasUnexpiredAccessToken(session = extractSupabaseSession()) {
  var token = toStringValue(session?.access_token || "").trim()

  if (!token || token.split(".").length < 2) {
    return false
  }

  var claims = decodeJwtPayload(token)
  var keys = claims && typeof claims === "object" ? Object.keys(claims) : []
  if (!keys.length) {
    return false
  }

  var exp = parseInteger(claims.exp, 0)
  if (!exp) {
    return true
  }

  var now = Math.floor(Date.now() / 1000)
  return exp > now + 30
}

function isMfaVerified(session = extractSupabaseSession()) {
  return getAuthenticatorAssuranceLevel(session) === "aal2"
}

function rememberMfaState(payload = {}) {
  var aal = toStringValue(payload?.auth_aal || payload?.aal || "").trim().toLowerCase()

  if (aal) {
    writeSessionStorageValue(APP_ACCESS_AUTH_AAL_STORAGE_KEY, aal === "aal2" ? "aal2" : "aal1")
  }

  if (typeof payload?.mfa_verified === "boolean") {
    writeSessionStorageValue(APP_ACCESS_MFA_VERIFIED_STORAGE_KEY, payload.mfa_verified ? "1" : "0")
  }
}

function clearMfaState() {
  removeSessionStorageValue(APP_ACCESS_AUTH_AAL_STORAGE_KEY)
  removeSessionStorageValue(APP_ACCESS_MFA_VERIFIED_STORAGE_KEY)
}

function readRememberedAal() {
  return readSessionStorageValue(APP_ACCESS_AUTH_AAL_STORAGE_KEY) === "aal2" ? "aal2" : "aal1"
}

function resolveBrowserRole(preferredRole) {
  return normalizeRole(preferredRole)
}

function resolveAccessControlSnapshot() {
  var bootstrapped = getBootstrappedAccessControl()
  var serverRole = normalizeRole(bootstrapped.currentRole)
  var browserSessionPresent = hasSupabaseBrowserSession()
  var browserSessionActive = browserSessionPresent ? hasUnexpiredAccessToken() : false
  var currentRole = serverRole === "authenticatedUser" && (!browserSessionPresent || browserSessionActive)
    ? "authenticatedUser"
    : "guest"

  var matrix = cloneMatrix(APP_ACCESS_FALLBACK_MATRIX)
  var publicContentRoutes = Object.freeze(uniqueStrings(APP_ACCESS_PUBLIC_CONTENT_ROUTES))
  var sidebarRouteResources = Object.freeze({ ...APP_ACCESS_FALLBACK_ROUTE_RESOURCES })
  var allowedResources = Object.freeze(uniqueStrings(matrix[currentRole] || matrix.guest))

  return {
    matrix,
    currentRole,
    publicContentRoutes,
    sidebarRouteResources,
    allowedResources,
    serverRole,
    browserSessionPresent,
    browserSessionActive
  }
}

function getResourceForPath(path, controller = globalScope.AppAccessControl) {
  var normalizedPath = normalizePath(path)
  return controller?.sidebarRouteResources?.[normalizedPath] || null
}

function canAccessResource(resource, controller = globalScope.AppAccessControl) {
  var normalized = toStringValue(resource || "").trim()
  return Boolean(normalized && arrayIncludes(controller && controller.allowedResources, normalized))
}

function canAccessSidebarRoute(path, controller = globalScope.AppAccessControl) {
  var resource = getResourceForPath(path, controller)
  return Boolean(resource && canAccessResource(resource, controller))
}

function isPublicContentRoute(path, controller = globalScope.AppAccessControl) {
  var normalizedPath = normalizePath(path)
  var routeName = normalizedPath === "/"
    ? "home"
    : normalizedPath.replace(/^\//, "")

  return Boolean(arrayIncludes(controller && controller.publicContentRoutes, routeName))
}

function isMfaProtectedRoute(path = window.location.pathname) {
  return arrayIncludes(APP_ACCESS_MFA_REQUIRED_ROUTES, normalizePath(path))
}

function applyAccessToElement(element, controller = window.AppAccessControl) {
  if (!element) {
    return
  }

  var explicitSidebarPath = element.getAttribute("data-sidebar-route")
  var path = element.getAttribute("data-access-path")
    || explicitSidebarPath
    || element.getAttribute("href")

  var normalizedPath = path ? normalizePath(path) : null
  var resource = element.getAttribute("data-access-resource")
  var mfaLocked = Boolean(
    explicitSidebarPath &&
    controller?.currentRole === "authenticatedUser" &&
    arrayIncludes(APP_ACCESS_MFA_REQUIRED_ROUTES, normalizedPath) &&
    !isMfaVerified()
  )
  var allowed = resource
    ? canAccessResource(resource, controller)
    : normalizedPath
      ? canAccessSidebarRoute(normalizedPath, controller)
      : true

  if (explicitSidebarPath && element.tagName === "A") {
    if (allowed && !mfaLocked) {
      element.setAttribute("href", normalizedPath)
      element.removeAttribute("aria-disabled")
      element.removeAttribute("tabindex")
      element.removeAttribute("data-locked-subitem")
      element.style.pointerEvents = ""
      element.style.cursor = ""
      element.removeAttribute("data-mfa-required")
    } else if (mfaLocked) {
      element.setAttribute("href", `/login?mfa=required&return_to=${encodeURIComponent(normalizedPath)}`)
      element.style.pointerEvents = ""
      element.style.cursor = ""
      element.removeAttribute("aria-disabled")
      element.removeAttribute("tabindex")
      element.setAttribute("data-mfa-required", "true")
    } else {
      element.removeAttribute("href")
      element.setAttribute("data-locked-subitem", "true")
      element.setAttribute("aria-disabled", "true")
      element.setAttribute("tabindex", "-1")
      element.style.pointerEvents = "none"
      element.style.cursor = "default"
      element.removeAttribute("data-mfa-required")
    }
  }

  if (resource || element.hasAttribute("data-access-path")) {
    element.hidden = !allowed
    element.setAttribute("aria-hidden", allowed ? "false" : "true")

    if (!allowed) {
      element.setAttribute("data-access-hidden", "true")
    } else {
      element.removeAttribute("data-access-hidden")
    }
  }
}

function syncAccessControlledElements(root = document, controller = globalScope.AppAccessControl) {
  if (!root?.querySelectorAll) {
    return
  }

  arrayForEach(root.querySelectorAll("[data-access-path], [data-sidebar-route], [data-access-resource]"), function(element) {
    applyAccessToElement(element, controller)
  })
}

async function syncServerSessionFromBrowser(controller) {
  var syncAttemptKey = `${APP_ACCESS_SYNC_ATTEMPT_KEY}:${window.location.pathname}`

  if (controller?.currentRole === "authenticatedUser") {
    removeSessionStorageValue(syncAttemptKey)
    return controller
  }

  if (readSessionStorageValue(syncAttemptKey) === "1") {
    return controller
  }

  var session = extractSupabaseSession()
  if (!hasUnexpiredAccessToken(session) || !csrfToken) {
    return controller
  }

  writeSessionStorageValue(syncAttemptKey, "1")

  try {
    var response = await fetch(APP_ACCESS_SESSION_SYNC_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "x-csrf-token": csrfToken
      },
      credentials: "same-origin",
      body: JSON.stringify({
        access_token: session.access_token,
        return_to: safeReturnTo()
      })
    })

    var contentType = response.headers.get("content-type") || ""
    var payload = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : { error: await response.text().catch(() => "") }

    if (!response.ok || payload?.ok === false) {
      removeSessionStorageValue(syncAttemptKey)
      clearMfaState()
      return controller
    }

    updateCsrfTokenState(payload?.csrf_token || "")
    rememberMfaState(payload)
    window.location.reload()
  } catch (_error) {
    removeSessionStorageValue(syncAttemptKey)
    clearMfaState()
  }

  return controller
}

function enforceMfaForProtectedRoutes(controller = globalScope.AppAccessControl) {
  if (controller?.currentRole !== "authenticatedUser") {
    return false
  }

  if (!isMfaProtectedRoute()) {
    return false
  }

  var session = extractSupabaseSession()
  var aal = session?.access_token
    ? getAuthenticatorAssuranceLevel(session)
    : readRememberedAal()

  if (aal === "aal2") {
    return false
  }

  var next = encodeURIComponent(safeReturnTo())
  window.location.replace(`/login?mfa=required&return_to=${next}`)
  return true
}

function mountAppAccessControl() {
  var snapshot = resolveAccessControlSnapshot()

  var controller = Object.freeze({
    ...snapshot,
    normalizeRole,
    normalizePath,
    getResourceForPath: path => getResourceForPath(path, controller),
    canAccessResource: resource => canAccessResource(resource, controller),
    canAccessSidebarRoute: path => canAccessSidebarRoute(path, controller),
    isPublicContentRoute: path => isPublicContentRoute(path, controller),
    isMfaProtectedRoute: path => isMfaProtectedRoute(path),
    sync: root => syncAccessControlledElements(root, controller),
    refresh: () => mountAppAccessControl()
  })

  globalScope.AppAccessControl = controller

  try {
    globalScope.__APP_ACCESS_CONTROL__ = Object.freeze({
      currentRole: snapshot.currentRole,
      serverRole: snapshot.serverRole,
      browserSessionActive: snapshot.browserSessionActive
    })
  } catch (_error) {
    globalScope.__APP_ACCESS_CONTROL__ = {
      currentRole: snapshot.currentRole,
      serverRole: snapshot.serverRole,
      browserSessionActive: snapshot.browserSessionActive
    }
  }
  globalScope.AppAuth = Object.freeze({
    getAuthenticatorAssuranceLevel,
    isMfaVerified,
    isMfaProtectedRoute,
    safeReturnTo
  })

  if (document.body) {
    document.body.setAttribute("data-auth-role", controller.currentRole)
    document.body.setAttribute(
      "data-auth-aal",
      hasSupabaseBrowserSession() ? getAuthenticatorAssuranceLevel() : readRememberedAal()
    )
  }

  controller.sync(document)
  globalScope.dispatchEvent(new CustomEvent("app-access-control:synced", { detail: controller }))

  globalScope.dispatchEvent(
    new CustomEvent("app-access-control:ready", {
      detail: {
        currentRole: controller.currentRole,
        allowedResources: controller.allowedResources,
        publicContentRoutes: controller.publicContentRoutes,
        authAal: hasSupabaseBrowserSession() ? getAuthenticatorAssuranceLevel() : readRememberedAal()
      }
    })
  )

  if (enforceMfaForProtectedRoutes(controller)) {
    return controller
  }

  if (controller.currentRole === "guest" && controller.browserSessionActive) {
    void syncServerSessionFromBrowser(controller)
  }

  return controller
}

var liveSocket = new LiveSocket("/live", Socket, {
  longPollFallbackMs: 2500,
  params: { _csrf_token: csrfToken },
  hooks: Hooks,
})

function bindLogoutCleanup() {
  if (document.documentElement?.hasAttribute("data-logout-cleanup-bound")) {
    return
  }

  document.documentElement?.setAttribute("data-logout-cleanup-bound", "true")

  document.addEventListener("submit", function(event) {
    var target = event.target
    if (!(target instanceof HTMLFormElement)) {
      return
    }

    var action = normalizePath(target.getAttribute("action") || "")
    if (target.hasAttribute("data-logout-form") || action === "/logout") {
      event.preventDefault()
      void submitLogoutForm(target)
    }
  }, true)
}

function bootstrapApp() {
  if (redirectRecoveryFragmentIfNeeded()) {
    return
  }

  topbar.config({ barColors: { 0: "#29d" }, shadowColor: "rgba(0, 0, 0, .3)" })

  globalScope.addEventListener("phx:page-loading-start", () => topbar.show(300))
  globalScope.addEventListener("phx:page-loading-stop", () => {
    topbar.hide()
    mountAppAccessControl()
  })

  cleanupLegacyPersistentAuthMetadata()
  bindLogoutCleanup()
  mountAppAccessControl()
  liveSocket.connect()

  appSingleton.liveSocket = liveSocket
  globalScope.liveSocket = liveSocket

  if (process.env.NODE_ENV === "development") {
    globalScope.addEventListener("phx:live_reload:attached", ({ detail: reloader }) => {
      reloader.enableServerLogs()

      var keyDown
      globalScope.addEventListener("keydown", e => keyDown = e.key)
      globalScope.addEventListener("keyup", _e => keyDown = null)
      globalScope.addEventListener("click", e => {
        if (keyDown === "c") {
          e.preventDefault()
          e.stopImmediatePropagation()
          reloader.openEditorAtCaller(e.target)
        } else if (keyDown === "d") {
          e.preventDefault()
          e.stopImmediatePropagation()
          reloader.openEditorAtDef(e.target)
        }
      }, true)

      globalScope.liveReloader = reloader
    })
  }
}

if (!appSingleton.initialized) {
  appSingleton.initialized = true
  bootstrapApp()
} else if (appSingleton.liveSocket) {
  globalScope.liveSocket = appSingleton.liveSocket
  mountAppAccessControl()
}
