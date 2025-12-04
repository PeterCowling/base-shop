# Page snapshot

```yaml
- heading "Cannot access '__WEBPACK_DEFAULT_EXPORT__' before initialization" [level=1]
- paragraph: "The component failed to render properly, likely due to a configuration issue in Storybook. Here are some common causes and how you can address them:"
- list:
  - listitem:
    - strong: Missing Context/Providers
    - text: ": You can use decorators to supply specific contexts or providers, which are sometimes necessary for components to render correctly. For detailed instructions on using decorators, please visit the"
    - link "Decorators documentation":
      - /url: https://storybook.js.org/docs/writing-stories/decorators
    - text: .
  - listitem:
    - strong: Misconfigured Webpack or Vite
    - text: ": Verify that Storybook picks up all necessary settings for loaders, plugins, and other relevant parameters. You can find step-by-step guides for configuring"
    - link "Webpack":
      - /url: https://storybook.js.org/docs/builders/webpack
    - text: or
    - link "Vite":
      - /url: https://storybook.js.org/docs/builders/vite
    - text: with Storybook.
  - listitem:
    - strong: Missing Environment Variables
    - text: ": Your Storybook may require specific environment variables to function as intended. You can set up custom environment variables as outlined in the"
    - link "Environment Variables documentation":
      - /url: https://storybook.js.org/docs/configure/environment-variables
    - text: .
- code: "ReferenceError: Cannot access '__WEBPACK_DEFAULT_EXPORT__' before initialization at Module.default (http://localhost:6007/PageBuilder-stories.iframe.bundle.js:61104:42) at Module.PageBuilder (http://localhost:6007/PageBuilder-stories.iframe.bundle.js:111301:106) at registerExportsForReactRefresh (http://localhost:6007/vendors-node_modules_pnpm_emotion_react_11_14_0__types_react_19_1_8_react_19_2_0-canary-3fbfb-ae40d7.iframe.bundle.js:4824:36) at Object.executeRuntime (http://localhost:6007/vendors-node_modules_pnpm_emotion_react_11_14_0__types_react_19_1_8_react_19_2_0-canary-3fbfb-ae40d7.iframe.bundle.js:4856:3) at $ReactRefreshModuleRuntime$ (http://localhost:6007/PageBuilder-stories.iframe.bundle.js:111481:34) at ../../packages/ui/src/components/cms/page-builder/index.ts (http://localhost:6007/PageBuilder-stories.iframe.bundle.js:111494:2) at options.factory (http://localhost:6007/runtime~main.iframe.bundle.js:715:30) at __webpack_require__ (http://localhost:6007/runtime~main.iframe.bundle.js:28:33) at fn (http://localhost:6007/runtime~main.iframe.bundle.js:343:21) at hotRequire (http://localhost:6007/runtime~main.iframe.bundle.js:698:47)"
```