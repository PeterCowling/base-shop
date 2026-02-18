# TASK-03 Triage: `useState`-in-Anonymous Violations — `@acme/ui`

**Date:** 2026-02-18
**Diagnostic source:** `/var/folders/d5/xxknrncx24x5q56z1___pxqh0000gn/T/react-doctor-c33fd4cd-e36a-4638-975c-32519fc6ca42`
**Rule:** `react-hooks/rules-of-hooks`
**Total flagged by react-doctor:** 46

---

## Headline Finding

**Zero true production violations.** All 46 instances are false positives from react-doctor misidentifying two Storybook/test patterns.

---

## Breakdown by Type

| Type | Description | Count |
|---|---|---|
| A | Storybook CSF v3 `render: () => { useState(...) }` — idiomatic interactive story pattern | 41 |
| C | False positive — jest.mock factory arrows calling `use*Mock()` functions; no actual `useState` | 5 |

---

## Root Cause

### Type A — Storybook CSF render arrows

Storybook Component Story Format v3 uses `render: () => <JSX />` on story objects. When a story needs local interactive state, the idiom is:

```ts
export const MyStory: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return <MyComponent value={value} onChange={setValue} />;
  },
};
```

The anonymous arrow is neither uppercase (component) nor `use`-prefixed (hook), so react-doctor flags it. Storybook's runtime calls these functions within the React lifecycle — they behave correctly. The lint rule does not understand Storybook's render contract.

### Type C — Test file false positives

`keyboard-controls.test.tsx` has an explicit `/* eslint react-hooks/rules-of-hooks: off */` banner on line 1. The flagged lines (21, 27, 33, 39, 45) call functions named `useBlockDnDMock()`, `useCanvasResizeMock()`, etc. inside jest.mock factory arrows. These contain zero `useState` calls — react-doctor triggered on the `use` prefix in function names, not actual hook usage.

---

## Full Triage Table

| File (relative to `packages/ui/src/`) | Lines | Type | Extraction needed | Notes |
|---|---|---|---|---|
| `components/cms/page-builder/__tests__/keyboard-controls.test.tsx` | 21, 27, 33, 39, 45 | C | No | jest.mock factories calling `use*Mock()` helpers. No useState. File has ESLint suppression on line 1. |
| `components/organisms/operations/CommandPalette/CommandPalette.stories.tsx` | 103 | A | Yes — named component | `render: () => { const [open] = useState(false) }` |
| `components/organisms/operations/CommandPalette/CommandPalette.stories.tsx` | 232–233 | A | Yes — named component | `const [isDark] = useState(false); const [open] = useState(false)` |
| `components/organisms/operations/FormCard/FormCard.stories.tsx` | 129–130 | A | Yes — named component | `const [state] = useState('idle'); const [quantity] = useState('')` |
| `components/organisms/operations/FilterPanel/FilterPanel.stories.tsx` | 143 | A | Yes — named component | `const [activeCount] = useState(0)` |
| `components/organisms/operations/SearchBar/SearchBar.stories.tsx` | 30 | A | Yes — named component | `const [value] = useState('')` |
| `components/organisms/operations/SearchBar/SearchBar.stories.tsx` | 38–39 | A | Yes — named component | `const [value] = useState(''); const [recentSearches] = useState([...])` |
| `components/organisms/operations/SearchBar/SearchBar.stories.tsx` | 71 | A | Yes — named component | `const [value] = useState('')` |
| `components/organisms/operations/SearchBar/SearchBar.stories.tsx` | 86 | A | Yes — named component | `const [value] = useState('')` |
| `components/organisms/operations/SearchBar/SearchBar.stories.tsx` | 101 | A | Yes — named component | `const [value] = useState('')` |
| `components/organisms/operations/SearchBar/SearchBar.stories.tsx` | 116–117 | A | Yes — named component | `const [value] = useState(''); const [recentSearches] = useState([...])` |
| `components/organisms/operations/BulkActions/BulkActions.stories.tsx` | 130 | A | Yes — named component | `const [selectedItems] = useState([1, 3, 5])` |
| `components/organisms/operations/ComboBox/ComboBox.stories.tsx` | 50, 65, 80, 96, 113, 130–132, 177, 193, 209, 225, 241, 261, 294 | A | Yes — named components (1 per story) | 14 separate story `render` arrows, each with 1–3 `useState` calls |
| `components/organisms/operations/SplitPane/SplitPane.stories.tsx` | 104 | A | Yes — named component | `const [collapsed] = useState(false)` |
| `components/organisms/operations/SplitPane/SplitPane.stories.tsx` | 224–225 | A | Yes — named component | `const [size] = useState(null); const [isResizing] = useState(false)` |
| `components/organisms/operations/VirtualList/VirtualList.stories.tsx` | 87 | A | Yes — named component | `useState` + `useRef` together; imperative handle pattern |
| `components/organisms/operations/VirtualList/VirtualList.stories.tsx` | 146–147 | A | Yes — named component | `const [items] = useState(...); const [isLoading] = useState(false)` |
| `components/organisms/operations/VirtualList/VirtualList.stories.tsx` | 325 | A | Yes — named component | `const [visibleRange] = useState({start:0, end:0})` |
| `components/organisms/operations/ActionSheet/ActionSheet.stories.tsx` | 29, 112, 185, 234 | A | Yes — named components | 4 stories, each `const [isOpen] = useState(false)` |

---

## Affected Files (8 story files + 1 test file)

```
packages/ui/src/components/organisms/operations/CommandPalette/CommandPalette.stories.tsx
packages/ui/src/components/organisms/operations/FormCard/FormCard.stories.tsx
packages/ui/src/components/organisms/operations/FilterPanel/FilterPanel.stories.tsx
packages/ui/src/components/organisms/operations/SearchBar/SearchBar.stories.tsx
packages/ui/src/components/organisms/operations/BulkActions/BulkActions.stories.tsx
packages/ui/src/components/organisms/operations/ComboBox/ComboBox.stories.tsx
packages/ui/src/components/organisms/operations/SplitPane/SplitPane.stories.tsx
packages/ui/src/components/organisms/operations/VirtualList/VirtualList.stories.tsx
packages/ui/src/components/cms/page-builder/__tests__/keyboard-controls.test.tsx  (Type C — no change needed)
```

---

## Remediation Approach for TASK-04

Convert each anonymous `render:` arrow to a named local component function within the story file:

```ts
// Before
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return <SearchBar value={value} onChange={setValue} />;
  },
};

// After
function DefaultStory() {
  const [value, setValue] = useState('');
  return <SearchBar value={value} onChange={setValue} />;
}
export const Default: Story = {
  render: () => <DefaultStory />,
};
```

The named function satisfies `react-hooks/rules-of-hooks` (uppercase name = component). No production code changes. No logic changes. Purely structural.

For the test file (`keyboard-controls.test.tsx`): no change needed. The ESLint suppression comment is already correct.

---

## Revised Estimates for TASK-04

| Dimension | Before TASK-03 | After TASK-03 |
|---|---|---|
| True production violations | Unknown | **0** |
| Scope | Unknown | 8 story files, 1 repeating pattern |
| Effort | L | **S** |
| Confidence | 70% | **95%** |
| Approach | Uncertain | Extract to named local component per story |

---

## Complexity Notes (top 3 if converting)

1. **VirtualList `WithImperativeControls`** — uses `useRef` + `useState` + imperative handle typing. Named component needs correct generic type annotation for `VirtualListHandle`.
2. **ComboBox `Sizes`** — three parallel `useState` calls (sm/md/lg) in one render. Clean extraction.
3. **SearchBar `WithRecentSearches`** / **`InteractiveWithResults`** — two `useState` calls + inline filtering logic. Still S complexity.
