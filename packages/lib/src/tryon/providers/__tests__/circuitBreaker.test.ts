import { createBreaker } from "../../providers/circuitBreaker";

describe("circuit breaker", () => {
  it("opens after failures and recovers after cool-off", async () => {
    const breaker = createBreaker({ timeoutMs: 50, failureThreshold: 2, coolOffMs: 50 });
    let calls = 0;
    const fail = () => { calls++; return Promise.reject(new Error("boom")); };

    await expect(breaker.exec("k", fail)).rejects.toThrow();
    await expect(breaker.exec("k", fail)).rejects.toThrow();

    // Next call should be blocked by open circuit immediately
    await expect(breaker.exec("k", fail)).rejects.toThrow();

    // Wait for cool-off
    await new Promise((resolve) => setTimeout(resolve, 60));

    // Half-open: success should close circuit
    const ok = () => Promise.resolve(42);
    await expect(breaker.exec("k", ok)).resolves.toBe(42);
  });
});

