"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/zustand";
exports.ids = ["vendor-chunks/zustand"];
exports.modules = {

/***/ "(ssr)/./node_modules/zustand/esm/index.mjs":
/*!********************************************!*\
  !*** ./node_modules/zustand/esm/index.mjs ***!
  \********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   create: () => (/* binding */ create),\n/* harmony export */   createStore: () => (/* reexport safe */ zustand_vanilla__WEBPACK_IMPORTED_MODULE_0__.createStore),\n/* harmony export */   \"default\": () => (/* binding */ react),\n/* harmony export */   useStore: () => (/* binding */ useStore)\n/* harmony export */ });\n/* harmony import */ var zustand_vanilla__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! zustand/vanilla */ \"(ssr)/./node_modules/zustand/esm/vanilla.mjs\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"(ssr)/./node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js\");\n/* harmony import */ var use_sync_external_store_shim_with_selector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! use-sync-external-store/shim/with-selector.js */ \"(ssr)/./node_modules/use-sync-external-store/shim/with-selector.js\");\n\n\n\n\n\nconst { useDebugValue } = react__WEBPACK_IMPORTED_MODULE_1__;\nconst { useSyncExternalStoreWithSelector } = use_sync_external_store_shim_with_selector_js__WEBPACK_IMPORTED_MODULE_2__;\nlet didWarnAboutEqualityFn = false;\nconst identity = (arg) => arg;\nfunction useStore(api, selector = identity, equalityFn) {\n  if (( false ? 0 : void 0) !== \"production\" && equalityFn && !didWarnAboutEqualityFn) {\n    console.warn(\n      \"[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937\"\n    );\n    didWarnAboutEqualityFn = true;\n  }\n  const slice = useSyncExternalStoreWithSelector(\n    api.subscribe,\n    api.getState,\n    api.getServerState || api.getInitialState,\n    selector,\n    equalityFn\n  );\n  useDebugValue(slice);\n  return slice;\n}\nconst createImpl = (createState) => {\n  if (( false ? 0 : void 0) !== \"production\" && typeof createState !== \"function\") {\n    console.warn(\n      \"[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`.\"\n    );\n  }\n  const api = typeof createState === \"function\" ? (0,zustand_vanilla__WEBPACK_IMPORTED_MODULE_0__.createStore)(createState) : createState;\n  const useBoundStore = (selector, equalityFn) => useStore(api, selector, equalityFn);\n  Object.assign(useBoundStore, api);\n  return useBoundStore;\n};\nconst create = (createState) => createState ? createImpl(createState) : createImpl;\nvar react = (createState) => {\n  if (( false ? 0 : void 0) !== \"production\") {\n    console.warn(\n      \"[DEPRECATED] Default export is deprecated. Instead use `import { create } from 'zustand'`.\"\n    );\n  }\n  return create(createState);\n};\n\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvenVzdGFuZC9lc20vaW5kZXgubWpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBOEM7QUFDZDtBQUNDO0FBQ3VEOztBQUV4RixRQUFRLGdCQUFnQixFQUFFLGtDQUFZO0FBQ3RDLFFBQVEsbUNBQW1DLEVBQUUsMEVBQTJCO0FBQ3hFO0FBQ0E7QUFDQTtBQUNBLE9BQU8sTUFBZSxHQUFHLENBQW9CO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxNQUFlLEdBQUcsQ0FBb0I7QUFDN0M7QUFDQSwyR0FBMkcsV0FBVztBQUN0SDtBQUNBO0FBQ0Esa0RBQWtELDREQUFXO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sTUFBZSxHQUFHLENBQW9CO0FBQzdDO0FBQ0Esd0VBQXdFLFNBQVM7QUFDakY7QUFDQTtBQUNBO0FBQ0E7O0FBRThDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vdG0tcmFuZG9tLXdlYi1hcHAvLi9ub2RlX21vZHVsZXMvenVzdGFuZC9lc20vaW5kZXgubWpzPzQ1MGUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlU3RvcmUgfSBmcm9tICd6dXN0YW5kL3ZhbmlsbGEnO1xuZXhwb3J0ICogZnJvbSAnenVzdGFuZC92YW5pbGxhJztcbmltcG9ydCBSZWFjdEV4cG9ydHMgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHVzZVN5bmNFeHRlcm5hbFN0b3JlRXhwb3J0cyBmcm9tICd1c2Utc3luYy1leHRlcm5hbC1zdG9yZS9zaGltL3dpdGgtc2VsZWN0b3IuanMnO1xuXG5jb25zdCB7IHVzZURlYnVnVmFsdWUgfSA9IFJlYWN0RXhwb3J0cztcbmNvbnN0IHsgdXNlU3luY0V4dGVybmFsU3RvcmVXaXRoU2VsZWN0b3IgfSA9IHVzZVN5bmNFeHRlcm5hbFN0b3JlRXhwb3J0cztcbmxldCBkaWRXYXJuQWJvdXRFcXVhbGl0eUZuID0gZmFsc2U7XG5jb25zdCBpZGVudGl0eSA9IChhcmcpID0+IGFyZztcbmZ1bmN0aW9uIHVzZVN0b3JlKGFwaSwgc2VsZWN0b3IgPSBpZGVudGl0eSwgZXF1YWxpdHlGbikge1xuICBpZiAoKGltcG9ydC5tZXRhLmVudiA/IGltcG9ydC5tZXRhLmVudi5NT0RFIDogdm9pZCAwKSAhPT0gXCJwcm9kdWN0aW9uXCIgJiYgZXF1YWxpdHlGbiAmJiAhZGlkV2FybkFib3V0RXF1YWxpdHlGbikge1xuICAgIGNvbnNvbGUud2FybihcbiAgICAgIFwiW0RFUFJFQ0FURURdIFVzZSBgY3JlYXRlV2l0aEVxdWFsaXR5Rm5gIGluc3RlYWQgb2YgYGNyZWF0ZWAgb3IgdXNlIGB1c2VTdG9yZVdpdGhFcXVhbGl0eUZuYCBpbnN0ZWFkIG9mIGB1c2VTdG9yZWAuIFRoZXkgY2FuIGJlIGltcG9ydGVkIGZyb20gJ3p1c3RhbmQvdHJhZGl0aW9uYWwnLiBodHRwczovL2dpdGh1Yi5jb20vcG1uZHJzL3p1c3RhbmQvZGlzY3Vzc2lvbnMvMTkzN1wiXG4gICAgKTtcbiAgICBkaWRXYXJuQWJvdXRFcXVhbGl0eUZuID0gdHJ1ZTtcbiAgfVxuICBjb25zdCBzbGljZSA9IHVzZVN5bmNFeHRlcm5hbFN0b3JlV2l0aFNlbGVjdG9yKFxuICAgIGFwaS5zdWJzY3JpYmUsXG4gICAgYXBpLmdldFN0YXRlLFxuICAgIGFwaS5nZXRTZXJ2ZXJTdGF0ZSB8fCBhcGkuZ2V0SW5pdGlhbFN0YXRlLFxuICAgIHNlbGVjdG9yLFxuICAgIGVxdWFsaXR5Rm5cbiAgKTtcbiAgdXNlRGVidWdWYWx1ZShzbGljZSk7XG4gIHJldHVybiBzbGljZTtcbn1cbmNvbnN0IGNyZWF0ZUltcGwgPSAoY3JlYXRlU3RhdGUpID0+IHtcbiAgaWYgKChpbXBvcnQubWV0YS5lbnYgPyBpbXBvcnQubWV0YS5lbnYuTU9ERSA6IHZvaWQgMCkgIT09IFwicHJvZHVjdGlvblwiICYmIHR5cGVvZiBjcmVhdGVTdGF0ZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgY29uc29sZS53YXJuKFxuICAgICAgXCJbREVQUkVDQVRFRF0gUGFzc2luZyBhIHZhbmlsbGEgc3RvcmUgd2lsbCBiZSB1bnN1cHBvcnRlZCBpbiBhIGZ1dHVyZSB2ZXJzaW9uLiBJbnN0ZWFkIHVzZSBgaW1wb3J0IHsgdXNlU3RvcmUgfSBmcm9tICd6dXN0YW5kJ2AuXCJcbiAgICApO1xuICB9XG4gIGNvbnN0IGFwaSA9IHR5cGVvZiBjcmVhdGVTdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gY3JlYXRlU3RvcmUoY3JlYXRlU3RhdGUpIDogY3JlYXRlU3RhdGU7XG4gIGNvbnN0IHVzZUJvdW5kU3RvcmUgPSAoc2VsZWN0b3IsIGVxdWFsaXR5Rm4pID0+IHVzZVN0b3JlKGFwaSwgc2VsZWN0b3IsIGVxdWFsaXR5Rm4pO1xuICBPYmplY3QuYXNzaWduKHVzZUJvdW5kU3RvcmUsIGFwaSk7XG4gIHJldHVybiB1c2VCb3VuZFN0b3JlO1xufTtcbmNvbnN0IGNyZWF0ZSA9IChjcmVhdGVTdGF0ZSkgPT4gY3JlYXRlU3RhdGUgPyBjcmVhdGVJbXBsKGNyZWF0ZVN0YXRlKSA6IGNyZWF0ZUltcGw7XG52YXIgcmVhY3QgPSAoY3JlYXRlU3RhdGUpID0+IHtcbiAgaWYgKChpbXBvcnQubWV0YS5lbnYgPyBpbXBvcnQubWV0YS5lbnYuTU9ERSA6IHZvaWQgMCkgIT09IFwicHJvZHVjdGlvblwiKSB7XG4gICAgY29uc29sZS53YXJuKFxuICAgICAgXCJbREVQUkVDQVRFRF0gRGVmYXVsdCBleHBvcnQgaXMgZGVwcmVjYXRlZC4gSW5zdGVhZCB1c2UgYGltcG9ydCB7IGNyZWF0ZSB9IGZyb20gJ3p1c3RhbmQnYC5cIlxuICAgICk7XG4gIH1cbiAgcmV0dXJuIGNyZWF0ZShjcmVhdGVTdGF0ZSk7XG59O1xuXG5leHBvcnQgeyBjcmVhdGUsIHJlYWN0IGFzIGRlZmF1bHQsIHVzZVN0b3JlIH07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/zustand/esm/index.mjs\n");

/***/ }),

/***/ "(ssr)/./node_modules/zustand/esm/vanilla.mjs":
/*!**********************************************!*\
  !*** ./node_modules/zustand/esm/vanilla.mjs ***!
  \**********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createStore: () => (/* binding */ createStore),\n/* harmony export */   \"default\": () => (/* binding */ vanilla)\n/* harmony export */ });\nconst createStoreImpl = (createState) => {\n  let state;\n  const listeners = /* @__PURE__ */ new Set();\n  const setState = (partial, replace) => {\n    const nextState = typeof partial === \"function\" ? partial(state) : partial;\n    if (!Object.is(nextState, state)) {\n      const previousState = state;\n      state = (replace != null ? replace : typeof nextState !== \"object\" || nextState === null) ? nextState : Object.assign({}, state, nextState);\n      listeners.forEach((listener) => listener(state, previousState));\n    }\n  };\n  const getState = () => state;\n  const getInitialState = () => initialState;\n  const subscribe = (listener) => {\n    listeners.add(listener);\n    return () => listeners.delete(listener);\n  };\n  const destroy = () => {\n    if (( false ? 0 : void 0) !== \"production\") {\n      console.warn(\n        \"[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected.\"\n      );\n    }\n    listeners.clear();\n  };\n  const api = { setState, getState, getInitialState, subscribe, destroy };\n  const initialState = state = createState(setState, getState, api);\n  return api;\n};\nconst createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;\nvar vanilla = (createState) => {\n  if (( false ? 0 : void 0) !== \"production\") {\n    console.warn(\n      \"[DEPRECATED] Default export is deprecated. Instead use import { createStore } from 'zustand/vanilla'.\"\n    );\n  }\n  return createStore(createState);\n};\n\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvenVzdGFuZC9lc20vdmFuaWxsYS5tanMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhIQUE4SDtBQUM5SDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsTUFBZSxHQUFHLENBQW9CO0FBQy9DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxNQUFlLEdBQUcsQ0FBb0I7QUFDN0M7QUFDQSx1RUFBdUUsY0FBYztBQUNyRjtBQUNBO0FBQ0E7QUFDQTs7QUFFMkMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90bS1yYW5kb20td2ViLWFwcC8uL25vZGVfbW9kdWxlcy96dXN0YW5kL2VzbS92YW5pbGxhLm1qcz8xNjhhIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGNyZWF0ZVN0b3JlSW1wbCA9IChjcmVhdGVTdGF0ZSkgPT4ge1xuICBsZXQgc3RhdGU7XG4gIGNvbnN0IGxpc3RlbmVycyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCk7XG4gIGNvbnN0IHNldFN0YXRlID0gKHBhcnRpYWwsIHJlcGxhY2UpID0+IHtcbiAgICBjb25zdCBuZXh0U3RhdGUgPSB0eXBlb2YgcGFydGlhbCA9PT0gXCJmdW5jdGlvblwiID8gcGFydGlhbChzdGF0ZSkgOiBwYXJ0aWFsO1xuICAgIGlmICghT2JqZWN0LmlzKG5leHRTdGF0ZSwgc3RhdGUpKSB7XG4gICAgICBjb25zdCBwcmV2aW91c1N0YXRlID0gc3RhdGU7XG4gICAgICBzdGF0ZSA9IChyZXBsYWNlICE9IG51bGwgPyByZXBsYWNlIDogdHlwZW9mIG5leHRTdGF0ZSAhPT0gXCJvYmplY3RcIiB8fCBuZXh0U3RhdGUgPT09IG51bGwpID8gbmV4dFN0YXRlIDogT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUsIG5leHRTdGF0ZSk7XG4gICAgICBsaXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IGxpc3RlbmVyKHN0YXRlLCBwcmV2aW91c1N0YXRlKSk7XG4gICAgfVxuICB9O1xuICBjb25zdCBnZXRTdGF0ZSA9ICgpID0+IHN0YXRlO1xuICBjb25zdCBnZXRJbml0aWFsU3RhdGUgPSAoKSA9PiBpbml0aWFsU3RhdGU7XG4gIGNvbnN0IHN1YnNjcmliZSA9IChsaXN0ZW5lcikgPT4ge1xuICAgIGxpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICAgIHJldHVybiAoKSA9PiBsaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgfTtcbiAgY29uc3QgZGVzdHJveSA9ICgpID0+IHtcbiAgICBpZiAoKGltcG9ydC5tZXRhLmVudiA/IGltcG9ydC5tZXRhLmVudi5NT0RFIDogdm9pZCAwKSAhPT0gXCJwcm9kdWN0aW9uXCIpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgXCJbREVQUkVDQVRFRF0gVGhlIGBkZXN0cm95YCBtZXRob2Qgd2lsbCBiZSB1bnN1cHBvcnRlZCBpbiBhIGZ1dHVyZSB2ZXJzaW9uLiBJbnN0ZWFkIHVzZSB1bnN1YnNjcmliZSBmdW5jdGlvbiByZXR1cm5lZCBieSBzdWJzY3JpYmUuIEV2ZXJ5dGhpbmcgd2lsbCBiZSBnYXJiYWdlLWNvbGxlY3RlZCBpZiBzdG9yZSBpcyBnYXJiYWdlLWNvbGxlY3RlZC5cIlxuICAgICAgKTtcbiAgICB9XG4gICAgbGlzdGVuZXJzLmNsZWFyKCk7XG4gIH07XG4gIGNvbnN0IGFwaSA9IHsgc2V0U3RhdGUsIGdldFN0YXRlLCBnZXRJbml0aWFsU3RhdGUsIHN1YnNjcmliZSwgZGVzdHJveSB9O1xuICBjb25zdCBpbml0aWFsU3RhdGUgPSBzdGF0ZSA9IGNyZWF0ZVN0YXRlKHNldFN0YXRlLCBnZXRTdGF0ZSwgYXBpKTtcbiAgcmV0dXJuIGFwaTtcbn07XG5jb25zdCBjcmVhdGVTdG9yZSA9IChjcmVhdGVTdGF0ZSkgPT4gY3JlYXRlU3RhdGUgPyBjcmVhdGVTdG9yZUltcGwoY3JlYXRlU3RhdGUpIDogY3JlYXRlU3RvcmVJbXBsO1xudmFyIHZhbmlsbGEgPSAoY3JlYXRlU3RhdGUpID0+IHtcbiAgaWYgKChpbXBvcnQubWV0YS5lbnYgPyBpbXBvcnQubWV0YS5lbnYuTU9ERSA6IHZvaWQgMCkgIT09IFwicHJvZHVjdGlvblwiKSB7XG4gICAgY29uc29sZS53YXJuKFxuICAgICAgXCJbREVQUkVDQVRFRF0gRGVmYXVsdCBleHBvcnQgaXMgZGVwcmVjYXRlZC4gSW5zdGVhZCB1c2UgaW1wb3J0IHsgY3JlYXRlU3RvcmUgfSBmcm9tICd6dXN0YW5kL3ZhbmlsbGEnLlwiXG4gICAgKTtcbiAgfVxuICByZXR1cm4gY3JlYXRlU3RvcmUoY3JlYXRlU3RhdGUpO1xufTtcblxuZXhwb3J0IHsgY3JlYXRlU3RvcmUsIHZhbmlsbGEgYXMgZGVmYXVsdCB9O1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/zustand/esm/vanilla.mjs\n");

/***/ })

};
;