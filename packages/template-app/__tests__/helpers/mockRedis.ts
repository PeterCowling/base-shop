import { jest } from "@jest/globals";

// Lightweight in-memory Redis mock with optional failure injection
export class MockRedis {
  private failCount = 0;
  constructor(private failUntil = 0) {}

  data = new Map<string, Record<string, any>>();

  private maybeFail() {
    if (this.failCount < this.failUntil) {
      this.failCount += 1;
      throw new Error("fail");
    }
  }

  hset = jest.fn(async (key: string, value: Record<string, any>) => {
    this.maybeFail();
    const obj = this.data.get(key) ?? {};
    Object.assign(obj, value);
    this.data.set(key, obj);
    return 1;
  });

  hgetall = jest.fn(async (key: string) => {
    this.maybeFail();
    return this.data.get(key) ?? {};
  });

  expire = jest.fn(async (_key: string, _ttl: number) => {
    this.maybeFail();
    return 1;
  });

  del = jest.fn(async (key: string) => {
    this.maybeFail();
    this.data.delete(key);
    return 1;
  });

  hdel = jest.fn(async (key: string, field: string) => {
    this.maybeFail();
    const obj = this.data.get(key) ?? {};
    const existed = obj[field] !== undefined ? 1 : 0;
    delete obj[field];
    this.data.set(key, obj);
    return existed;
  });

  hincrby = jest.fn(async (key: string, field: string, qty: number) => {
    this.maybeFail();
    const obj = this.data.get(key) ?? {};
    obj[field] = (obj[field] ?? 0) + qty;
    this.data.set(key, obj);
    return obj[field];
  });

  hexists = jest.fn(async (key: string, field: string) => {
    this.maybeFail();
    const obj = this.data.get(key) ?? {};
    return obj[field] !== undefined ? 1 : 0;
  });
}

