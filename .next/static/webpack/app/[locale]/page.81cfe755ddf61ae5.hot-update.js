"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/[locale]/page",{

/***/ "(app-pages-browser)/./components/Counter.jsx":
/*!********************************!*\
  !*** ./components/Counter.jsx ***!
  \********************************/
/***/ (function(module, __webpack_exports__, __webpack_require__) {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Counter: function() { return /* binding */ Counter; }\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var _stores_counter_store__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/stores/counter-store */ \"(app-pages-browser)/./stores/counter-store.js\");\n/* harmony import */ var _ui_button__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ui/button */ \"(app-pages-browser)/./components/ui/button.jsx\");\n/* __next_internal_client_entry_do_not_use__ Counter auto */ \nvar _s = $RefreshSig$();\n\n\nconst Counter = ()=>{\n    _s();\n    const count = (0,_stores_counter_store__WEBPACK_IMPORTED_MODULE_1__.useCounterStore)((state)=>state.count);\n    const increment = (0,_stores_counter_store__WEBPACK_IMPORTED_MODULE_1__.useCounterStore)((state)=>state.increment);\n    console.log(increment);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n        className: \"text-center\",\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"label\", {\n                children: \"Count: \"\n            }, void 0, false, {\n                fileName: \"C:\\\\Projects\\\\team_random\\\\components\\\\Counter.jsx\",\n                lineNumber: 11,\n                columnNumber: 7\n            }, undefined),\n            count,\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_ui_button__WEBPACK_IMPORTED_MODULE_2__.Button, {\n                        onClick: increment,\n                        variant: \"outline\",\n                        children: \"inc\"\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Projects\\\\team_random\\\\components\\\\Counter.jsx\",\n                        lineNumber: 14,\n                        columnNumber: 9\n                    }, undefined),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_ui_button__WEBPACK_IMPORTED_MODULE_2__.Button, {\n                        variant: \"outline\",\n                        children: \"dec\"\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Projects\\\\team_random\\\\components\\\\Counter.jsx\",\n                        lineNumber: 17,\n                        columnNumber: 9\n                    }, undefined)\n                ]\n            }, void 0, true, {\n                fileName: \"C:\\\\Projects\\\\team_random\\\\components\\\\Counter.jsx\",\n                lineNumber: 13,\n                columnNumber: 7\n            }, undefined)\n        ]\n    }, void 0, true, {\n        fileName: \"C:\\\\Projects\\\\team_random\\\\components\\\\Counter.jsx\",\n        lineNumber: 10,\n        columnNumber: 5\n    }, undefined);\n};\n_s(Counter, \"0PkiK9fipnhZ2s6rRBxviQpVMgw=\", false, function() {\n    return [\n        _stores_counter_store__WEBPACK_IMPORTED_MODULE_1__.useCounterStore,\n        _stores_counter_store__WEBPACK_IMPORTED_MODULE_1__.useCounterStore\n    ];\n});\n_c = Counter;\nvar _c;\n$RefreshReg$(_c, \"Counter\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL2NvbXBvbmVudHMvQ291bnRlci5qc3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ3lEO0FBQ3BCO0FBRTlCLE1BQU1FLFVBQVU7O0lBQ3JCLE1BQU1DLFFBQVFILHNFQUFlQSxDQUFDLENBQUNJLFFBQVVBLE1BQU1ELEtBQUs7SUFDcEQsTUFBTUUsWUFBWUwsc0VBQWVBLENBQUMsQ0FBQ0ksUUFBVUEsTUFBTUMsU0FBUztJQUM1REMsUUFBUUMsR0FBRyxDQUFDRjtJQUNaLHFCQUNFLDhEQUFDRztRQUFJQyxXQUFVOzswQkFDYiw4REFBQ0M7MEJBQU07Ozs7OztZQUNOUDswQkFDRCw4REFBQ0s7O2tDQUNDLDhEQUFDUCw4Q0FBTUE7d0JBQUNVLFNBQVNOO3dCQUFXTyxTQUFRO2tDQUFVOzs7Ozs7a0NBRzlDLDhEQUFDWCw4Q0FBTUE7d0JBQUNXLFNBQVE7a0NBQVU7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlsQyxFQUFFO0dBaEJXVjs7UUFDR0Ysa0VBQWVBO1FBQ1hBLGtFQUFlQTs7O0tBRnRCRSIsInNvdXJjZXMiOlsid2VicGFjazovL19OX0UvLi9jb21wb25lbnRzL0NvdW50ZXIuanN4P2ZmNTQiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2UgY2xpZW50XCI7XHJcbmltcG9ydCB7IHVzZUNvdW50ZXJTdG9yZSB9IGZyb20gXCJAL3N0b3Jlcy9jb3VudGVyLXN0b3JlXCI7XHJcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gXCIuL3VpL2J1dHRvblwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IENvdW50ZXIgPSAoKSA9PiB7XHJcbiAgY29uc3QgY291bnQgPSB1c2VDb3VudGVyU3RvcmUoKHN0YXRlKSA9PiBzdGF0ZS5jb3VudCk7XHJcbiAgY29uc3QgaW5jcmVtZW50ID0gdXNlQ291bnRlclN0b3JlKChzdGF0ZSkgPT4gc3RhdGUuaW5jcmVtZW50KTtcclxuICBjb25zb2xlLmxvZyhpbmNyZW1lbnQpO1xyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtY2VudGVyXCI+XHJcbiAgICAgIDxsYWJlbD5Db3VudDogPC9sYWJlbD5cclxuICAgICAge2NvdW50fVxyXG4gICAgICA8ZGl2PlxyXG4gICAgICAgIDxCdXR0b24gb25DbGljaz17aW5jcmVtZW50fSB2YXJpYW50PVwib3V0bGluZVwiPlxyXG4gICAgICAgICAgaW5jXHJcbiAgICAgICAgPC9CdXR0b24+XHJcbiAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwib3V0bGluZVwiPmRlYzwvQnV0dG9uPlxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PlxyXG4gICk7XHJcbn07XHJcbiJdLCJuYW1lcyI6WyJ1c2VDb3VudGVyU3RvcmUiLCJCdXR0b24iLCJDb3VudGVyIiwiY291bnQiLCJzdGF0ZSIsImluY3JlbWVudCIsImNvbnNvbGUiLCJsb2ciLCJkaXYiLCJjbGFzc05hbWUiLCJsYWJlbCIsIm9uQ2xpY2siLCJ2YXJpYW50Il0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(app-pages-browser)/./components/Counter.jsx\n"));

/***/ })

});