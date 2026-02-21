const LANCZOS_G = 7;
const LANCZOS_COEFFICIENTS = [
  0.9999999999998099,
  676.5203681218851,
  -1259.1392167224028,
  771.3234287776531,
  -176.6150291621406,
  12.507343278686905,
  -0.1385710952657201,
  9.984369578019572e-6,
  1.5056327351493116e-7,
] as const;

const HALF_LOG_TWO_PI = 0.5 * Math.log(2 * Math.PI);
const BETA_FRACTION_EPSILON = 1e-12;
const BETA_FRACTION_MAX_ITERATIONS = 200;
const GAMMA_EPSILON = 1e-14;
const GAMMA_MAX_ITERATIONS = 10_000;
const T_PPF_EPSILON = 1e-12;
const FRACTION_FLOOR = 1e-300;

function ensureFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite`);
  }
}

function ensurePositive(value: number, name: string): void {
  ensureFinite(value, name);
  if (value <= 0) {
    throw new RangeError(`${name} must be > 0`);
  }
}

function clampUnit(value: number): number {
  if (value <= 0) {
    return 0;
  }

  if (value >= 1) {
    return 1;
  }

  return value;
}

/**
 * Natural logarithm of the gamma function via Lanczos approximation.
 */
export function logGamma(z: number): number {
  ensureFinite(z, "z");

  if (z <= 0 && Number.isInteger(z)) {
    throw new RangeError("z must not be a non-positive integer");
  }

  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  let x = LANCZOS_COEFFICIENTS[0];
  const zMinusOne = z - 1;

  for (let i = 1; i < LANCZOS_COEFFICIENTS.length; i++) {
    x += LANCZOS_COEFFICIENTS[i] / (zMinusOne + i);
  }

  const t = zMinusOne + LANCZOS_G + 0.5;
  return HALF_LOG_TWO_PI + (zMinusOne + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Natural logarithm of beta(a, b).
 */
export function logBeta(a: number, b: number): number {
  ensurePositive(a, "a");
  ensurePositive(b, "b");
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

/**
 * Regularized lower incomplete gamma P(s, x).
 */
export function regularizedIncompleteGamma(s: number, x: number): number {
  ensurePositive(s, "s");
  ensureFinite(x, "x");

  if (x < 0) {
    throw new RangeError("x must be >= 0");
  }

  if (x === 0) {
    return 0;
  }

  if (!Number.isFinite(x)) {
    return 1;
  }

  const gln = logGamma(s);

  // Series expansion for lower tail.
  if (x < s + 1) {
    let sum = 1 / s;
    let term = sum;

    for (let n = 1; n <= GAMMA_MAX_ITERATIONS; n++) {
      term *= x / (s + n);
      sum += term;

      if (Math.abs(term) < Math.abs(sum) * GAMMA_EPSILON) {
        break;
      }
    }

    return clampUnit(sum * Math.exp(-x + s * Math.log(x) - gln));
  }

  // Continued fraction for upper tail Q(s, x), then convert to P(s, x).
  let b = x + 1 - s;
  let c = 1 / FRACTION_FLOOR;
  let d = 1 / b;
  let h = d;

  for (let i = 1; i <= GAMMA_MAX_ITERATIONS; i++) {
    const an = -i * (i - s);
    b += 2;

    d = an * d + b;
    if (Math.abs(d) < FRACTION_FLOOR) {
      d = FRACTION_FLOOR;
    }

    c = b + an / c;
    if (Math.abs(c) < FRACTION_FLOOR) {
      c = FRACTION_FLOOR;
    }

    d = 1 / d;
    const delta = d * c;
    h *= delta;

    if (Math.abs(delta - 1) < GAMMA_EPSILON) {
      break;
    }
  }

  const q = Math.exp(-x + s * Math.log(x) - gln) * h;
  return clampUnit(1 - q);
}

function incompleteBetaContinuedFraction(x: number, a: number, b: number): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;

  let c = 1;
  let d = 1 - (qab * x) / qap;

  if (Math.abs(d) < FRACTION_FLOOR) {
    d = FRACTION_FLOOR;
  }

  d = 1 / d;
  let h = d;

  for (let m = 1; m <= BETA_FRACTION_MAX_ITERATIONS; m++) {
    const m2 = 2 * m;

    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FRACTION_FLOOR) {
      d = FRACTION_FLOOR;
    }

    c = 1 + aa / c;
    if (Math.abs(c) < FRACTION_FLOOR) {
      c = FRACTION_FLOOR;
    }

    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FRACTION_FLOOR) {
      d = FRACTION_FLOOR;
    }

    c = 1 + aa / c;
    if (Math.abs(c) < FRACTION_FLOOR) {
      c = FRACTION_FLOOR;
    }

    d = 1 / d;
    const delta = d * c;
    h *= delta;

    if (Math.abs(delta - 1) < BETA_FRACTION_EPSILON) {
      break;
    }
  }

  return h;
}

/**
 * Regularized incomplete beta I_x(a, b).
 */
export function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  ensureFinite(x, "x");
  ensurePositive(a, "a");
  ensurePositive(b, "b");

  if (x < 0 || x > 1) {
    throw new RangeError("x must be in [0, 1]");
  }

  if (x === 0) {
    return 0;
  }

  if (x === 1) {
    return 1;
  }

  const logFactor =
    logGamma(a + b) -
    logGamma(a) -
    logGamma(b) +
    a * Math.log(x) +
    b * Math.log(1 - x);

  const factor = Math.exp(logFactor);

  if (x < (a + 1) / (a + b + 2)) {
    return clampUnit((factor * incompleteBetaContinuedFraction(x, a, b)) / a);
  }

  return clampUnit(1 - (factor * incompleteBetaContinuedFraction(1 - x, b, a)) / b);
}

/**
 * Standard normal cumulative distribution function.
 */
export function normalCdf(x: number): number {
  ensureFinite(x, "x");

  if (x === 0) {
    return 0.5;
  }

  const erfMagnitude = regularizedIncompleteGamma(0.5, (x * x) / 2);
  return x > 0 ? 0.5 * (1 + erfMagnitude) : 0.5 * (1 - erfMagnitude);
}

/**
 * Inverse CDF (quantile) of the standard normal distribution.
 */
export function normalPpf(p: number): number {
  ensureFinite(p, "p");

  if (p <= 0 || p >= 1) {
    throw new RangeError("p must be in (0, 1)");
  }

  const a = [
    -39.69683028665376,
    220.9460984245205,
    -275.9285104469687,
    138.357751867269,
    -30.66479806614716,
    2.506628277459239,
  ] as const;
  const b = [
    -54.47609879822406,
    161.5858368580409,
    -155.6989798598866,
    66.80131188771972,
    -13.28068155288572,
  ] as const;
  const c = [
    -0.007784894002430293,
    -0.3223964580411365,
    -2.400758277161838,
    -2.549732539343734,
    4.374664141464968,
    2.938163982698783,
  ] as const;
  const d = [
    0.007784695709041462,
    0.3224671290700398,
    2.445134137142996,
    3.754408661907416,
  ] as const;

  const lowerTail = 0.02425;
  const upperTail = 1 - lowerTail;

  let x: number;

  if (p < lowerTail) {
    const q = Math.sqrt(-2 * Math.log(p));
    x =
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p > upperTail) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x =
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else {
    const q = p - 0.5;
    const r = q * q;
    x =
      (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  return x;
}

/**
 * CDF of Student's t distribution.
 */
export function studentTCdf(t: number, df: number): number {
  ensureFinite(t, "t");
  ensurePositive(df, "df");

  if (t === 0) {
    return 0.5;
  }

  const x = df / (df + t * t);
  const ib = regularizedIncompleteBeta(x, df / 2, 0.5);

  if (t > 0) {
    return 1 - 0.5 * ib;
  }

  return 0.5 * ib;
}

/**
 * Inverse CDF (quantile) of Student's t distribution.
 */
export function studentTPpf(p: number, df: number): number {
  ensureFinite(p, "p");
  ensurePositive(df, "df");

  if (p <= 0 || p >= 1) {
    throw new RangeError("p must be in (0, 1)");
  }

  if (p === 0.5) {
    return 0;
  }

  if (p < 0.5) {
    return -studentTPpf(1 - p, df);
  }

  let low = 0;
  let high = Math.max(1, normalPpf(p));

  while (studentTCdf(high, df) < p) {
    high *= 2;

    if (high > 1e6) {
      break;
    }
  }

  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    const cdf = studentTCdf(mid, df);

    if (Math.abs(cdf - p) < T_PPF_EPSILON) {
      return mid;
    }

    if (cdf < p) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Upper-tail probability for chi-square distribution.
 */
export function chiSquareSf(x: number, df: number): number {
  ensureFinite(x, "x");
  ensurePositive(df, "df");

  if (x < 0) {
    throw new RangeError("x must be >= 0");
  }

  if (x === 0) {
    return 1;
  }

  return clampUnit(1 - regularizedIncompleteGamma(df / 2, x / 2));
}
