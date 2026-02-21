# Similarity Metrics

Advanced dependence and similarity metrics for numeric series and discrete labels.

## Exports

- `distanceCorrelation(xs, ys, options?)`
- `hoeffding(xs, ys, options?)`
- `kendallTau(xs, ys, options?)`
- `jensenShannonDivergence(p, q, options?)`
- `jensenShannonDistance(p, q, options?)`
- `normalizedMutualInformationDiscrete(xs, ys, options?)`
- `normalizedMutualInformationBinned(xs, ys, options?)`

Shared validation helpers:

- `validateNumericPairInputs`
- `handleSimilarityValidationFailure`

## Validation Contract

All metric functions follow the same validation mode:

- default mode: returns `NaN` for invalid input,
- strict mode (`{ strict: true }`): throws `RangeError`.

## Normalized Mutual Information Defaults

- normalization: `MI / sqrt(H(X) * H(Y))`
- binned default strategy: `quantile`
- default bins: `clamp(round(sqrt(n)), 4, 16)`

Edge semantics:

- both entropies collapsed (constant arrays): returns `1`,
- only one entropy collapsed: returns `0`,
- output is clamped to `[0, 1]`.

## Usage Examples

```ts
import {
  distanceCorrelation,
  jensenShannonDistance,
  kendallTau,
  normalizedMutualInformationDiscrete,
} from "@acme/lib/src/math/similarity";

const tau = kendallTau([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]); // ~= 1
const dCor = distanceCorrelation([1, 2, 3, 4, 5, 6], [1, 4, 9, 16, 25, 36]); // high nonlinear dependence
const nmi = normalizedMutualInformationDiscrete([0, 0, 1, 1, 2, 2], [0, 0, 1, 1, 2, 2]); // 1
const jsd = jensenShannonDistance([1, 0, 0], [0, 0, 1]); // 1
```

See `__tests__/integration.test.ts` for executable example fixtures.
