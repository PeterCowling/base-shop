var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
var init_utils = __esm({
  "../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
    __name(notImplementedClass, "notImplementedClass");
  }
});

// ../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance;
var init_performance = __esm({
  "../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
      name: "node",
      entryType: "node",
      startTime: 0,
      duration: 0,
      nodeStart: 0,
      v8Start: 0,
      bootstrapComplete: 0,
      environment: 0,
      loopStart: 0,
      loopExit: 0,
      idleTime: 0,
      uvMetricsInfo: {
        loopCount: 0,
        events: 0,
        eventsWaiting: 0
      },
      detail: void 0,
      toJSON() {
        return this;
      }
    };
    PerformanceEntry = class {
      static {
        __name(this, "PerformanceEntry");
      }
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || _performanceNow();
        this.detail = options?.detail;
      }
      get duration() {
        return _performanceNow() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    };
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
      static {
        __name(this, "PerformanceMark");
      }
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    };
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceResourceTiming");
      }
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    };
    PerformanceObserverEntryList = class {
      static {
        __name(this, "PerformanceObserverEntryList");
      }
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type) {
        return [];
      }
    };
    Performance = class {
      static {
        __name(this, "Performance");
      }
      __unenv__ = true;
      timeOrigin = _timeOrigin;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = void 0;
      timing = void 0;
      timerify(_fn, _options) {
        throw createNotImplementedError("Performance.timerify");
      }
      get nodeTiming() {
        return nodeTiming;
      }
      eventLoopUtilization() {
        return {};
      }
      markResourceTiming() {
        return new PerformanceResourceTiming("");
      }
      onresourcetimingbufferfull = null;
      now() {
        if (this.timeOrigin === _timeOrigin) {
          return _performanceNow();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
      }
      getEntriesByType(type) {
        return this._entries.filter((e) => e.entryType === type);
      }
      mark(name, options) {
        const entry = new PerformanceMark(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
        }
        const entry = new PerformanceMeasure(measureName, {
          startTime: start,
          detail: {
            start,
            end
          }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      addEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.addEventListener");
      }
      removeEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw createNotImplementedError("Performance.dispatchEvent");
      }
      toJSON() {
        return this;
      }
    };
    PerformanceObserver = class {
      static {
        __name(this, "PerformanceObserver");
      }
      __unenv__ = true;
      static supportedEntryTypes = [];
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw createNotImplementedError("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw createNotImplementedError("PerformanceObserver.observe");
      }
      bind(fn) {
        return fn;
      }
      runInAsyncScope(fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      asyncId() {
        return 0;
      }
      triggerAsyncId() {
        return 0;
      }
      emitDestroy() {
        return this;
      }
    };
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// ../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});

// ../../../node_modules/.pnpm/@cloudflare+unenv-preset@2.11.0_unenv@2.0.0-rc.24_workerd@1.20260120.0/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "../../../node_modules/.pnpm/@cloudflare+unenv-preset@2.11.0_unenv@2.0.0-rc.24_workerd@1.20260120.0/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});

// ../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default;
var init_noop = __esm({
  "../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});

// ../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";
var _console, _ignoreErrors, _stderr, _stdout, log, info, trace, debug, table, error, warn, createTask, clear, count, countReset, dir, dirxml, group, groupEnd, groupCollapsed, profile, profileEnd, time, timeEnd, timeLog, timeStamp, Console, _times, _stdoutErrorHandler, _stderrErrorHandler;
var init_console = __esm({
  "../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
  }
});

// ../../../node_modules/.pnpm/@cloudflare+unenv-preset@2.11.0_unenv@2.0.0-rc.24_workerd@1.20260120.0/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole, assert, clear2, context, count2, countReset2, createTask2, debug2, dir2, dirxml2, error2, group2, groupCollapsed2, groupEnd2, info2, log2, profile2, profileEnd2, table2, time2, timeEnd2, timeLog2, timeStamp2, trace2, warn2, console_default;
var init_console2 = __esm({
  "../../../node_modules/.pnpm/@cloudflare+unenv-preset@2.11.0_unenv@2.0.0-rc.24_workerd@1.20260120.0/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
      debug: debug2,
      dir: dir2,
      dirxml: dirxml2,
      error: error2,
      group: group2,
      groupCollapsed: groupCollapsed2,
      groupEnd: groupEnd2,
      info: info2,
      log: log2,
      profile: profile2,
      profileEnd: profileEnd2,
      table: table2,
      time: time2,
      timeEnd: timeEnd2,
      timeLog: timeLog2,
      timeStamp: timeStamp2,
      trace: trace2,
      warn: warn2
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
  }
});

// ../../../node_modules/.pnpm/wrangler@4.60.0_@cloudflare+workers-types@4.20260123.0/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "../../../node_modules/.pnpm/wrangler@4.60.0_@cloudflare+workers-types@4.20260123.0/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default;
  }
});

// ../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime;
var init_hrtime = __esm({
  "../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
      const now = Date.now();
      const seconds = Math.trunc(now / 1e3);
      const nanos = now % 1e3 * 1e6;
      if (startTime) {
        let diffSeconds = seconds - startTime[0];
        let diffNanos = nanos - startTime[0];
        if (diffNanos < 0) {
          diffSeconds = diffSeconds - 1;
          diffNanos = 1e9 + diffNanos;
        }
        return [diffSeconds, diffNanos];
      }
      return [seconds, nanos];
    }, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
      return BigInt(Date.now() * 1e6);
    }, "bigint") });
  }
});

// ../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream;
var init_read_stream = __esm({
  "../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream = class {
      static {
        __name(this, "ReadStream");
      }
      fd;
      isRaw = false;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
    };
  }
});

// ../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream;
var init_write_stream = __esm({
  "../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream = class {
      static {
        __name(this, "WriteStream");
      }
      fd;
      columns = 80;
      rows = 24;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      clearLine(dir3, callback) {
        callback && callback();
        return false;
      }
      clearScreenDown(callback) {
        callback && callback();
        return false;
      }
      cursorTo(x, y, callback) {
        callback && typeof callback === "function" && callback();
        return false;
      }
      moveCursor(dx, dy, callback) {
        callback && callback();
        return false;
      }
      getColorDepth(env2) {
        return 1;
      }
      hasColors(count3, env2) {
        return false;
      }
      getWindowSize() {
        return [this.columns, this.rows];
      }
      write(str, encoding, cb) {
        if (str instanceof Uint8Array) {
          str = new TextDecoder().decode(str);
        }
        try {
          console.log(str);
        } catch {
        }
        cb && typeof cb === "function" && cb();
        return false;
      }
    };
  }
});

// ../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/tty.mjs
var init_tty = __esm({
  "../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});

// ../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION;
var init_node_version = __esm({
  "../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    NODE_VERSION = "22.14.0";
  }
});

// ../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";
var Process;
var init_process = __esm({
  "../../../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    init_node_version();
    Process = class _Process extends EventEmitter {
      static {
        __name(this, "Process");
      }
      env;
      hrtime;
      nextTick;
      constructor(impl) {
        super();
        this.env = impl.env;
        this.hrtime = impl.hrtime;
        this.nextTick = impl.nextTick;
        for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
          const value = this[prop];
          if (typeof value === "function") {
            this[prop] = value.bind(this);
          }
        }
      }
      // --- event emitter ---
      emitWarning(warning, type, code) {
        console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
      }
      emit(...args) {
        return super.emit(...args);
      }
      listeners(eventName) {
        return super.listeners(eventName);
      }
      // --- stdio (lazy initializers) ---
      #stdin;
      #stdout;
      #stderr;
      get stdin() {
        return this.#stdin ??= new ReadStream(0);
      }
      get stdout() {
        return this.#stdout ??= new WriteStream(1);
      }
      get stderr() {
        return this.#stderr ??= new WriteStream(2);
      }
      // --- cwd ---
      #cwd = "/";
      chdir(cwd2) {
        this.#cwd = cwd2;
      }
      cwd() {
        return this.#cwd;
      }
      // --- dummy props and getters ---
      arch = "";
      platform = "";
      argv = [];
      argv0 = "";
      execArgv = [];
      execPath = "";
      title = "";
      pid = 200;
      ppid = 100;
      get version() {
        return `v${NODE_VERSION}`;
      }
      get versions() {
        return { node: NODE_VERSION };
      }
      get allowedNodeEnvironmentFlags() {
        return /* @__PURE__ */ new Set();
      }
      get sourceMapsEnabled() {
        return false;
      }
      get debugPort() {
        return 0;
      }
      get throwDeprecation() {
        return false;
      }
      get traceDeprecation() {
        return false;
      }
      get features() {
        return {};
      }
      get release() {
        return {};
      }
      get connected() {
        return false;
      }
      get config() {
        return {};
      }
      get moduleLoadList() {
        return [];
      }
      constrainedMemory() {
        return 0;
      }
      availableMemory() {
        return 0;
      }
      uptime() {
        return 0;
      }
      resourceUsage() {
        return {};
      }
      // --- noop methods ---
      ref() {
      }
      unref() {
      }
      // --- unimplemented methods ---
      umask() {
        throw createNotImplementedError("process.umask");
      }
      getBuiltinModule() {
        return void 0;
      }
      getActiveResourcesInfo() {
        throw createNotImplementedError("process.getActiveResourcesInfo");
      }
      exit() {
        throw createNotImplementedError("process.exit");
      }
      reallyExit() {
        throw createNotImplementedError("process.reallyExit");
      }
      kill() {
        throw createNotImplementedError("process.kill");
      }
      abort() {
        throw createNotImplementedError("process.abort");
      }
      dlopen() {
        throw createNotImplementedError("process.dlopen");
      }
      setSourceMapsEnabled() {
        throw createNotImplementedError("process.setSourceMapsEnabled");
      }
      loadEnvFile() {
        throw createNotImplementedError("process.loadEnvFile");
      }
      disconnect() {
        throw createNotImplementedError("process.disconnect");
      }
      cpuUsage() {
        throw createNotImplementedError("process.cpuUsage");
      }
      setUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
      }
      hasUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
      }
      initgroups() {
        throw createNotImplementedError("process.initgroups");
      }
      openStdin() {
        throw createNotImplementedError("process.openStdin");
      }
      assert() {
        throw createNotImplementedError("process.assert");
      }
      binding() {
        throw createNotImplementedError("process.binding");
      }
      // --- attached interfaces ---
      permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
      report = {
        directory: "",
        filename: "",
        signal: "SIGUSR2",
        compact: false,
        reportOnFatalError: false,
        reportOnSignal: false,
        reportOnUncaughtException: false,
        getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
        writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
      };
      finalization = {
        register: /* @__PURE__ */ notImplemented("process.finalization.register"),
        unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
        registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
      };
      memoryUsage = Object.assign(() => ({
        arrayBuffers: 0,
        rss: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: 0
      }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
      // --- undefined props ---
      mainModule = void 0;
      domain = void 0;
      // optional
      send = void 0;
      exitCode = void 0;
      channel = void 0;
      getegid = void 0;
      geteuid = void 0;
      getgid = void 0;
      getgroups = void 0;
      getuid = void 0;
      setegid = void 0;
      seteuid = void 0;
      setgid = void 0;
      setgroups = void 0;
      setuid = void 0;
      // internals
      _events = void 0;
      _eventsCount = void 0;
      _exiting = void 0;
      _maxListeners = void 0;
      _debugEnd = void 0;
      _debugProcess = void 0;
      _fatalException = void 0;
      _getActiveHandles = void 0;
      _getActiveRequests = void 0;
      _kill = void 0;
      _preload_modules = void 0;
      _rawDebug = void 0;
      _startProfilerIdleNotifier = void 0;
      _stopProfilerIdleNotifier = void 0;
      _tickCallback = void 0;
      _disconnect = void 0;
      _handleQueue = void 0;
      _pendingMessage = void 0;
      _channel = void 0;
      _send = void 0;
      _linkedBinding = void 0;
    };
  }
});

// ../../../node_modules/.pnpm/@cloudflare+unenv-preset@2.11.0_unenv@2.0.0-rc.24_workerd@1.20260120.0/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess, getBuiltinModule, workerdProcess, isWorkerdProcessV2, unenvProcess, exit, features, platform, env, hrtime3, nextTick, _channel, _disconnect, _events, _eventsCount, _handleQueue, _maxListeners, _pendingMessage, _send, assert2, disconnect, mainModule, _debugEnd, _debugProcess, _exiting, _fatalException, _getActiveHandles, _getActiveRequests, _kill, _linkedBinding, _preload_modules, _rawDebug, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, abort, addListener, allowedNodeEnvironmentFlags, arch, argv, argv0, availableMemory, binding, channel, chdir, config, connected, constrainedMemory, cpuUsage, cwd, debugPort, dlopen, domain, emit, emitWarning, eventNames, execArgv, execPath, exitCode, finalization, getActiveResourcesInfo, getegid, geteuid, getgid, getgroups, getMaxListeners, getuid, hasUncaughtExceptionCaptureCallback, initgroups, kill, listenerCount, listeners, loadEnvFile, memoryUsage, moduleLoadList, off, on, once, openStdin, permission, pid, ppid, prependListener, prependOnceListener, rawListeners, reallyExit, ref, release, removeAllListeners, removeListener, report, resourceUsage, send, setegid, seteuid, setgid, setgroups, setMaxListeners, setSourceMapsEnabled, setuid, setUncaughtExceptionCaptureCallback, sourceMapsEnabled, stderr, stdin, stdout, throwDeprecation, title, traceDeprecation, umask, unref, uptime, version, versions, _process, process_default;
var init_process2 = __esm({
  "../../../node_modules/.pnpm/@cloudflare+unenv-preset@2.11.0_unenv@2.0.0-rc.24_workerd@1.20260120.0/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    workerdProcess = getBuiltinModule("node:process");
    isWorkerdProcessV2 = globalThis.Cloudflare.compatibilityFlags.enable_nodejs_process_v2;
    unenvProcess = new Process({
      env: globalProcess.env,
      // `hrtime` is only available from workerd process v2
      hrtime: isWorkerdProcessV2 ? workerdProcess.hrtime : hrtime,
      // `nextTick` is available from workerd process v1
      nextTick: workerdProcess.nextTick
    });
    ({ exit, features, platform } = workerdProcess);
    ({
      env: (
        // Always implemented by workerd
        env
      ),
      hrtime: (
        // Only implemented in workerd v2
        hrtime3
      ),
      nextTick: (
        // Always implemented by workerd
        nextTick
      )
    } = unenvProcess);
    ({
      _channel,
      _disconnect,
      _events,
      _eventsCount,
      _handleQueue,
      _maxListeners,
      _pendingMessage,
      _send,
      assert: assert2,
      disconnect,
      mainModule
    } = unenvProcess);
    ({
      _debugEnd: (
        // @ts-expect-error `_debugEnd` is missing typings
        _debugEnd
      ),
      _debugProcess: (
        // @ts-expect-error `_debugProcess` is missing typings
        _debugProcess
      ),
      _exiting: (
        // @ts-expect-error `_exiting` is missing typings
        _exiting
      ),
      _fatalException: (
        // @ts-expect-error `_fatalException` is missing typings
        _fatalException
      ),
      _getActiveHandles: (
        // @ts-expect-error `_getActiveHandles` is missing typings
        _getActiveHandles
      ),
      _getActiveRequests: (
        // @ts-expect-error `_getActiveRequests` is missing typings
        _getActiveRequests
      ),
      _kill: (
        // @ts-expect-error `_kill` is missing typings
        _kill
      ),
      _linkedBinding: (
        // @ts-expect-error `_linkedBinding` is missing typings
        _linkedBinding
      ),
      _preload_modules: (
        // @ts-expect-error `_preload_modules` is missing typings
        _preload_modules
      ),
      _rawDebug: (
        // @ts-expect-error `_rawDebug` is missing typings
        _rawDebug
      ),
      _startProfilerIdleNotifier: (
        // @ts-expect-error `_startProfilerIdleNotifier` is missing typings
        _startProfilerIdleNotifier
      ),
      _stopProfilerIdleNotifier: (
        // @ts-expect-error `_stopProfilerIdleNotifier` is missing typings
        _stopProfilerIdleNotifier
      ),
      _tickCallback: (
        // @ts-expect-error `_tickCallback` is missing typings
        _tickCallback
      ),
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      arch,
      argv,
      argv0,
      availableMemory,
      binding: (
        // @ts-expect-error `binding` is missing typings
        binding
      ),
      channel,
      chdir,
      config,
      connected,
      constrainedMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      domain: (
        // @ts-expect-error `domain` is missing typings
        domain
      ),
      emit,
      emitWarning,
      eventNames,
      execArgv,
      execPath,
      exitCode,
      finalization,
      getActiveResourcesInfo,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getMaxListeners,
      getuid,
      hasUncaughtExceptionCaptureCallback,
      initgroups: (
        // @ts-expect-error `initgroups` is missing typings
        initgroups
      ),
      kill,
      listenerCount,
      listeners,
      loadEnvFile,
      memoryUsage,
      moduleLoadList: (
        // @ts-expect-error `moduleLoadList` is missing typings
        moduleLoadList
      ),
      off,
      on,
      once,
      openStdin: (
        // @ts-expect-error `openStdin` is missing typings
        openStdin
      ),
      permission,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      reallyExit: (
        // @ts-expect-error `reallyExit` is missing typings
        reallyExit
      ),
      ref,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      send,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setMaxListeners,
      setSourceMapsEnabled,
      setuid,
      setUncaughtExceptionCaptureCallback,
      sourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      throwDeprecation,
      title,
      traceDeprecation,
      umask,
      unref,
      uptime,
      version,
      versions
    } = isWorkerdProcessV2 ? workerdProcess : unenvProcess);
    _process = {
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exit,
      finalization,
      features,
      getBuiltinModule,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      nextTick,
      on,
      off,
      once,
      pid,
      platform,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      // @ts-expect-error old API
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert: assert2,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    };
    process_default = _process;
  }
});

// ../../../node_modules/.pnpm/wrangler@4.60.0_@cloudflare+workers-types@4.20260123.0/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "../../../node_modules/.pnpm/wrangler@4.60.0_@cloudflare+workers-types@4.20260123.0/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});

// lib/firebase-rest.ts
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, status);
}
var FirebaseRest;
var init_firebase_rest = __esm({
  "lib/firebase-rest.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    FirebaseRest = class {
      static {
        __name(this, "FirebaseRest");
      }
      constructor(env2) {
        this.databaseUrl = env2.CF_FIREBASE_DATABASE_URL;
        this.apiKey = env2.CF_FIREBASE_API_KEY;
      }
      buildUrl(path, params) {
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        const url = new URL(`${this.databaseUrl}${cleanPath}.json`);
        if (this.apiKey) {
          url.searchParams.set("auth", this.apiKey);
        }
        if (params) {
          for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value);
          }
        }
        return url.toString();
      }
      async get(path, params) {
        const url = this.buildUrl(path, params);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Firebase GET failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data;
      }
      async set(path, data) {
        const url = this.buildUrl(path);
        const response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          throw new Error(`Firebase SET failed: ${response.status} ${response.statusText}`);
        }
      }
      async update(path, data) {
        const url = this.buildUrl(path);
        const response = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          throw new Error(`Firebase UPDATE failed: ${response.status} ${response.statusText}`);
        }
      }
      async delete(path) {
        const url = this.buildUrl(path);
        const response = await fetch(url, {
          method: "DELETE"
        });
        if (!response.ok) {
          throw new Error(`Firebase DELETE failed: ${response.status} ${response.statusText}`);
        }
      }
    };
    __name(jsonResponse, "jsonResponse");
    __name(errorResponse, "errorResponse");
  }
});

// api/firebase/bookings.ts
var onRequestGet;
var init_bookings = __esm({
  "api/firebase/bookings.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_firebase_rest();
    onRequestGet = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
      const url = new URL(request.url);
      const uuid = url.searchParams.get("uuid");
      if (!uuid) {
        return errorResponse("UUID parameter is required", 400);
      }
      try {
        const firebase = new FirebaseRest(env2);
        const allBookings = await firebase.get("bookings");
        if (!allBookings) {
          return jsonResponse({ bookings: [] });
        }
        const guestBookings = Object.entries(allBookings).filter(([_, booking]) => booking.occupants?.includes(uuid)).map(([id, booking]) => ({ ...booking, id }));
        return jsonResponse({ bookings: guestBookings });
      } catch (error3) {
        console.error("Error fetching bookings:", error3);
        return errorResponse("Failed to fetch bookings", 500);
      }
    }, "onRequestGet");
  }
});

// api/firebase/guest-details.ts
var onRequestGet2;
var init_guest_details = __esm({
  "api/firebase/guest-details.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_firebase_rest();
    onRequestGet2 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
      const url = new URL(request.url);
      const uuid = url.searchParams.get("uuid");
      if (!uuid) {
        return errorResponse("UUID parameter is required", 400);
      }
      try {
        const firebase = new FirebaseRest(env2);
        const guest = await firebase.get(`guests/${uuid}`);
        if (!guest) {
          return errorResponse("Guest not found", 404);
        }
        return jsonResponse(guest);
      } catch (error3) {
        console.error("Error fetching guest details:", error3);
        return errorResponse("Failed to fetch guest details", 500);
      }
    }, "onRequestGet");
  }
});

// lib/guest-session.ts
function isGuestSessionExpired(expiresAt) {
  return new Date(expiresAt) <= /* @__PURE__ */ new Date();
}
async function validateGuestSessionToken(token, env2) {
  if (!token) {
    return errorResponse("token is required", 400);
  }
  const firebase = new FirebaseRest(env2);
  const session = await firebase.get(`guestSessionsByToken/${token}`);
  if (!session) {
    return errorResponse("Token not found", 404);
  }
  if (isGuestSessionExpired(session.expiresAt)) {
    return errorResponse("Token expired", 410);
  }
  return {
    token,
    session
  };
}
var init_guest_session = __esm({
  "lib/guest-session.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_firebase_rest();
    __name(isGuestSessionExpired, "isGuestSessionExpired");
    __name(validateGuestSessionToken, "validateGuestSessionToken");
  }
});

// lib/prime-requests.ts
function buildPrimeRequestId(type) {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `${type}_${Date.now()}_${suffix}`;
}
function createPrimeRequestRecord(input) {
  const now = Date.now();
  return {
    requestId: input.requestId,
    type: input.type,
    status: "pending",
    bookingId: input.bookingId,
    guestUuid: input.guestUuid,
    guestName: input.guestName,
    submittedAt: now,
    updatedAt: now,
    note: input.note,
    payload: input.payload
  };
}
function createPrimeRequestWritePayload(request) {
  return {
    [`primeRequests/byId/${request.requestId}`]: request,
    [`primeRequests/byGuest/${request.guestUuid}/${request.requestId}`]: true,
    [`primeRequests/byStatus/${request.status}/${request.requestId}`]: true,
    [`primeRequests/byType/${request.type}/${request.requestId}`]: true
  };
}
var init_prime_requests = __esm({
  "lib/prime-requests.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(buildPrimeRequestId, "buildPrimeRequestId");
    __name(createPrimeRequestRecord, "createPrimeRequestRecord");
    __name(createPrimeRequestWritePayload, "createPrimeRequestWritePayload");
  }
});

// api/firebase/preorders.ts
function todayInRome() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(/* @__PURE__ */ new Date());
}
function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
function findNightKeyForServiceDate(preorders, serviceDate) {
  const direct = Object.entries(preorders).find(([, night]) => night.serviceDate === serviceDate);
  if (direct) {
    return direct[0];
  }
  const alias = Object.entries(preorders).find(([, night]) => night.night === serviceDate);
  if (alias) {
    return alias[0];
  }
  return null;
}
function hasServiceEntitlement(preorders, service) {
  const nights = Object.values(preorders);
  if (nights.length === 0) {
    return true;
  }
  if (service === "breakfast") {
    return nights.some((night) => night.breakfast && night.breakfast !== "NA");
  }
  return nights.some(
    (night) => night.drink1 && night.drink1 !== "NA" || night.drink2 && night.drink2 !== "NA"
  );
}
var onRequestGet3, onRequestPost;
var init_preorders = __esm({
  "api/firebase/preorders.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_firebase_rest();
    init_guest_session();
    init_prime_requests();
    __name(todayInRome, "todayInRome");
    __name(isIsoDate, "isIsoDate");
    __name(findNightKeyForServiceDate, "findNightKeyForServiceDate");
    __name(hasServiceEntitlement, "hasServiceEntitlement");
    onRequestGet3 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
      const token = new URL(request.url).searchParams.get("token");
      try {
        const authResult = await validateGuestSessionToken(token, env2);
        if (authResult instanceof Response) {
          return authResult;
        }
        if (!authResult.session.guestUuid) {
          return errorResponse("guestUuid missing for session", 422);
        }
        const firebase = new FirebaseRest(env2);
        const preorder = await firebase.get(
          `preorder/${authResult.session.guestUuid}`
        );
        return jsonResponse({ preorder: preorder ?? {} });
      } catch (error3) {
        console.error("Error fetching preorder:", error3);
        return errorResponse("Failed to fetch preorder", 500);
      }
    }, "onRequestGet");
    onRequestPost = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
      let body;
      try {
        body = await request.json();
      } catch {
        return errorResponse("Invalid JSON body", 400);
      }
      const service = body.service;
      const serviceDate = (body.serviceDate ?? "").trim();
      const value = (body.value ?? "").trim();
      const requestChangeException = body.requestChangeException === true;
      if (!service || service !== "breakfast" && service !== "drink") {
        return errorResponse("service must be breakfast or drink", 400);
      }
      if (!serviceDate || !isIsoDate(serviceDate)) {
        return errorResponse("serviceDate must be ISO YYYY-MM-DD", 400);
      }
      if (!value) {
        return errorResponse("value is required", 400);
      }
      try {
        const authResult = await validateGuestSessionToken(body.token ?? null, env2);
        if (authResult instanceof Response) {
          return authResult;
        }
        const guestUuid = authResult.session.guestUuid;
        if (!guestUuid) {
          return errorResponse("guestUuid missing for session", 422);
        }
        const firebase = new FirebaseRest(env2);
        const preorders = await firebase.get(`preorder/${guestUuid}`) ?? {};
        if (!hasServiceEntitlement(preorders, service)) {
          return errorResponse("This booking is not eligible for that service", 403);
        }
        const today = todayInRome();
        const existingNightKey = findNightKeyForServiceDate(preorders, serviceDate);
        const isEditingExisting = Boolean(existingNightKey);
        const isSameDayOrPast = serviceDate <= today;
        if (isEditingExisting && isSameDayOrPast) {
          if (!requestChangeException) {
            return errorResponse("Same-day order changes are not allowed", 409);
          }
          const occupant = await firebase.get(
            `bookings/${authResult.session.bookingId}/${guestUuid}`
          );
          const guestName = `${occupant?.firstName ?? ""} ${occupant?.lastName ?? ""}`.trim() || "Guest";
          const requestId = buildPrimeRequestId("meal_change_exception");
          const requestRecord = createPrimeRequestRecord({
            requestId,
            type: "meal_change_exception",
            bookingId: authResult.session.bookingId,
            guestUuid,
            guestName,
            payload: {
              service,
              serviceDate,
              requestedValue: value,
              currentNightKey: existingNightKey
            }
          });
          await firebase.update("/", createPrimeRequestWritePayload(requestRecord));
          return jsonResponse({
            success: false,
            policyBlocked: true,
            requestQueued: true,
            requestId,
            message: "Same-day changes require reception approval. A request has been sent."
          }, 202);
        }
        const nightKey = existingNightKey ?? `night${Object.keys(preorders).length + 1}`;
        const existingNight = preorders[nightKey] ?? {
          night: nightKey,
          breakfast: "NA",
          drink1: "NA",
          drink2: "NA",
          serviceDate
        };
        const nextNight = {
          ...existingNight,
          night: existingNight.night || nightKey,
          serviceDate
        };
        if (service === "breakfast") {
          nextNight.breakfast = value;
        } else {
          nextNight.drink1 = value;
        }
        await firebase.set(`preorder/${guestUuid}/${nightKey}`, nextNight);
        return jsonResponse({
          success: true,
          nightKey,
          order: nextNight,
          updated: isEditingExisting
        });
      } catch (error3) {
        console.error("Error saving preorder:", error3);
        return errorResponse("Failed to save preorder", 500);
      }
    }, "onRequestPost");
  }
});

// api/bag-drop-request.ts
function todayInRome2() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(/* @__PURE__ */ new Date());
}
var RATE_LIMIT_WINDOW_SECONDS, MAX_REQUESTS_PER_HOUR, onRequestPost2;
var init_bag_drop_request = __esm({
  "api/bag-drop-request.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_firebase_rest();
    init_guest_session();
    init_prime_requests();
    RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
    MAX_REQUESTS_PER_HOUR = 3;
    __name(todayInRome2, "todayInRome");
    onRequestPost2 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
      let body;
      try {
        body = await request.json();
      } catch {
        return errorResponse("Invalid JSON body", 400);
      }
      const pickupWindow = (body.pickupWindow ?? "").trim();
      const note = (body.note ?? "").trim();
      if (!pickupWindow) {
        return errorResponse("pickupWindow is required", 400);
      }
      if (note.length > 500) {
        return errorResponse("note must be 500 characters or fewer", 400);
      }
      try {
        const authResult = await validateGuestSessionToken(body.token ?? null, env2);
        if (authResult instanceof Response) {
          return authResult;
        }
        const guestUuid = authResult.session.guestUuid;
        if (!guestUuid) {
          return errorResponse("guestUuid missing for session", 422);
        }
        if (env2.RATE_LIMIT) {
          const key = `bag-drop-rate:${guestUuid}`;
          const rawCount = await env2.RATE_LIMIT.get(key);
          const count3 = parseInt(rawCount ?? "0", 10);
          if (count3 >= MAX_REQUESTS_PER_HOUR) {
            return errorResponse("Too many bag-drop requests. Please wait before retrying.", 429);
          }
          await env2.RATE_LIMIT.put(key, String(count3 + 1), {
            expirationTtl: RATE_LIMIT_WINDOW_SECONDS
          });
        }
        const firebase = new FirebaseRest(env2);
        const occupant = await firebase.get(
          `bookings/${authResult.session.bookingId}/${guestUuid}`
        );
        if (!occupant?.checkOutDate) {
          return errorResponse("Current checkout date unavailable for this booking", 422);
        }
        if (occupant.checkOutDate > todayInRome2()) {
          return errorResponse("Bag drop is only available after checkout", 403);
        }
        const bagStorage = await firebase.get(`bagStorage/${guestUuid}`);
        if (bagStorage?.requestStatus && bagStorage.requestStatus !== "completed") {
          return jsonResponse({
            success: true,
            deduplicated: true,
            requestId: bagStorage.requestId ?? null,
            message: "An active bag-drop request already exists."
          });
        }
        const guestName = `${occupant.firstName ?? ""} ${occupant.lastName ?? ""}`.trim() || "Guest";
        const requestId = buildPrimeRequestId("bag_drop");
        const requestRecord = createPrimeRequestRecord({
          requestId,
          type: "bag_drop",
          bookingId: authResult.session.bookingId,
          guestUuid,
          guestName,
          note,
          payload: {
            pickupWindow
          }
        });
        await firebase.update("/", {
          ...createPrimeRequestWritePayload(requestRecord),
          [`bagStorage/${guestUuid}`]: {
            optedIn: true,
            requestStatus: "pending",
            pickupWindow,
            note,
            requestId,
            updatedAt: Date.now()
          }
        });
        return jsonResponse({
          success: true,
          requestId,
          message: "Bag-drop request submitted. Reception will confirm shortly."
        });
      } catch (error3) {
        console.error("Failed to create bag-drop request:", error3);
        return errorResponse("Failed to submit bag-drop request", 500);
      }
    }, "onRequestPost");
  }
});

// api/check-in-code.ts
function generateCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARACTERS.charAt(Math.floor(Math.random() * CODE_CHARACTERS.length));
  }
  return `${CODE_PREFIX}${code}`;
}
function calculateExpiry(checkOutDate) {
  try {
    const checkOut = new Date(checkOutDate);
    return checkOut.getTime() + CODE_EXPIRY_HOURS_AFTER_CHECKOUT * 60 * 60 * 1e3;
  } catch {
    return Date.now() + 7 * 24 * 60 * 60 * 1e3;
  }
}
var CODE_PREFIX, CODE_LENGTH, CODE_EXPIRY_HOURS_AFTER_CHECKOUT, MAX_COLLISION_ATTEMPTS, CODE_CHARACTERS, onRequestGet4, onRequestPost3;
var init_check_in_code = __esm({
  "api/check-in-code.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_firebase_rest();
    CODE_PREFIX = "BRK-";
    CODE_LENGTH = 5;
    CODE_EXPIRY_HOURS_AFTER_CHECKOUT = 48;
    MAX_COLLISION_ATTEMPTS = 10;
    CODE_CHARACTERS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    __name(generateCode, "generateCode");
    __name(calculateExpiry, "calculateExpiry");
    onRequestGet4 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
      const url = new URL(request.url);
      const uuid = url.searchParams.get("uuid");
      if (!uuid) {
        return errorResponse("uuid parameter is required", 400);
      }
      try {
        const firebase = new FirebaseRest(env2);
        const record = await firebase.get(`checkInCodes/byUuid/${uuid}`);
        if (!record) {
          return jsonResponse({ code: null });
        }
        if (record.expiresAt && record.expiresAt < Date.now()) {
          return jsonResponse({ code: null, expired: true });
        }
        return jsonResponse({ code: record.code, expiresAt: record.expiresAt });
      } catch (error3) {
        console.error("Error fetching check-in code:", error3);
        return errorResponse("Failed to fetch check-in code", 500);
      }
    }, "onRequestGet");
    onRequestPost3 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
      try {
        const body = await request.json();
        if (!body.uuid) {
          return errorResponse("uuid is required", 400);
        }
        if (!body.checkOutDate) {
          return errorResponse("checkOutDate is required", 400);
        }
        const firebase = new FirebaseRest(env2);
        const existing = await firebase.get(`checkInCodes/byUuid/${body.uuid}`);
        if (existing && existing.expiresAt > Date.now()) {
          return jsonResponse({ code: existing.code, expiresAt: existing.expiresAt, existing: true });
        }
        let code;
        let attempts = 0;
        do {
          code = generateCode();
          attempts++;
          const existingCode = await firebase.get(`checkInCodes/byCode/${code}`);
          if (!existingCode) {
            break;
          }
          if (attempts >= MAX_COLLISION_ATTEMPTS) {
            return errorResponse("Failed to generate unique code", 500);
          }
        } while (true);
        const now = Date.now();
        const expiresAt = calculateExpiry(body.checkOutDate);
        const record = {
          code,
          uuid: body.uuid,
          createdAt: now,
          expiresAt
        };
        await firebase.set(`checkInCodes/byCode/${code}`, record);
        await firebase.set(`checkInCodes/byUuid/${body.uuid}`, record);
        return jsonResponse({ code, expiresAt, created: true });
      } catch (error3) {
        console.error("Error generating check-in code:", error3);
        return errorResponse("Failed to generate check-in code", 500);
      }
    }, "onRequestPost");
  }
});

// lib/staff-owner-gate.ts
function isProduction(env2) {
  return (env2.NODE_ENV ?? "development") === "production";
}
function isFeatureEnabled(env2) {
  return env2.PRIME_ENABLE_STAFF_OWNER_ROUTES === "true";
}
function hasAccessToken(request, env2) {
  if (!env2.PRIME_STAFF_OWNER_GATE_TOKEN) {
    return false;
  }
  const token = request.headers.get("x-prime-access-token");
  return token === env2.PRIME_STAFF_OWNER_GATE_TOKEN;
}
function hasCloudflareAccess(request) {
  const accessUser = request.headers.get("cf-access-authenticated-user-email");
  return Boolean(accessUser && accessUser.trim());
}
function enforceStaffOwnerApiGate(request, env2) {
  if (!isProduction(env2)) {
    return null;
  }
  if (isFeatureEnabled(env2)) {
    return null;
  }
  if (hasCloudflareAccess(request) || hasAccessToken(request, env2)) {
    return null;
  }
  return errorResponse(
    "Staff/owner APIs are disabled in production until secure route gates are enabled.",
    403
  );
}
var init_staff_owner_gate = __esm({
  "lib/staff-owner-gate.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_firebase_rest();
    __name(isProduction, "isProduction");
    __name(isFeatureEnabled, "isFeatureEnabled");
    __name(hasAccessToken, "hasAccessToken");
    __name(hasCloudflareAccess, "hasCloudflareAccess");
    __name(enforceStaffOwnerApiGate, "enforceStaffOwnerApiGate");
  }
});

// lib/staff-auth-token-gate.ts
function extractBearerToken(request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}
function parseStaffRole(claims) {
  const role = typeof claims.role === "string" ? claims.role.toLowerCase() : null;
  if (role && STAFF_ROLE_PRIORITY.includes(role)) {
    return role;
  }
  if (Array.isArray(claims.roles)) {
    const normalizedRoles = claims.roles.filter((value) => typeof value === "string").map((value) => value.toLowerCase());
    for (const prioritizedRole of STAFF_ROLE_PRIORITY) {
      if (normalizedRoles.includes(prioritizedRole)) {
        return prioritizedRole;
      }
    }
  }
  if (claims.staff === true || claims.isStaff === true) {
    return "staff";
  }
  return null;
}
function parseUid(claims) {
  const claimUid = typeof claims.uid === "string" ? claims.uid.trim() : "";
  if (claimUid) {
    return claimUid;
  }
  const subjectUid = typeof claims.sub === "string" ? claims.sub.trim() : "";
  if (subjectUid) {
    return subjectUid;
  }
  return null;
}
function decodeBase64UrlSegment(segment) {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = normalized.length % 4;
  const padded = padLength === 0 ? normalized : `${normalized}${"=".repeat(4 - padLength)}`;
  try {
    if (typeof atob === "function") {
      return atob(padded);
    }
    const maybeBuffer = globalThis.Buffer;
    if (maybeBuffer) {
      return maybeBuffer.from(padded, "base64").toString("utf8");
    }
  } catch {
    return null;
  }
  return null;
}
function decodeJwtPayload(token) {
  const segments = token.split(".");
  if (segments.length < 2) {
    return {};
  }
  const decoded = decodeBase64UrlSegment(segments[1]);
  if (!decoded) {
    return {};
  }
  try {
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}
async function verifyStaffTokenClaimsWithFirebaseLookup(idToken, env2) {
  if (!env2.CF_FIREBASE_API_KEY) {
    throw new Error("CF_FIREBASE_API_KEY is required for staff token verification");
  }
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env2.CF_FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ idToken })
    }
  );
  if (!response.ok) {
    return null;
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    return null;
  }
  const user = payload.users?.[0];
  if (!user?.localId) {
    return null;
  }
  let customClaims = {};
  if (typeof user.customAttributes === "string" && user.customAttributes.trim()) {
    try {
      customClaims = JSON.parse(user.customAttributes);
    } catch {
      return null;
    }
  }
  const idTokenClaims = decodeJwtPayload(idToken);
  const mergedClaims = {
    ...idTokenClaims,
    ...customClaims
  };
  return {
    ...mergedClaims,
    uid: user.localId
  };
}
async function enforceStaffAuthTokenGate(request, env2, dependencies = {}) {
  const defaultGateResponse = enforceStaffOwnerApiGate(request, env2);
  if (defaultGateResponse) {
    return {
      ok: false,
      response: defaultGateResponse
    };
  }
  const idToken = extractBearerToken(request);
  if (!idToken) {
    return {
      ok: false,
      response: errorResponse("Missing Authorization bearer token", 401)
    };
  }
  const verifyStaffTokenClaims = dependencies.verifyStaffTokenClaims ?? verifyStaffTokenClaimsWithFirebaseLookup;
  let claims;
  try {
    claims = await verifyStaffTokenClaims(idToken, env2);
  } catch {
    return {
      ok: false,
      response: errorResponse("Invalid staff token", 401)
    };
  }
  if (!claims) {
    return {
      ok: false,
      response: errorResponse("Invalid staff token", 401)
    };
  }
  const role = parseStaffRole(claims);
  if (!role) {
    return {
      ok: false,
      response: errorResponse("Staff role claim is required", 403)
    };
  }
  const uid = parseUid(claims);
  if (!uid) {
    return {
      ok: false,
      response: errorResponse("Staff token is missing uid claim", 401)
    };
  }
  return {
    ok: true,
    identity: {
      uid,
      role,
      claims
    }
  };
}
var STAFF_ROLE_PRIORITY;
var init_staff_auth_token_gate = __esm({
  "lib/staff-auth-token-gate.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_firebase_rest();
    init_staff_owner_gate();
    STAFF_ROLE_PRIORITY = ["owner", "admin", "staff"];
    __name(extractBearerToken, "extractBearerToken");
    __name(parseStaffRole, "parseStaffRole");
    __name(parseUid, "parseUid");
    __name(decodeBase64UrlSegment, "decodeBase64UrlSegment");
    __name(decodeJwtPayload, "decodeJwtPayload");
    __name(verifyStaffTokenClaimsWithFirebaseLookup, "verifyStaffTokenClaimsWithFirebaseLookup");
    __name(enforceStaffAuthTokenGate, "enforceStaffAuthTokenGate");
  }
});

// api/check-in-lookup.ts
function formatGuestName(firstName, lastName) {
  if (!lastName) return firstName;
  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
}
function coerceBoolean(value) {
  return value === true;
}
function buildReadinessSignals(preArrival) {
  const checklist = preArrival?.checklistProgress ?? {};
  const etaConfirmed = coerceBoolean(checklist.etaConfirmed) || Boolean(preArrival?.etaWindow);
  const cashPrepared = coerceBoolean(checklist.cashPrepared) || coerceBoolean(preArrival?.cashReadyCityTax) && coerceBoolean(preArrival?.cashReadyDeposit);
  const routePlanned = coerceBoolean(checklist.routePlanned) || Boolean(preArrival?.routeSaved);
  const rulesReviewed = coerceBoolean(checklist.rulesReviewed);
  const locationSaved = coerceBoolean(checklist.locationSaved);
  const readinessScore = (routePlanned ? READINESS_WEIGHTS.routePlanned : 0) + (etaConfirmed ? READINESS_WEIGHTS.etaConfirmed : 0) + (cashPrepared ? READINESS_WEIGHTS.cashPrepared : 0) + (rulesReviewed ? READINESS_WEIGHTS.rulesReviewed : 0) + (locationSaved ? READINESS_WEIGHTS.locationSaved : 0);
  return {
    etaConfirmed,
    cashPrepared,
    routePlanned,
    rulesReviewed,
    locationSaved,
    readinessScore
  };
}
var KEYCARD_DEPOSIT, MAX_LOOKUPS_PER_HOUR, RATE_LIMIT_TTL_SECONDS, READINESS_WEIGHTS, onRequestGet5;
var init_check_in_lookup = __esm({
  "api/check-in-lookup.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_firebase_rest();
    init_staff_auth_token_gate();
    KEYCARD_DEPOSIT = 10;
    MAX_LOOKUPS_PER_HOUR = 120;
    RATE_LIMIT_TTL_SECONDS = 60 * 60;
    READINESS_WEIGHTS = {
      routePlanned: 25,
      etaConfirmed: 20,
      cashPrepared: 25,
      rulesReviewed: 15,
      locationSaved: 15
    };
    __name(formatGuestName, "formatGuestName");
    __name(coerceBoolean, "coerceBoolean");
    __name(buildReadinessSignals, "buildReadinessSignals");
    onRequestGet5 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
      const gateResult = await enforceStaffAuthTokenGate(request, env2);
      if (!gateResult.ok) {
        return gateResult.response;
      }
      const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
      const rateLimitKey = `check-in-lookup:${clientIP}`;
      if (env2.RATE_LIMIT) {
        const attempts = await env2.RATE_LIMIT.get(rateLimitKey);
        if (attempts && parseInt(attempts, 10) >= MAX_LOOKUPS_PER_HOUR) {
          return errorResponse("Too many lookup attempts. Please try again later.", 429);
        }
        const nextAttemptCount = (parseInt(attempts || "0", 10) + 1).toString();
        await env2.RATE_LIMIT.put(rateLimitKey, nextAttemptCount, {
          expirationTtl: RATE_LIMIT_TTL_SECONDS
        });
      }
      const url = new URL(request.url);
      const code = url.searchParams.get("code");
      if (!code) {
        return errorResponse("code parameter is required", 400);
      }
      try {
        const firebase = new FirebaseRest(env2);
        const codeRecord = await firebase.get(
          `checkInCodes/byCode/${code.toUpperCase()}`
        );
        if (!codeRecord) {
          return errorResponse("Code not found", 404);
        }
        if (codeRecord.expiresAt && codeRecord.expiresAt < Date.now()) {
          return errorResponse("Code expired", 410);
        }
        const { uuid } = codeRecord;
        const bookings = await firebase.get("bookings");
        if (!bookings) {
          return errorResponse("Booking not found", 404);
        }
        for (const [bookingCode, bookingData] of Object.entries(bookings)) {
          const occupants = bookingData.occupants;
          if (occupants && occupants[uuid]) {
            const occupant = await firebase.get(`bookings/${bookingCode}/${uuid}`);
            if (!occupant) continue;
            const preArrival = await firebase.get(`preArrival/${uuid}`);
            const readiness = buildReadinessSignals(preArrival);
            const bagStorage = await firebase.get(`bagStorage/${uuid}`);
            const bagDropRequested = Boolean(
              bagStorage?.requestStatus && bagStorage.requestStatus !== "completed"
            );
            return jsonResponse({
              guestName: formatGuestName(
                occupant.firstName ?? "Guest",
                occupant.lastName ?? ""
              ),
              roomAssignment: occupant.room ?? "Not assigned",
              checkInDate: occupant.checkInDate ?? "",
              checkOutDate: occupant.checkOutDate ?? "",
              nights: occupant.nights ?? 1,
              cityTaxDue: occupant.cityTax?.totalDue ?? 0,
              depositDue: KEYCARD_DEPOSIT,
              etaWindow: preArrival?.etaWindow ?? null,
              etaMethod: preArrival?.etaMethod ?? null,
              readiness,
              personalization: {
                arrivalMethodPreference: preArrival?.arrivalMethodPreference ?? null,
                arrivalConfidence: preArrival?.arrivalConfidence ?? null
              },
              operational: {
                bagDropRequested
              }
            });
          }
        }
        return errorResponse("Guest not found", 404);
      } catch (error3) {
        console.error("Error looking up check-in code:", error3);
        return errorResponse("Lookup failed", 500);
      }
    }, "onRequestGet");
  }
});

// lib/email-dispatch.ts
async function dispatchPrimeEmail(message, env2) {
  if (!env2.PRIME_EMAIL_WEBHOOK_URL) {
    return {
      delivered: false,
      deliveryMode: "noop"
    };
  }
  const response = await fetch(env2.PRIME_EMAIL_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...env2.PRIME_EMAIL_WEBHOOK_TOKEN ? { Authorization: `Bearer ${env2.PRIME_EMAIL_WEBHOOK_TOKEN}` } : {}
    },
    body: JSON.stringify(message)
  });
  if (!response.ok) {
    const dispatchError = new Error(
      `Email webhook failed: ${response.status}`
    );
    dispatchError.code = "email_webhook_failed";
    dispatchError.status = response.status;
    throw dispatchError;
  }
  return {
    delivered: true,
    deliveryMode: "webhook"
  };
}
var init_email_dispatch = __esm({
  "lib/email-dispatch.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(dispatchPrimeEmail, "dispatchPrimeEmail");
  }
});

// api/extension-request.ts
function isIsoDate2(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
function compareIsoDates(a, b) {
  return a.localeCompare(b);
}
var TARGET_EMAIL, MAX_REQUESTS_PER_HOUR2, REQUEST_WINDOW_SECONDS, DEDUPE_WINDOW_SECONDS, onRequestPost4;
var init_extension_request = __esm({
  "api/extension-request.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_email_dispatch();
    init_firebase_rest();
    init_guest_session();
    init_prime_requests();
    TARGET_EMAIL = "hostelbrikette@gmail.com";
    MAX_REQUESTS_PER_HOUR2 = 3;
    REQUEST_WINDOW_SECONDS = 60 * 60;
    DEDUPE_WINDOW_SECONDS = 10 * 60;
    __name(isIsoDate2, "isIsoDate");
    __name(compareIsoDates, "compareIsoDates");
    onRequestPost4 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
      let body;
      try {
        body = await request.json();
      } catch {
        return errorResponse("Invalid JSON body", 400);
      }
      const token = body.token ?? null;
      const requestedCheckOutDate = (body.requestedCheckOutDate ?? "").trim();
      const note = (body.note ?? "").trim();
      if (!requestedCheckOutDate || !isIsoDate2(requestedCheckOutDate)) {
        return errorResponse("requestedCheckOutDate must be ISO YYYY-MM-DD", 400);
      }
      if (note.length > 500) {
        return errorResponse("note must be 500 characters or fewer", 400);
      }
      try {
        const authResult = await validateGuestSessionToken(token, env2);
        if (authResult instanceof Response) {
          return authResult;
        }
        const guestUuid = authResult.session.guestUuid;
        if (!guestUuid) {
          return errorResponse("guestUuid missing for session", 422);
        }
        if (env2.RATE_LIMIT) {
          const rateLimitKey = `extension-rate:${guestUuid}`;
          const rawCount = await env2.RATE_LIMIT.get(rateLimitKey);
          const count3 = parseInt(rawCount ?? "0", 10);
          if (count3 >= MAX_REQUESTS_PER_HOUR2) {
            return errorResponse("Too many extension requests. Please wait before retrying.", 429);
          }
          await env2.RATE_LIMIT.put(rateLimitKey, String(count3 + 1), {
            expirationTtl: REQUEST_WINDOW_SECONDS
          });
        }
        if (env2.RATE_LIMIT) {
          const dedupeKey = `extension-dedupe:${guestUuid}:${requestedCheckOutDate}`;
          const existing = await env2.RATE_LIMIT.get(dedupeKey);
          if (existing) {
            return jsonResponse({
              success: true,
              deduplicated: true,
              requestId: existing,
              message: "Extension request already submitted recently."
            });
          }
        }
        const firebase = new FirebaseRest(env2);
        const occupant = await firebase.get(
          `bookings/${authResult.session.bookingId}/${guestUuid}`
        );
        if (!occupant?.checkOutDate) {
          return errorResponse("Current checkout date unavailable for this booking", 422);
        }
        if (compareIsoDates(requestedCheckOutDate, occupant.checkOutDate) <= 0) {
          return errorResponse("requestedCheckOutDate must be after current checkout date", 400);
        }
        const guestName = `${occupant.firstName ?? ""} ${occupant.lastName ?? ""}`.trim() || "Guest";
        const requestId = buildPrimeRequestId("extension");
        const requestRecord = createPrimeRequestRecord({
          requestId,
          type: "extension",
          bookingId: authResult.session.bookingId,
          guestUuid,
          guestName,
          note,
          payload: {
            currentCheckOutDate: occupant.checkOutDate,
            requestedCheckOutDate
          }
        });
        await firebase.update("/", createPrimeRequestWritePayload(requestRecord));
        const emailText = [
          "Prime extension request received.",
          `Booking: ${authResult.session.bookingId}`,
          `Guest UUID: ${guestUuid}`,
          `Guest name: ${guestName}`,
          `Current checkout: ${occupant.checkOutDate}`,
          `Requested checkout: ${requestedCheckOutDate}`,
          `Note: ${note || "(none)"}`,
          `Request ID: ${requestId}`
        ].join("\n");
        const dispatchResult = await dispatchPrimeEmail(
          {
            to: TARGET_EMAIL,
            subject: `[Prime] Extension request ${authResult.session.bookingId}`,
            text: emailText
          },
          env2
        );
        if (env2.RATE_LIMIT) {
          const dedupeKey = `extension-dedupe:${guestUuid}:${requestedCheckOutDate}`;
          await env2.RATE_LIMIT.put(dedupeKey, requestId, {
            expirationTtl: DEDUPE_WINDOW_SECONDS
          });
        }
        return jsonResponse({
          success: true,
          requestId,
          deliveryMode: dispatchResult.deliveryMode,
          message: "Extension request sent. Reception usually replies by email within one business day."
        });
      } catch (error3) {
        console.error("Failed to create extension request:", error3);
        return errorResponse("Failed to submit extension request", 500);
      }
    }, "onRequestPost");
  }
});

// api/find-booking.ts
function generateToken() {
  return crypto.randomUUID().replace(/-/g, "");
}
function computeTokenExpiry(booking, now) {
  const checkout = booking.checkOutDate || booking.checkOut;
  if (checkout) {
    const checkoutDate = new Date(checkout);
    if (!Number.isNaN(checkoutDate.getTime())) {
      const expiresAt = new Date(checkoutDate.getTime() + 48 * 60 * 60 * 1e3);
      return expiresAt.toISOString();
    }
  }
  const fallback = new Date(now.getTime());
  fallback.setDate(fallback.getDate() + TOKEN_TTL_DAYS);
  return fallback.toISOString();
}
function isTokenValid(token) {
  if (!token) return false;
  return new Date(token.expiresAt) > /* @__PURE__ */ new Date();
}
var MAX_ATTEMPTS, WINDOW_MS, TOKEN_TTL_DAYS, onRequestGet6;
var init_find_booking = __esm({
  "api/find-booking.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_firebase_rest();
    MAX_ATTEMPTS = 5;
    WINDOW_MS = 60 * 60 * 1e3;
    TOKEN_TTL_DAYS = 30;
    __name(generateToken, "generateToken");
    __name(computeTokenExpiry, "computeTokenExpiry");
    __name(isTokenValid, "isTokenValid");
    onRequestGet6 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
      const url = new URL(request.url);
      const surname = url.searchParams.get("surname");
      const bookingRef = url.searchParams.get("bookingRef");
      if (!surname || !bookingRef) {
        return errorResponse("surname and bookingRef parameters are required", 400);
      }
      const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
      const rateLimitKey = `find-booking:${clientIP}`;
      if (env2.RATE_LIMIT) {
        const attempts = await env2.RATE_LIMIT.get(rateLimitKey);
        if (attempts && parseInt(attempts, 10) >= MAX_ATTEMPTS) {
          return errorResponse("Too many attempts. Please try again later.", 429);
        }
      }
      try {
        const firebase = new FirebaseRest(env2);
        const allBookings = await firebase.get("bookings");
        if (!allBookings) {
          if (env2.RATE_LIMIT) {
            const currentAttempts = await env2.RATE_LIMIT.get(rateLimitKey);
            const newAttempts = (parseInt(currentAttempts || "0", 10) + 1).toString();
            await env2.RATE_LIMIT.put(rateLimitKey, newAttempts, {
              expirationTtl: WINDOW_MS / 1e3
            });
          }
          return errorResponse("Booking not found", 404);
        }
        const normalizedSurname = surname.toLowerCase().trim();
        const normalizedRef = bookingRef.toUpperCase().trim();
        const matchingBooking = Object.entries(allBookings).find(([_, booking2]) => {
          const bookingLastName = (booking2.guestName || "").split(" ").pop()?.toLowerCase() || "";
          const bookingRefNormalized = (booking2.bookingRef || "").toUpperCase();
          return bookingLastName === normalizedSurname && bookingRefNormalized === normalizedRef;
        });
        if (!matchingBooking) {
          if (env2.RATE_LIMIT) {
            const currentAttempts = await env2.RATE_LIMIT.get(rateLimitKey);
            const newAttempts = (parseInt(currentAttempts || "0", 10) + 1).toString();
            await env2.RATE_LIMIT.put(rateLimitKey, newAttempts, {
              expirationTtl: WINDOW_MS / 1e3
            });
          }
          return errorResponse("Booking not found", 404);
        }
        const [bookingId, booking] = matchingBooking;
        const now = /* @__PURE__ */ new Date();
        let guestPortalToken = booking.guestPortalToken || null;
        if (guestPortalToken) {
          const existingToken = await firebase.get(
            `guestSessionsByToken/${guestPortalToken}`
          );
          if (!isTokenValid(existingToken)) {
            guestPortalToken = null;
          }
        }
        if (!guestPortalToken) {
          const token = generateToken();
          const guestUuid = Array.isArray(booking.occupants) && booking.occupants.length > 0 ? booking.occupants[0] : null;
          await firebase.set(`guestSessionsByToken/${token}`, {
            bookingId,
            guestUuid,
            createdAt: now.toISOString(),
            expiresAt: computeTokenExpiry(booking, now)
          });
          if (booking.guestPortalToken && booking.guestPortalToken !== token) {
            try {
              await firebase.delete(`guestSessionsByToken/${booking.guestPortalToken}`);
            } catch (error3) {
              console.warn("Failed to delete previous guest token:", error3);
            }
          }
          await firebase.update(`bookings/${bookingId}`, { guestPortalToken: token });
          guestPortalToken = token;
        }
        let checkInCode = booking.checkInCode;
        if (!checkInCode) {
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          checkInCode = "";
          for (let i = 0; i < 6; i++) {
            checkInCode += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
          await firebase.update(`bookings/${bookingId}`, { checkInCode });
          await firebase.set(`checkInCodesByCode/${checkInCode}`, {
            bookingId,
            expiresAt: expiresAt.toISOString()
          });
        }
        if (env2.RATE_LIMIT) {
          await env2.RATE_LIMIT.delete(rateLimitKey);
        }
        return jsonResponse({ redirectUrl: `/g/${guestPortalToken}` });
      } catch (error3) {
        console.error("Error finding booking:", error3);
        return errorResponse("Failed to find booking", 500);
      }
    }, "onRequestGet");
  }
});

// api/guest-booking.ts
function getTodayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(/* @__PURE__ */ new Date());
}
function compareIsoDates2(a, b) {
  return a.localeCompare(b);
}
function resolveArrivalState(checkInDate, checkOutDate, isCheckedIn) {
  if (isCheckedIn) {
    return "checked-in";
  }
  const today = getTodayIso();
  if (compareIsoDates2(checkOutDate, today) < 0) {
    return "checked-out";
  }
  if (compareIsoDates2(checkInDate, today) === 0) {
    return "arrival-day";
  }
  if (compareIsoDates2(checkInDate, today) > 0) {
    return "pre-arrival";
  }
  return "checked-in";
}
async function getGuestRequestSummary(firebase, guestUuid) {
  const summary = {
    extension: null,
    bag_drop: null,
    meal_change_exception: null
  };
  const byGuest = await firebase.get(`primeRequests/byGuest/${guestUuid}`);
  if (!byGuest) {
    return summary;
  }
  const requestIds = Object.keys(byGuest);
  const records = await Promise.all(
    requestIds.map((requestId) => firebase.get(`primeRequests/byId/${requestId}`))
  );
  for (const record of records) {
    if (!record) {
      continue;
    }
    if (record.type === "extension") {
      summary.extension = record;
    } else if (record.type === "bag_drop") {
      summary.bag_drop = record;
    } else if (record.type === "meal_change_exception") {
      summary.meal_change_exception = record;
    }
  }
  return summary;
}
var onRequestGet7;
var init_guest_booking = __esm({
  "api/guest-booking.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_firebase_rest();
    init_guest_session();
    __name(getTodayIso, "getTodayIso");
    __name(compareIsoDates2, "compareIsoDates");
    __name(resolveArrivalState, "resolveArrivalState");
    __name(getGuestRequestSummary, "getGuestRequestSummary");
    onRequestGet7 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
      const url = new URL(request.url);
      const token = url.searchParams.get("token");
      try {
        const authResult = await validateGuestSessionToken(token, env2);
        if (authResult instanceof Response) {
          return authResult;
        }
        const firebase = new FirebaseRest(env2);
        const booking = await firebase.get(
          `bookings/${authResult.session.bookingId}`
        );
        if (!booking) {
          return errorResponse("Booking not found", 404);
        }
        const occupantKeys = Object.keys(booking).filter((key) => key.startsWith("occ_"));
        const guestUuid = authResult.session.guestUuid && booking[authResult.session.guestUuid] ? authResult.session.guestUuid : occupantKeys[0] ?? null;
        if (!guestUuid) {
          return errorResponse("Booking occupant not found", 404);
        }
        const occupant = booking[guestUuid] ?? null;
        if (!occupant?.checkInDate || !occupant.checkOutDate) {
          return errorResponse("Booking dates missing", 422);
        }
        const [guestDetails, guestByRoom, bagStorage, preorders, checkins, requestSummary] = await Promise.all([
          firebase.get(`guestsDetails/${authResult.session.bookingId}/${guestUuid}`),
          firebase.get(`guestByRoom/${guestUuid}`),
          firebase.get(`bagStorage/${guestUuid}`),
          firebase.get(`preorder/${guestUuid}`),
          firebase.get(`checkins/${occupant.checkInDate}/${guestUuid}`),
          getGuestRequestSummary(firebase, guestUuid)
        ]);
        const firstName = guestDetails?.firstName ?? occupant.firstName ?? "";
        const lastName = guestDetails?.lastName ?? occupant.lastName ?? "";
        const guestName = `${firstName} ${lastName}`.trim() || "Guest";
        const isCheckedIn = Boolean(checkins);
        const arrivalState = resolveArrivalState(
          occupant.checkInDate,
          occupant.checkOutDate,
          isCheckedIn
        );
        return jsonResponse({
          bookingId: authResult.session.bookingId,
          guestUuid,
          guestName,
          reservationCode: authResult.session.bookingId,
          checkInDate: occupant.checkInDate,
          checkOutDate: occupant.checkOutDate,
          roomNumbers: occupant.roomNumbers ?? [],
          roomAssignment: guestByRoom?.allocated ?? occupant.room ?? occupant.roomNumbers?.[0] ?? "Not assigned",
          isCheckedIn,
          arrivalState,
          preorders: preorders ?? {},
          bagStorage: bagStorage ?? null,
          requestSummary
        });
      } catch (error3) {
        console.error("Error fetching guest booking snapshot:", error3);
        return errorResponse("Failed to fetch guest booking snapshot", 500);
      }
    }, "onRequestGet");
  }
});

// api/guest-session.ts
function normalizeLastName(fullName) {
  if (!fullName) return "";
  return fullName.trim().split(" ").pop()?.toLowerCase() || "";
}
function normalizeInput(input) {
  return (input || "").trim().toLowerCase();
}
function getFirstName(fullName) {
  if (!fullName) return "";
  return fullName.trim().split(" ")[0] || "";
}
function isExpired(expiresAt) {
  return new Date(expiresAt) <= /* @__PURE__ */ new Date();
}
var MAX_ATTEMPTS2, WINDOW_MS2, onRequestGet8, onRequestPost5;
var init_guest_session2 = __esm({
  "api/guest-session.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_firebase_rest();
    MAX_ATTEMPTS2 = 5;
    WINDOW_MS2 = 15 * 60 * 1e3;
    __name(normalizeLastName, "normalizeLastName");
    __name(normalizeInput, "normalizeInput");
    __name(getFirstName, "getFirstName");
    __name(isExpired, "isExpired");
    onRequestGet8 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
      const url = new URL(request.url);
      const token = url.searchParams.get("token");
      if (!token) {
        return errorResponse("token parameter is required", 400);
      }
      try {
        const firebase = new FirebaseRest(env2);
        const session = await firebase.get(`guestSessionsByToken/${token}`);
        if (!session) {
          return errorResponse("Token not found", 404);
        }
        if (isExpired(session.expiresAt)) {
          return errorResponse("Token expired", 410);
        }
        return jsonResponse({ status: "ok", expiresAt: session.expiresAt });
      } catch (error3) {
        console.error("Error validating guest token:", error3);
        return errorResponse("Failed to validate token", 500);
      }
    }, "onRequestGet");
    onRequestPost5 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
      let token = "";
      let lastName = "";
      try {
        const body = await request.json();
        token = body.token || "";
        lastName = body.lastName || "";
      } catch (error3) {
        return errorResponse("Invalid JSON body", 400);
      }
      if (!token || !lastName) {
        return errorResponse("token and lastName are required", 400);
      }
      const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
      const rateLimitKey = `guest-verify:${clientIP}:${token}`;
      if (env2.RATE_LIMIT) {
        const attempts = await env2.RATE_LIMIT.get(rateLimitKey);
        if (attempts && parseInt(attempts, 10) >= MAX_ATTEMPTS2) {
          return errorResponse("Too many attempts. Please try again later.", 429);
        }
      }
      try {
        const firebase = new FirebaseRest(env2);
        const session = await firebase.get(`guestSessionsByToken/${token}`);
        if (!session) {
          return errorResponse("Token not found", 404);
        }
        if (isExpired(session.expiresAt)) {
          return errorResponse("Token expired", 410);
        }
        const booking = await firebase.get(`bookings/${session.bookingId}`);
        if (!booking) {
          return errorResponse("Booking not found", 404);
        }
        const bookingLastName = normalizeLastName(booking.guestName);
        const inputLastName = normalizeInput(lastName);
        if (!bookingLastName || bookingLastName !== inputLastName) {
          if (env2.RATE_LIMIT) {
            const currentAttempts = await env2.RATE_LIMIT.get(rateLimitKey);
            const newAttempts = (parseInt(currentAttempts || "0", 10) + 1).toString();
            await env2.RATE_LIMIT.put(rateLimitKey, newAttempts, {
              expirationTtl: WINDOW_MS2 / 1e3
            });
          }
          return errorResponse("Verification failed", 403);
        }
        if (env2.RATE_LIMIT) {
          await env2.RATE_LIMIT.delete(rateLimitKey);
        }
        return jsonResponse({
          bookingId: session.bookingId,
          guestUuid: session.guestUuid,
          guestFirstName: getFirstName(booking.guestName)
        });
      } catch (error3) {
        console.error("Error verifying guest session:", error3);
        return errorResponse("Failed to verify guest session", 500);
      }
    }, "onRequestPost");
  }
});

// ../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/helpers/util.js
var util, objectUtil, ZodParsedType, getParsedType;
var init_util = __esm({
  "../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/helpers/util.js"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    (function(util2) {
      util2.assertEqual = (_) => {
      };
      function assertIs(_arg) {
      }
      __name(assertIs, "assertIs");
      util2.assertIs = assertIs;
      function assertNever(_x) {
        throw new Error();
      }
      __name(assertNever, "assertNever");
      util2.assertNever = assertNever;
      util2.arrayToEnum = (items) => {
        const obj = {};
        for (const item of items) {
          obj[item] = item;
        }
        return obj;
      };
      util2.getValidEnumValues = (obj) => {
        const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
        const filtered = {};
        for (const k of validKeys) {
          filtered[k] = obj[k];
        }
        return util2.objectValues(filtered);
      };
      util2.objectValues = (obj) => {
        return util2.objectKeys(obj).map(function(e) {
          return obj[e];
        });
      };
      util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
        const keys = [];
        for (const key in object) {
          if (Object.prototype.hasOwnProperty.call(object, key)) {
            keys.push(key);
          }
        }
        return keys;
      };
      util2.find = (arr, checker) => {
        for (const item of arr) {
          if (checker(item))
            return item;
        }
        return void 0;
      };
      util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
      function joinValues(array, separator = " | ") {
        return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
      }
      __name(joinValues, "joinValues");
      util2.joinValues = joinValues;
      util2.jsonStringifyReplacer = (_, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      };
    })(util || (util = {}));
    (function(objectUtil2) {
      objectUtil2.mergeShapes = (first, second) => {
        return {
          ...first,
          ...second
          // second overwrites first
        };
      };
    })(objectUtil || (objectUtil = {}));
    ZodParsedType = util.arrayToEnum([
      "string",
      "nan",
      "number",
      "integer",
      "float",
      "boolean",
      "date",
      "bigint",
      "symbol",
      "function",
      "undefined",
      "null",
      "array",
      "object",
      "unknown",
      "promise",
      "void",
      "never",
      "map",
      "set"
    ]);
    getParsedType = /* @__PURE__ */ __name((data) => {
      const t = typeof data;
      switch (t) {
        case "undefined":
          return ZodParsedType.undefined;
        case "string":
          return ZodParsedType.string;
        case "number":
          return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
        case "boolean":
          return ZodParsedType.boolean;
        case "function":
          return ZodParsedType.function;
        case "bigint":
          return ZodParsedType.bigint;
        case "symbol":
          return ZodParsedType.symbol;
        case "object":
          if (Array.isArray(data)) {
            return ZodParsedType.array;
          }
          if (data === null) {
            return ZodParsedType.null;
          }
          if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
            return ZodParsedType.promise;
          }
          if (typeof Map !== "undefined" && data instanceof Map) {
            return ZodParsedType.map;
          }
          if (typeof Set !== "undefined" && data instanceof Set) {
            return ZodParsedType.set;
          }
          if (typeof Date !== "undefined" && data instanceof Date) {
            return ZodParsedType.date;
          }
          return ZodParsedType.object;
        default:
          return ZodParsedType.unknown;
      }
    }, "getParsedType");
  }
});

// ../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/ZodError.js
var ZodIssueCode, quotelessJson, ZodError;
var init_ZodError = __esm({
  "../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/ZodError.js"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_util();
    ZodIssueCode = util.arrayToEnum([
      "invalid_type",
      "invalid_literal",
      "custom",
      "invalid_union",
      "invalid_union_discriminator",
      "invalid_enum_value",
      "unrecognized_keys",
      "invalid_arguments",
      "invalid_return_type",
      "invalid_date",
      "invalid_string",
      "too_small",
      "too_big",
      "invalid_intersection_types",
      "not_multiple_of",
      "not_finite"
    ]);
    quotelessJson = /* @__PURE__ */ __name((obj) => {
      const json = JSON.stringify(obj, null, 2);
      return json.replace(/"([^"]+)":/g, "$1:");
    }, "quotelessJson");
    ZodError = class _ZodError extends Error {
      static {
        __name(this, "ZodError");
      }
      get errors() {
        return this.issues;
      }
      constructor(issues) {
        super();
        this.issues = [];
        this.addIssue = (sub) => {
          this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
          this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(this, actualProto);
        } else {
          this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
      }
      format(_mapper) {
        const mapper = _mapper || function(issue) {
          return issue.message;
        };
        const fieldErrors = { _errors: [] };
        const processError = /* @__PURE__ */ __name((error3) => {
          for (const issue of error3.issues) {
            if (issue.code === "invalid_union") {
              issue.unionErrors.map(processError);
            } else if (issue.code === "invalid_return_type") {
              processError(issue.returnTypeError);
            } else if (issue.code === "invalid_arguments") {
              processError(issue.argumentsError);
            } else if (issue.path.length === 0) {
              fieldErrors._errors.push(mapper(issue));
            } else {
              let curr = fieldErrors;
              let i = 0;
              while (i < issue.path.length) {
                const el = issue.path[i];
                const terminal = i === issue.path.length - 1;
                if (!terminal) {
                  curr[el] = curr[el] || { _errors: [] };
                } else {
                  curr[el] = curr[el] || { _errors: [] };
                  curr[el]._errors.push(mapper(issue));
                }
                curr = curr[el];
                i++;
              }
            }
          }
        }, "processError");
        processError(this);
        return fieldErrors;
      }
      static assert(value) {
        if (!(value instanceof _ZodError)) {
          throw new Error(`Not a ZodError: ${value}`);
        }
      }
      toString() {
        return this.message;
      }
      get message() {
        return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
      }
      get isEmpty() {
        return this.issues.length === 0;
      }
      flatten(mapper = (issue) => issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues) {
          if (sub.path.length > 0) {
            const firstEl = sub.path[0];
            fieldErrors[firstEl] = fieldErrors[firstEl] || [];
            fieldErrors[firstEl].push(mapper(sub));
          } else {
            formErrors.push(mapper(sub));
          }
        }
        return { formErrors, fieldErrors };
      }
      get formErrors() {
        return this.flatten();
      }
    };
    ZodError.create = (issues) => {
      const error3 = new ZodError(issues);
      return error3;
    };
  }
});

// ../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/locales/en.js
var errorMap, en_default;
var init_en = __esm({
  "../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/locales/en.js"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_ZodError();
    init_util();
    errorMap = /* @__PURE__ */ __name((issue, _ctx) => {
      let message;
      switch (issue.code) {
        case ZodIssueCode.invalid_type:
          if (issue.received === ZodParsedType.undefined) {
            message = "Required";
          } else {
            message = `Expected ${issue.expected}, received ${issue.received}`;
          }
          break;
        case ZodIssueCode.invalid_literal:
          message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
          break;
        case ZodIssueCode.unrecognized_keys:
          message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
          break;
        case ZodIssueCode.invalid_union:
          message = `Invalid input`;
          break;
        case ZodIssueCode.invalid_union_discriminator:
          message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
          break;
        case ZodIssueCode.invalid_enum_value:
          message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
          break;
        case ZodIssueCode.invalid_arguments:
          message = `Invalid function arguments`;
          break;
        case ZodIssueCode.invalid_return_type:
          message = `Invalid function return type`;
          break;
        case ZodIssueCode.invalid_date:
          message = `Invalid date`;
          break;
        case ZodIssueCode.invalid_string:
          if (typeof issue.validation === "object") {
            if ("includes" in issue.validation) {
              message = `Invalid input: must include "${issue.validation.includes}"`;
              if (typeof issue.validation.position === "number") {
                message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
              }
            } else if ("startsWith" in issue.validation) {
              message = `Invalid input: must start with "${issue.validation.startsWith}"`;
            } else if ("endsWith" in issue.validation) {
              message = `Invalid input: must end with "${issue.validation.endsWith}"`;
            } else {
              util.assertNever(issue.validation);
            }
          } else if (issue.validation !== "regex") {
            message = `Invalid ${issue.validation}`;
          } else {
            message = "Invalid";
          }
          break;
        case ZodIssueCode.too_small:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
          else if (issue.type === "bigint")
            message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
          else
            message = "Invalid input";
          break;
        case ZodIssueCode.too_big:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "bigint")
            message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
          else
            message = "Invalid input";
          break;
        case ZodIssueCode.custom:
          message = `Invalid input`;
          break;
        case ZodIssueCode.invalid_intersection_types:
          message = `Intersection results could not be merged`;
          break;
        case ZodIssueCode.not_multiple_of:
          message = `Number must be a multiple of ${issue.multipleOf}`;
          break;
        case ZodIssueCode.not_finite:
          message = "Number must be finite";
          break;
        default:
          message = _ctx.defaultError;
          util.assertNever(issue);
      }
      return { message };
    }, "errorMap");
    en_default = errorMap;
  }
});

// ../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/errors.js
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}
var overrideErrorMap;
var init_errors = __esm({
  "../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/errors.js"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_en();
    overrideErrorMap = en_default;
    __name(setErrorMap, "setErrorMap");
    __name(getErrorMap, "getErrorMap");
  }
});

// ../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/helpers/parseUtil.js
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var makeIssue, EMPTY_PATH, ParseStatus, INVALID, DIRTY, OK, isAborted, isDirty, isValid, isAsync;
var init_parseUtil = __esm({
  "../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/helpers/parseUtil.js"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_errors();
    init_en();
    makeIssue = /* @__PURE__ */ __name((params) => {
      const { data, path, errorMaps, issueData } = params;
      const fullPath = [...path, ...issueData.path || []];
      const fullIssue = {
        ...issueData,
        path: fullPath
      };
      if (issueData.message !== void 0) {
        return {
          ...issueData,
          path: fullPath,
          message: issueData.message
        };
      }
      let errorMessage = "";
      const maps = errorMaps.filter((m) => !!m).slice().reverse();
      for (const map of maps) {
        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
      }
      return {
        ...issueData,
        path: fullPath,
        message: errorMessage
      };
    }, "makeIssue");
    EMPTY_PATH = [];
    __name(addIssueToContext, "addIssueToContext");
    ParseStatus = class _ParseStatus {
      static {
        __name(this, "ParseStatus");
      }
      constructor() {
        this.value = "valid";
      }
      dirty() {
        if (this.value === "valid")
          this.value = "dirty";
      }
      abort() {
        if (this.value !== "aborted")
          this.value = "aborted";
      }
      static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results) {
          if (s.status === "aborted")
            return INVALID;
          if (s.status === "dirty")
            status.dirty();
          arrayValue.push(s.value);
        }
        return { status: status.value, value: arrayValue };
      }
      static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value
          });
        }
        return _ParseStatus.mergeObjectSync(status, syncPairs);
      }
      static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
          const { key, value } = pair;
          if (key.status === "aborted")
            return INVALID;
          if (value.status === "aborted")
            return INVALID;
          if (key.status === "dirty")
            status.dirty();
          if (value.status === "dirty")
            status.dirty();
          if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
            finalObject[key.value] = value.value;
          }
        }
        return { status: status.value, value: finalObject };
      }
    };
    INVALID = Object.freeze({
      status: "aborted"
    });
    DIRTY = /* @__PURE__ */ __name((value) => ({ status: "dirty", value }), "DIRTY");
    OK = /* @__PURE__ */ __name((value) => ({ status: "valid", value }), "OK");
    isAborted = /* @__PURE__ */ __name((x) => x.status === "aborted", "isAborted");
    isDirty = /* @__PURE__ */ __name((x) => x.status === "dirty", "isDirty");
    isValid = /* @__PURE__ */ __name((x) => x.status === "valid", "isValid");
    isAsync = /* @__PURE__ */ __name((x) => typeof Promise !== "undefined" && x instanceof Promise, "isAsync");
  }
});

// ../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/helpers/typeAliases.js
var init_typeAliases = __esm({
  "../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/helpers/typeAliases.js"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
  }
});

// ../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
var init_errorUtil = __esm({
  "../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/helpers/errorUtil.js"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    (function(errorUtil2) {
      errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
      errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
    })(errorUtil || (errorUtil = {}));
  }
});

// ../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/types.js
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = /* @__PURE__ */ __name((iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  }, "customMap");
  return { errorMap: customMap, description };
}
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var ParseInputLazyPath, handleResult, ZodType, cuidRegex, cuid2Regex, ulidRegex, uuidRegex, nanoidRegex, jwtRegex, durationRegex, emailRegex, _emojiRegex, emojiRegex, ipv4Regex, ipv4CidrRegex, ipv6Regex, ipv6CidrRegex, base64Regex, base64urlRegex, dateRegexSource, dateRegex, ZodString, ZodNumber, ZodBigInt, ZodBoolean, ZodDate, ZodSymbol, ZodUndefined, ZodNull, ZodAny, ZodUnknown, ZodNever, ZodVoid, ZodArray, ZodObject, ZodUnion, getDiscriminator, ZodDiscriminatedUnion, ZodIntersection, ZodTuple, ZodRecord, ZodMap, ZodSet, ZodFunction, ZodLazy, ZodLiteral, ZodEnum, ZodNativeEnum, ZodPromise, ZodEffects, ZodOptional, ZodNullable, ZodDefault, ZodCatch, ZodNaN, BRAND, ZodBranded, ZodPipeline, ZodReadonly, late, ZodFirstPartyTypeKind, instanceOfType, stringType, numberType, nanType, bigIntType, booleanType, dateType, symbolType, undefinedType, nullType, anyType, unknownType, neverType, voidType, arrayType, objectType, strictObjectType, unionType, discriminatedUnionType, intersectionType, tupleType, recordType, mapType, setType, functionType, lazyType, literalType, enumType, nativeEnumType, promiseType, effectsType, optionalType, nullableType, preprocessType, pipelineType, ostring, onumber, oboolean, coerce, NEVER;
var init_types = __esm({
  "../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/types.js"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_ZodError();
    init_errors();
    init_errorUtil();
    init_parseUtil();
    init_util();
    ParseInputLazyPath = class {
      static {
        __name(this, "ParseInputLazyPath");
      }
      constructor(parent, value, path, key) {
        this._cachedPath = [];
        this.parent = parent;
        this.data = value;
        this._path = path;
        this._key = key;
      }
      get path() {
        if (!this._cachedPath.length) {
          if (Array.isArray(this._key)) {
            this._cachedPath.push(...this._path, ...this._key);
          } else {
            this._cachedPath.push(...this._path, this._key);
          }
        }
        return this._cachedPath;
      }
    };
    handleResult = /* @__PURE__ */ __name((ctx, result) => {
      if (isValid(result)) {
        return { success: true, data: result.value };
      } else {
        if (!ctx.common.issues.length) {
          throw new Error("Validation failed but no issues detected.");
        }
        return {
          success: false,
          get error() {
            if (this._error)
              return this._error;
            const error3 = new ZodError(ctx.common.issues);
            this._error = error3;
            return this._error;
          }
        };
      }
    }, "handleResult");
    __name(processCreateParams, "processCreateParams");
    ZodType = class {
      static {
        __name(this, "ZodType");
      }
      get description() {
        return this._def.description;
      }
      _getType(input) {
        return getParsedType(input.data);
      }
      _getOrReturnCtx(input, ctx) {
        return ctx || {
          common: input.parent.common,
          data: input.data,
          parsedType: getParsedType(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        };
      }
      _processInputParams(input) {
        return {
          status: new ParseStatus(),
          ctx: {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent
          }
        };
      }
      _parseSync(input) {
        const result = this._parse(input);
        if (isAsync(result)) {
          throw new Error("Synchronous parse encountered promise.");
        }
        return result;
      }
      _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
      }
      parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      safeParse(data, params) {
        const ctx = {
          common: {
            issues: [],
            async: params?.async ?? false,
            contextualErrorMap: params?.errorMap
          },
          path: params?.path || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        const result = this._parseSync({ data, path: ctx.path, parent: ctx });
        return handleResult(ctx, result);
      }
      "~validate"(data) {
        const ctx = {
          common: {
            issues: [],
            async: !!this["~standard"].async
          },
          path: [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        if (!this["~standard"].async) {
          try {
            const result = this._parseSync({ data, path: [], parent: ctx });
            return isValid(result) ? {
              value: result.value
            } : {
              issues: ctx.common.issues
            };
          } catch (err) {
            if (err?.message?.toLowerCase()?.includes("encountered")) {
              this["~standard"].async = true;
            }
            ctx.common = {
              issues: [],
              async: true
            };
          }
        }
        return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        });
      }
      async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      async safeParseAsync(data, params) {
        const ctx = {
          common: {
            issues: [],
            contextualErrorMap: params?.errorMap,
            async: true
          },
          path: params?.path || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
        const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
      }
      refine(check, message) {
        const getIssueProperties = /* @__PURE__ */ __name((val) => {
          if (typeof message === "string" || typeof message === "undefined") {
            return { message };
          } else if (typeof message === "function") {
            return message(val);
          } else {
            return message;
          }
        }, "getIssueProperties");
        return this._refinement((val, ctx) => {
          const result = check(val);
          const setError = /* @__PURE__ */ __name(() => ctx.addIssue({
            code: ZodIssueCode.custom,
            ...getIssueProperties(val)
          }), "setError");
          if (typeof Promise !== "undefined" && result instanceof Promise) {
            return result.then((data) => {
              if (!data) {
                setError();
                return false;
              } else {
                return true;
              }
            });
          }
          if (!result) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      refinement(check, refinementData) {
        return this._refinement((val, ctx) => {
          if (!check(val)) {
            ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
            return false;
          } else {
            return true;
          }
        });
      }
      _refinement(refinement) {
        return new ZodEffects({
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "refinement", refinement }
        });
      }
      superRefine(refinement) {
        return this._refinement(refinement);
      }
      constructor(def) {
        this.spa = this.safeParseAsync;
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.brand = this.brand.bind(this);
        this.default = this.default.bind(this);
        this.catch = this.catch.bind(this);
        this.describe = this.describe.bind(this);
        this.pipe = this.pipe.bind(this);
        this.readonly = this.readonly.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
        this["~standard"] = {
          version: 1,
          vendor: "zod",
          validate: /* @__PURE__ */ __name((data) => this["~validate"](data), "validate")
        };
      }
      optional() {
        return ZodOptional.create(this, this._def);
      }
      nullable() {
        return ZodNullable.create(this, this._def);
      }
      nullish() {
        return this.nullable().optional();
      }
      array() {
        return ZodArray.create(this);
      }
      promise() {
        return ZodPromise.create(this, this._def);
      }
      or(option) {
        return ZodUnion.create([this, option], this._def);
      }
      and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
      }
      transform(transform) {
        return new ZodEffects({
          ...processCreateParams(this._def),
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "transform", transform }
        });
      }
      default(def) {
        const defaultValueFunc = typeof def === "function" ? def : () => def;
        return new ZodDefault({
          ...processCreateParams(this._def),
          innerType: this,
          defaultValue: defaultValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodDefault
        });
      }
      brand() {
        return new ZodBranded({
          typeName: ZodFirstPartyTypeKind.ZodBranded,
          type: this,
          ...processCreateParams(this._def)
        });
      }
      catch(def) {
        const catchValueFunc = typeof def === "function" ? def : () => def;
        return new ZodCatch({
          ...processCreateParams(this._def),
          innerType: this,
          catchValue: catchValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodCatch
        });
      }
      describe(description) {
        const This = this.constructor;
        return new This({
          ...this._def,
          description
        });
      }
      pipe(target) {
        return ZodPipeline.create(this, target);
      }
      readonly() {
        return ZodReadonly.create(this);
      }
      isOptional() {
        return this.safeParse(void 0).success;
      }
      isNullable() {
        return this.safeParse(null).success;
      }
    };
    cuidRegex = /^c[^\s-]{8,}$/i;
    cuid2Regex = /^[0-9a-z]+$/;
    ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
    uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
    nanoidRegex = /^[a-z0-9_-]{21}$/i;
    jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
    emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
    _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
    ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
    ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
    ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
    base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
    dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
    dateRegex = new RegExp(`^${dateRegexSource}$`);
    __name(timeRegexSource, "timeRegexSource");
    __name(timeRegex, "timeRegex");
    __name(datetimeRegex, "datetimeRegex");
    __name(isValidIP, "isValidIP");
    __name(isValidJWT, "isValidJWT");
    __name(isValidCidr, "isValidCidr");
    ZodString = class _ZodString extends ZodType {
      static {
        __name(this, "ZodString");
      }
      _parse(input) {
        if (this._def.coerce) {
          input.data = String(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.string) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.string,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        const status = new ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.length < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.length > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "length") {
            const tooBig = input.data.length > check.value;
            const tooSmall = input.data.length < check.value;
            if (tooBig || tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              if (tooBig) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.too_big,
                  maximum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              } else if (tooSmall) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.too_small,
                  minimum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              }
              status.dirty();
            }
          } else if (check.kind === "email") {
            if (!emailRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "email",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "emoji") {
            if (!emojiRegex) {
              emojiRegex = new RegExp(_emojiRegex, "u");
            }
            if (!emojiRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "emoji",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "uuid") {
            if (!uuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "uuid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "nanoid") {
            if (!nanoidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "nanoid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid") {
            if (!cuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cuid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid2") {
            if (!cuid2Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cuid2",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ulid") {
            if (!ulidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "ulid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "url") {
            try {
              new URL(input.data);
            } catch {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "url",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "regex") {
            check.regex.lastIndex = 0;
            const testResult = check.regex.test(input.data);
            if (!testResult) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "regex",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "trim") {
            input.data = input.data.trim();
          } else if (check.kind === "includes") {
            if (!input.data.includes(check.value, check.position)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { includes: check.value, position: check.position },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "toLowerCase") {
            input.data = input.data.toLowerCase();
          } else if (check.kind === "toUpperCase") {
            input.data = input.data.toUpperCase();
          } else if (check.kind === "startsWith") {
            if (!input.data.startsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { startsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "endsWith") {
            if (!input.data.endsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { endsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "datetime") {
            const regex = datetimeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "datetime",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "date") {
            const regex = dateRegex;
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "date",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "time") {
            const regex = timeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "time",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "duration") {
            if (!durationRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "duration",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ip") {
            if (!isValidIP(input.data, check.version)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "ip",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "jwt") {
            if (!isValidJWT(input.data, check.alg)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "jwt",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cidr") {
            if (!isValidCidr(input.data, check.version)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cidr",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "base64") {
            if (!base64Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "base64",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "base64url") {
            if (!base64urlRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "base64url",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      _regex(regex, validation, message) {
        return this.refinement((data) => regex.test(data), {
          validation,
          code: ZodIssueCode.invalid_string,
          ...errorUtil.errToObj(message)
        });
      }
      _addCheck(check) {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      email(message) {
        return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
      }
      url(message) {
        return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
      }
      emoji(message) {
        return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
      }
      uuid(message) {
        return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
      }
      nanoid(message) {
        return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
      }
      cuid(message) {
        return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
      }
      cuid2(message) {
        return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
      }
      ulid(message) {
        return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
      }
      base64(message) {
        return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
      }
      base64url(message) {
        return this._addCheck({
          kind: "base64url",
          ...errorUtil.errToObj(message)
        });
      }
      jwt(options) {
        return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
      }
      ip(options) {
        return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
      }
      cidr(options) {
        return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
      }
      datetime(options) {
        if (typeof options === "string") {
          return this._addCheck({
            kind: "datetime",
            precision: null,
            offset: false,
            local: false,
            message: options
          });
        }
        return this._addCheck({
          kind: "datetime",
          precision: typeof options?.precision === "undefined" ? null : options?.precision,
          offset: options?.offset ?? false,
          local: options?.local ?? false,
          ...errorUtil.errToObj(options?.message)
        });
      }
      date(message) {
        return this._addCheck({ kind: "date", message });
      }
      time(options) {
        if (typeof options === "string") {
          return this._addCheck({
            kind: "time",
            precision: null,
            message: options
          });
        }
        return this._addCheck({
          kind: "time",
          precision: typeof options?.precision === "undefined" ? null : options?.precision,
          ...errorUtil.errToObj(options?.message)
        });
      }
      duration(message) {
        return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
      }
      regex(regex, message) {
        return this._addCheck({
          kind: "regex",
          regex,
          ...errorUtil.errToObj(message)
        });
      }
      includes(value, options) {
        return this._addCheck({
          kind: "includes",
          value,
          position: options?.position,
          ...errorUtil.errToObj(options?.message)
        });
      }
      startsWith(value, message) {
        return this._addCheck({
          kind: "startsWith",
          value,
          ...errorUtil.errToObj(message)
        });
      }
      endsWith(value, message) {
        return this._addCheck({
          kind: "endsWith",
          value,
          ...errorUtil.errToObj(message)
        });
      }
      min(minLength, message) {
        return this._addCheck({
          kind: "min",
          value: minLength,
          ...errorUtil.errToObj(message)
        });
      }
      max(maxLength, message) {
        return this._addCheck({
          kind: "max",
          value: maxLength,
          ...errorUtil.errToObj(message)
        });
      }
      length(len, message) {
        return this._addCheck({
          kind: "length",
          value: len,
          ...errorUtil.errToObj(message)
        });
      }
      /**
       * Equivalent to `.min(1)`
       */
      nonempty(message) {
        return this.min(1, errorUtil.errToObj(message));
      }
      trim() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "trim" }]
        });
      }
      toLowerCase() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toLowerCase" }]
        });
      }
      toUpperCase() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toUpperCase" }]
        });
      }
      get isDatetime() {
        return !!this._def.checks.find((ch) => ch.kind === "datetime");
      }
      get isDate() {
        return !!this._def.checks.find((ch) => ch.kind === "date");
      }
      get isTime() {
        return !!this._def.checks.find((ch) => ch.kind === "time");
      }
      get isDuration() {
        return !!this._def.checks.find((ch) => ch.kind === "duration");
      }
      get isEmail() {
        return !!this._def.checks.find((ch) => ch.kind === "email");
      }
      get isURL() {
        return !!this._def.checks.find((ch) => ch.kind === "url");
      }
      get isEmoji() {
        return !!this._def.checks.find((ch) => ch.kind === "emoji");
      }
      get isUUID() {
        return !!this._def.checks.find((ch) => ch.kind === "uuid");
      }
      get isNANOID() {
        return !!this._def.checks.find((ch) => ch.kind === "nanoid");
      }
      get isCUID() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid");
      }
      get isCUID2() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid2");
      }
      get isULID() {
        return !!this._def.checks.find((ch) => ch.kind === "ulid");
      }
      get isIP() {
        return !!this._def.checks.find((ch) => ch.kind === "ip");
      }
      get isCIDR() {
        return !!this._def.checks.find((ch) => ch.kind === "cidr");
      }
      get isBase64() {
        return !!this._def.checks.find((ch) => ch.kind === "base64");
      }
      get isBase64url() {
        return !!this._def.checks.find((ch) => ch.kind === "base64url");
      }
      get minLength() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxLength() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    ZodString.create = (params) => {
      return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params)
      });
    };
    __name(floatSafeRemainder, "floatSafeRemainder");
    ZodNumber = class _ZodNumber extends ZodType {
      static {
        __name(this, "ZodNumber");
      }
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
        this.step = this.multipleOf;
      }
      _parse(input) {
        if (this._def.coerce) {
          input.data = Number(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.number) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.number,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        let ctx = void 0;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "int") {
            if (!util.isInteger(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: "integer",
                received: "float",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (floatSafeRemainder(input.data, check.value) !== 0) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "finite") {
            if (!Number.isFinite(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_finite,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new _ZodNumber({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new _ZodNumber({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      int(message) {
        return this._addCheck({
          kind: "int",
          message: errorUtil.toString(message)
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil.toString(message)
        });
      }
      finite(message) {
        return this._addCheck({
          kind: "finite",
          message: errorUtil.toString(message)
        });
      }
      safe(message) {
        return this._addCheck({
          kind: "min",
          inclusive: true,
          value: Number.MIN_SAFE_INTEGER,
          message: errorUtil.toString(message)
        })._addCheck({
          kind: "max",
          inclusive: true,
          value: Number.MAX_SAFE_INTEGER,
          message: errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
      get isInt() {
        return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
      }
      get isFinite() {
        let max = null;
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
            return true;
          } else if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          } else if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return Number.isFinite(min) && Number.isFinite(max);
      }
    };
    ZodNumber.create = (params) => {
      return new ZodNumber({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodNumber,
        coerce: params?.coerce || false,
        ...processCreateParams(params)
      });
    };
    ZodBigInt = class _ZodBigInt extends ZodType {
      static {
        __name(this, "ZodBigInt");
      }
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
      }
      _parse(input) {
        if (this._def.coerce) {
          try {
            input.data = BigInt(input.data);
          } catch {
            return this._getInvalidInput(input);
          }
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.bigint) {
          return this._getInvalidInput(input);
        }
        let ctx = void 0;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                type: "bigint",
                minimum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                type: "bigint",
                maximum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (input.data % check.value !== BigInt(0)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      _getInvalidInput(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.bigint,
          received: ctx.parsedType
        });
        return INVALID;
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new _ZodBigInt({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new _ZodBigInt({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    ZodBigInt.create = (params) => {
      return new ZodBigInt({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params)
      });
    };
    ZodBoolean = class extends ZodType {
      static {
        __name(this, "ZodBoolean");
      }
      _parse(input) {
        if (this._def.coerce) {
          input.data = Boolean(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.boolean) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.boolean,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodBoolean.create = (params) => {
      return new ZodBoolean({
        typeName: ZodFirstPartyTypeKind.ZodBoolean,
        coerce: params?.coerce || false,
        ...processCreateParams(params)
      });
    };
    ZodDate = class _ZodDate extends ZodType {
      static {
        __name(this, "ZodDate");
      }
      _parse(input) {
        if (this._def.coerce) {
          input.data = new Date(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.date) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.date,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        if (Number.isNaN(input.data.getTime())) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_date
          });
          return INVALID;
        }
        const status = new ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.getTime() < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                message: check.message,
                inclusive: true,
                exact: false,
                minimum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.getTime() > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                message: check.message,
                inclusive: true,
                exact: false,
                maximum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return {
          status: status.value,
          value: new Date(input.data.getTime())
        };
      }
      _addCheck(check) {
        return new _ZodDate({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      min(minDate, message) {
        return this._addCheck({
          kind: "min",
          value: minDate.getTime(),
          message: errorUtil.toString(message)
        });
      }
      max(maxDate, message) {
        return this._addCheck({
          kind: "max",
          value: maxDate.getTime(),
          message: errorUtil.toString(message)
        });
      }
      get minDate() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min != null ? new Date(min) : null;
      }
      get maxDate() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max != null ? new Date(max) : null;
      }
    };
    ZodDate.create = (params) => {
      return new ZodDate({
        checks: [],
        coerce: params?.coerce || false,
        typeName: ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params)
      });
    };
    ZodSymbol = class extends ZodType {
      static {
        __name(this, "ZodSymbol");
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.symbol) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.symbol,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodSymbol.create = (params) => {
      return new ZodSymbol({
        typeName: ZodFirstPartyTypeKind.ZodSymbol,
        ...processCreateParams(params)
      });
    };
    ZodUndefined = class extends ZodType {
      static {
        __name(this, "ZodUndefined");
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.undefined,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodUndefined.create = (params) => {
      return new ZodUndefined({
        typeName: ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params)
      });
    };
    ZodNull = class extends ZodType {
      static {
        __name(this, "ZodNull");
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.null) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.null,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodNull.create = (params) => {
      return new ZodNull({
        typeName: ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params)
      });
    };
    ZodAny = class extends ZodType {
      static {
        __name(this, "ZodAny");
      }
      constructor() {
        super(...arguments);
        this._any = true;
      }
      _parse(input) {
        return OK(input.data);
      }
    };
    ZodAny.create = (params) => {
      return new ZodAny({
        typeName: ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params)
      });
    };
    ZodUnknown = class extends ZodType {
      static {
        __name(this, "ZodUnknown");
      }
      constructor() {
        super(...arguments);
        this._unknown = true;
      }
      _parse(input) {
        return OK(input.data);
      }
    };
    ZodUnknown.create = (params) => {
      return new ZodUnknown({
        typeName: ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params)
      });
    };
    ZodNever = class extends ZodType {
      static {
        __name(this, "ZodNever");
      }
      _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.never,
          received: ctx.parsedType
        });
        return INVALID;
      }
    };
    ZodNever.create = (params) => {
      return new ZodNever({
        typeName: ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params)
      });
    };
    ZodVoid = class extends ZodType {
      static {
        __name(this, "ZodVoid");
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.void,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodVoid.create = (params) => {
      return new ZodVoid({
        typeName: ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params)
      });
    };
    ZodArray = class _ZodArray extends ZodType {
      static {
        __name(this, "ZodArray");
      }
      _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== ZodParsedType.array) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.array,
            received: ctx.parsedType
          });
          return INVALID;
        }
        if (def.exactLength !== null) {
          const tooBig = ctx.data.length > def.exactLength.value;
          const tooSmall = ctx.data.length < def.exactLength.value;
          if (tooBig || tooSmall) {
            addIssueToContext(ctx, {
              code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
              minimum: tooSmall ? def.exactLength.value : void 0,
              maximum: tooBig ? def.exactLength.value : void 0,
              type: "array",
              inclusive: true,
              exact: true,
              message: def.exactLength.message
            });
            status.dirty();
          }
        }
        if (def.minLength !== null) {
          if (ctx.data.length < def.minLength.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: def.minLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.minLength.message
            });
            status.dirty();
          }
        }
        if (def.maxLength !== null) {
          if (ctx.data.length > def.maxLength.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: def.maxLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.maxLength.message
            });
            status.dirty();
          }
        }
        if (ctx.common.async) {
          return Promise.all([...ctx.data].map((item, i) => {
            return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
          })).then((result2) => {
            return ParseStatus.mergeArray(status, result2);
          });
        }
        const result = [...ctx.data].map((item, i) => {
          return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        });
        return ParseStatus.mergeArray(status, result);
      }
      get element() {
        return this._def.type;
      }
      min(minLength, message) {
        return new _ZodArray({
          ...this._def,
          minLength: { value: minLength, message: errorUtil.toString(message) }
        });
      }
      max(maxLength, message) {
        return new _ZodArray({
          ...this._def,
          maxLength: { value: maxLength, message: errorUtil.toString(message) }
        });
      }
      length(len, message) {
        return new _ZodArray({
          ...this._def,
          exactLength: { value: len, message: errorUtil.toString(message) }
        });
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    ZodArray.create = (schema, params) => {
      return new ZodArray({
        type: schema,
        minLength: null,
        maxLength: null,
        exactLength: null,
        typeName: ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params)
      });
    };
    __name(deepPartialify, "deepPartialify");
    ZodObject = class _ZodObject extends ZodType {
      static {
        __name(this, "ZodObject");
      }
      constructor() {
        super(...arguments);
        this._cached = null;
        this.nonstrict = this.passthrough;
        this.augment = this.extend;
      }
      _getCached() {
        if (this._cached !== null)
          return this._cached;
        const shape = this._def.shape();
        const keys = util.objectKeys(shape);
        this._cached = { shape, keys };
        return this._cached;
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.object) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
          for (const key in ctx.data) {
            if (!shapeKeys.includes(key)) {
              extraKeys.push(key);
            }
          }
        }
        const pairs = [];
        for (const key of shapeKeys) {
          const keyValidator = shape[key];
          const value = ctx.data[key];
          pairs.push({
            key: { status: "valid", value: key },
            value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (this._def.catchall instanceof ZodNever) {
          const unknownKeys = this._def.unknownKeys;
          if (unknownKeys === "passthrough") {
            for (const key of extraKeys) {
              pairs.push({
                key: { status: "valid", value: key },
                value: { status: "valid", value: ctx.data[key] }
              });
            }
          } else if (unknownKeys === "strict") {
            if (extraKeys.length > 0) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.unrecognized_keys,
                keys: extraKeys
              });
              status.dirty();
            }
          } else if (unknownKeys === "strip") {
          } else {
            throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
          }
        } else {
          const catchall = this._def.catchall;
          for (const key of extraKeys) {
            const value = ctx.data[key];
            pairs.push({
              key: { status: "valid", value: key },
              value: catchall._parse(
                new ParseInputLazyPath(ctx, value, ctx.path, key)
                //, ctx.child(key), value, getParsedType(value)
              ),
              alwaysSet: key in ctx.data
            });
          }
        }
        if (ctx.common.async) {
          return Promise.resolve().then(async () => {
            const syncPairs = [];
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              syncPairs.push({
                key,
                value,
                alwaysSet: pair.alwaysSet
              });
            }
            return syncPairs;
          }).then((syncPairs) => {
            return ParseStatus.mergeObjectSync(status, syncPairs);
          });
        } else {
          return ParseStatus.mergeObjectSync(status, pairs);
        }
      }
      get shape() {
        return this._def.shape();
      }
      strict(message) {
        errorUtil.errToObj;
        return new _ZodObject({
          ...this._def,
          unknownKeys: "strict",
          ...message !== void 0 ? {
            errorMap: /* @__PURE__ */ __name((issue, ctx) => {
              const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
              if (issue.code === "unrecognized_keys")
                return {
                  message: errorUtil.errToObj(message).message ?? defaultError
                };
              return {
                message: defaultError
              };
            }, "errorMap")
          } : {}
        });
      }
      strip() {
        return new _ZodObject({
          ...this._def,
          unknownKeys: "strip"
        });
      }
      passthrough() {
        return new _ZodObject({
          ...this._def,
          unknownKeys: "passthrough"
        });
      }
      // const AugmentFactory =
      //   <Def extends ZodObjectDef>(def: Def) =>
      //   <Augmentation extends ZodRawShape>(
      //     augmentation: Augmentation
      //   ): ZodObject<
      //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
      //     Def["unknownKeys"],
      //     Def["catchall"]
      //   > => {
      //     return new ZodObject({
      //       ...def,
      //       shape: () => ({
      //         ...def.shape(),
      //         ...augmentation,
      //       }),
      //     }) as any;
      //   };
      extend(augmentation) {
        return new _ZodObject({
          ...this._def,
          shape: /* @__PURE__ */ __name(() => ({
            ...this._def.shape(),
            ...augmentation
          }), "shape")
        });
      }
      /**
       * Prior to zod@1.0.12 there was a bug in the
       * inferred type of merged objects. Please
       * upgrade if you are experiencing issues.
       */
      merge(merging) {
        const merged = new _ZodObject({
          unknownKeys: merging._def.unknownKeys,
          catchall: merging._def.catchall,
          shape: /* @__PURE__ */ __name(() => ({
            ...this._def.shape(),
            ...merging._def.shape()
          }), "shape"),
          typeName: ZodFirstPartyTypeKind.ZodObject
        });
        return merged;
      }
      // merge<
      //   Incoming extends AnyZodObject,
      //   Augmentation extends Incoming["shape"],
      //   NewOutput extends {
      //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
      //       ? Augmentation[k]["_output"]
      //       : k extends keyof Output
      //       ? Output[k]
      //       : never;
      //   },
      //   NewInput extends {
      //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
      //       ? Augmentation[k]["_input"]
      //       : k extends keyof Input
      //       ? Input[k]
      //       : never;
      //   }
      // >(
      //   merging: Incoming
      // ): ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"],
      //   NewOutput,
      //   NewInput
      // > {
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      setKey(key, schema) {
        return this.augment({ [key]: schema });
      }
      // merge<Incoming extends AnyZodObject>(
      //   merging: Incoming
      // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
      // ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"]
      // > {
      //   // const mergedShape = objectUtil.mergeShapes(
      //   //   this._def.shape(),
      //   //   merging._def.shape()
      //   // );
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      catchall(index) {
        return new _ZodObject({
          ...this._def,
          catchall: index
        });
      }
      pick(mask) {
        const shape = {};
        for (const key of util.objectKeys(mask)) {
          if (mask[key] && this.shape[key]) {
            shape[key] = this.shape[key];
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: /* @__PURE__ */ __name(() => shape, "shape")
        });
      }
      omit(mask) {
        const shape = {};
        for (const key of util.objectKeys(this.shape)) {
          if (!mask[key]) {
            shape[key] = this.shape[key];
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: /* @__PURE__ */ __name(() => shape, "shape")
        });
      }
      /**
       * @deprecated
       */
      deepPartial() {
        return deepPartialify(this);
      }
      partial(mask) {
        const newShape = {};
        for (const key of util.objectKeys(this.shape)) {
          const fieldSchema = this.shape[key];
          if (mask && !mask[key]) {
            newShape[key] = fieldSchema;
          } else {
            newShape[key] = fieldSchema.optional();
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: /* @__PURE__ */ __name(() => newShape, "shape")
        });
      }
      required(mask) {
        const newShape = {};
        for (const key of util.objectKeys(this.shape)) {
          if (mask && !mask[key]) {
            newShape[key] = this.shape[key];
          } else {
            const fieldSchema = this.shape[key];
            let newField = fieldSchema;
            while (newField instanceof ZodOptional) {
              newField = newField._def.innerType;
            }
            newShape[key] = newField;
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: /* @__PURE__ */ __name(() => newShape, "shape")
        });
      }
      keyof() {
        return createZodEnum(util.objectKeys(this.shape));
      }
    };
    ZodObject.create = (shape, params) => {
      return new ZodObject({
        shape: /* @__PURE__ */ __name(() => shape, "shape"),
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject.strictCreate = (shape, params) => {
      return new ZodObject({
        shape: /* @__PURE__ */ __name(() => shape, "shape"),
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject.lazycreate = (shape, params) => {
      return new ZodObject({
        shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodUnion = class extends ZodType {
      static {
        __name(this, "ZodUnion");
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
          for (const result of results) {
            if (result.result.status === "valid") {
              return result.result;
            }
          }
          for (const result of results) {
            if (result.result.status === "dirty") {
              ctx.common.issues.push(...result.ctx.common.issues);
              return result.result;
            }
          }
          const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors
          });
          return INVALID;
        }
        __name(handleResults, "handleResults");
        if (ctx.common.async) {
          return Promise.all(options.map(async (option) => {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            return {
              result: await option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: childCtx
              }),
              ctx: childCtx
            };
          })).then(handleResults);
        } else {
          let dirty = void 0;
          const issues = [];
          for (const option of options) {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            const result = option._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            });
            if (result.status === "valid") {
              return result;
            } else if (result.status === "dirty" && !dirty) {
              dirty = { result, ctx: childCtx };
            }
            if (childCtx.common.issues.length) {
              issues.push(childCtx.common.issues);
            }
          }
          if (dirty) {
            ctx.common.issues.push(...dirty.ctx.common.issues);
            return dirty.result;
          }
          const unionErrors = issues.map((issues2) => new ZodError(issues2));
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors
          });
          return INVALID;
        }
      }
      get options() {
        return this._def.options;
      }
    };
    ZodUnion.create = (types, params) => {
      return new ZodUnion({
        options: types,
        typeName: ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params)
      });
    };
    getDiscriminator = /* @__PURE__ */ __name((type) => {
      if (type instanceof ZodLazy) {
        return getDiscriminator(type.schema);
      } else if (type instanceof ZodEffects) {
        return getDiscriminator(type.innerType());
      } else if (type instanceof ZodLiteral) {
        return [type.value];
      } else if (type instanceof ZodEnum) {
        return type.options;
      } else if (type instanceof ZodNativeEnum) {
        return util.objectValues(type.enum);
      } else if (type instanceof ZodDefault) {
        return getDiscriminator(type._def.innerType);
      } else if (type instanceof ZodUndefined) {
        return [void 0];
      } else if (type instanceof ZodNull) {
        return [null];
      } else if (type instanceof ZodOptional) {
        return [void 0, ...getDiscriminator(type.unwrap())];
      } else if (type instanceof ZodNullable) {
        return [null, ...getDiscriminator(type.unwrap())];
      } else if (type instanceof ZodBranded) {
        return getDiscriminator(type.unwrap());
      } else if (type instanceof ZodReadonly) {
        return getDiscriminator(type.unwrap());
      } else if (type instanceof ZodCatch) {
        return getDiscriminator(type._def.innerType);
      } else {
        return [];
      }
    }, "getDiscriminator");
    ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
      static {
        __name(this, "ZodDiscriminatedUnion");
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.optionsMap.get(discriminatorValue);
        if (!option) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union_discriminator,
            options: Array.from(this.optionsMap.keys()),
            path: [discriminator]
          });
          return INVALID;
        }
        if (ctx.common.async) {
          return option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
        } else {
          return option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
        }
      }
      get discriminator() {
        return this._def.discriminator;
      }
      get options() {
        return this._def.options;
      }
      get optionsMap() {
        return this._def.optionsMap;
      }
      /**
       * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
       * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
       * have a different value for each object in the union.
       * @param discriminator the name of the discriminator property
       * @param types an array of object schemas
       * @param params
       */
      static create(discriminator, options, params) {
        const optionsMap = /* @__PURE__ */ new Map();
        for (const type of options) {
          const discriminatorValues = getDiscriminator(type.shape[discriminator]);
          if (!discriminatorValues.length) {
            throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
          }
          for (const value of discriminatorValues) {
            if (optionsMap.has(value)) {
              throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
            }
            optionsMap.set(value, type);
          }
        }
        return new _ZodDiscriminatedUnion({
          typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
          discriminator,
          options,
          optionsMap,
          ...processCreateParams(params)
        });
      }
    };
    __name(mergeValues, "mergeValues");
    ZodIntersection = class extends ZodType {
      static {
        __name(this, "ZodIntersection");
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = /* @__PURE__ */ __name((parsedLeft, parsedRight) => {
          if (isAborted(parsedLeft) || isAborted(parsedRight)) {
            return INVALID;
          }
          const merged = mergeValues(parsedLeft.value, parsedRight.value);
          if (!merged.valid) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_intersection_types
            });
            return INVALID;
          }
          if (isDirty(parsedLeft) || isDirty(parsedRight)) {
            status.dirty();
          }
          return { status: status.value, value: merged.data };
        }, "handleParsed");
        if (ctx.common.async) {
          return Promise.all([
            this._def.left._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            }),
            this._def.right._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            })
          ]).then(([left, right]) => handleParsed(left, right));
        } else {
          return handleParsed(this._def.left._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }), this._def.right._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }));
        }
      }
    };
    ZodIntersection.create = (left, right, params) => {
      return new ZodIntersection({
        left,
        right,
        typeName: ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params)
      });
    };
    ZodTuple = class _ZodTuple extends ZodType {
      static {
        __name(this, "ZodTuple");
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.array) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.array,
            received: ctx.parsedType
          });
          return INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          return INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          status.dirty();
        }
        const items = [...ctx.data].map((item, itemIndex) => {
          const schema = this._def.items[itemIndex] || this._def.rest;
          if (!schema)
            return null;
          return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        }).filter((x) => !!x);
        if (ctx.common.async) {
          return Promise.all(items).then((results) => {
            return ParseStatus.mergeArray(status, results);
          });
        } else {
          return ParseStatus.mergeArray(status, items);
        }
      }
      get items() {
        return this._def.items;
      }
      rest(rest) {
        return new _ZodTuple({
          ...this._def,
          rest
        });
      }
    };
    ZodTuple.create = (schemas, params) => {
      if (!Array.isArray(schemas)) {
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
      }
      return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params)
      });
    };
    ZodRecord = class _ZodRecord extends ZodType {
      static {
        __name(this, "ZodRecord");
      }
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for (const key in ctx.data) {
          pairs.push({
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
            value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (ctx.common.async) {
          return ParseStatus.mergeObjectAsync(status, pairs);
        } else {
          return ParseStatus.mergeObjectSync(status, pairs);
        }
      }
      get element() {
        return this._def.valueType;
      }
      static create(first, second, third) {
        if (second instanceof ZodType) {
          return new _ZodRecord({
            keyType: first,
            valueType: second,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(third)
          });
        }
        return new _ZodRecord({
          keyType: ZodString.create(),
          valueType: first,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(second)
        });
      }
    };
    ZodMap = class extends ZodType {
      static {
        __name(this, "ZodMap");
      }
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.map) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.map,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [...ctx.data.entries()].map(([key, value], index) => {
          return {
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
            value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
          };
        });
        if (ctx.common.async) {
          const finalMap = /* @__PURE__ */ new Map();
          return Promise.resolve().then(async () => {
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              if (key.status === "aborted" || value.status === "aborted") {
                return INVALID;
              }
              if (key.status === "dirty" || value.status === "dirty") {
                status.dirty();
              }
              finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
          });
        } else {
          const finalMap = /* @__PURE__ */ new Map();
          for (const pair of pairs) {
            const key = pair.key;
            const value = pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
              return INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
              status.dirty();
            }
            finalMap.set(key.value, value.value);
          }
          return { status: status.value, value: finalMap };
        }
      }
    };
    ZodMap.create = (keyType, valueType, params) => {
      return new ZodMap({
        valueType,
        keyType,
        typeName: ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params)
      });
    };
    ZodSet = class _ZodSet extends ZodType {
      static {
        __name(this, "ZodSet");
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.set) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.set,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
          if (ctx.data.size < def.minSize.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: def.minSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.minSize.message
            });
            status.dirty();
          }
        }
        if (def.maxSize !== null) {
          if (ctx.data.size > def.maxSize.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: def.maxSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.maxSize.message
            });
            status.dirty();
          }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements2) {
          const parsedSet = /* @__PURE__ */ new Set();
          for (const element of elements2) {
            if (element.status === "aborted")
              return INVALID;
            if (element.status === "dirty")
              status.dirty();
            parsedSet.add(element.value);
          }
          return { status: status.value, value: parsedSet };
        }
        __name(finalizeSet, "finalizeSet");
        const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
        if (ctx.common.async) {
          return Promise.all(elements).then((elements2) => finalizeSet(elements2));
        } else {
          return finalizeSet(elements);
        }
      }
      min(minSize, message) {
        return new _ZodSet({
          ...this._def,
          minSize: { value: minSize, message: errorUtil.toString(message) }
        });
      }
      max(maxSize, message) {
        return new _ZodSet({
          ...this._def,
          maxSize: { value: maxSize, message: errorUtil.toString(message) }
        });
      }
      size(size, message) {
        return this.min(size, message).max(size, message);
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    ZodSet.create = (valueType, params) => {
      return new ZodSet({
        valueType,
        minSize: null,
        maxSize: null,
        typeName: ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params)
      });
    };
    ZodFunction = class _ZodFunction extends ZodType {
      static {
        __name(this, "ZodFunction");
      }
      constructor() {
        super(...arguments);
        this.validate = this.implement;
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.function) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.function,
            received: ctx.parsedType
          });
          return INVALID;
        }
        function makeArgsIssue(args, error3) {
          return makeIssue({
            data: args,
            path: ctx.path,
            errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
            issueData: {
              code: ZodIssueCode.invalid_arguments,
              argumentsError: error3
            }
          });
        }
        __name(makeArgsIssue, "makeArgsIssue");
        function makeReturnsIssue(returns, error3) {
          return makeIssue({
            data: returns,
            path: ctx.path,
            errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
            issueData: {
              code: ZodIssueCode.invalid_return_type,
              returnTypeError: error3
            }
          });
        }
        __name(makeReturnsIssue, "makeReturnsIssue");
        const params = { errorMap: ctx.common.contextualErrorMap };
        const fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
          const me = this;
          return OK(async function(...args) {
            const error3 = new ZodError([]);
            const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
              error3.addIssue(makeArgsIssue(args, e));
              throw error3;
            });
            const result = await Reflect.apply(fn, this, parsedArgs);
            const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
              error3.addIssue(makeReturnsIssue(result, e));
              throw error3;
            });
            return parsedReturns;
          });
        } else {
          const me = this;
          return OK(function(...args) {
            const parsedArgs = me._def.args.safeParse(args, params);
            if (!parsedArgs.success) {
              throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
            }
            const result = Reflect.apply(fn, this, parsedArgs.data);
            const parsedReturns = me._def.returns.safeParse(result, params);
            if (!parsedReturns.success) {
              throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
            }
            return parsedReturns.data;
          });
        }
      }
      parameters() {
        return this._def.args;
      }
      returnType() {
        return this._def.returns;
      }
      args(...items) {
        return new _ZodFunction({
          ...this._def,
          args: ZodTuple.create(items).rest(ZodUnknown.create())
        });
      }
      returns(returnType) {
        return new _ZodFunction({
          ...this._def,
          returns: returnType
        });
      }
      implement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
      }
      strictImplement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
      }
      static create(args, returns, params) {
        return new _ZodFunction({
          args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
          returns: returns || ZodUnknown.create(),
          typeName: ZodFirstPartyTypeKind.ZodFunction,
          ...processCreateParams(params)
        });
      }
    };
    ZodLazy = class extends ZodType {
      static {
        __name(this, "ZodLazy");
      }
      get schema() {
        return this._def.getter();
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
      }
    };
    ZodLazy.create = (getter, params) => {
      return new ZodLazy({
        getter,
        typeName: ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params)
      });
    };
    ZodLiteral = class extends ZodType {
      static {
        __name(this, "ZodLiteral");
      }
      _parse(input) {
        if (input.data !== this._def.value) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_literal,
            expected: this._def.value
          });
          return INVALID;
        }
        return { status: "valid", value: input.data };
      }
      get value() {
        return this._def.value;
      }
    };
    ZodLiteral.create = (value, params) => {
      return new ZodLiteral({
        value,
        typeName: ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params)
      });
    };
    __name(createZodEnum, "createZodEnum");
    ZodEnum = class _ZodEnum extends ZodType {
      static {
        __name(this, "ZodEnum");
      }
      _parse(input) {
        if (typeof input.data !== "string") {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type
          });
          return INVALID;
        }
        if (!this._cache) {
          this._cache = new Set(this._def.values);
        }
        if (!this._cache.has(input.data)) {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return INVALID;
        }
        return OK(input.data);
      }
      get options() {
        return this._def.values;
      }
      get enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Values() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      extract(values, newDef = this._def) {
        return _ZodEnum.create(values, {
          ...this._def,
          ...newDef
        });
      }
      exclude(values, newDef = this._def) {
        return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
          ...this._def,
          ...newDef
        });
      }
    };
    ZodEnum.create = createZodEnum;
    ZodNativeEnum = class extends ZodType {
      static {
        __name(this, "ZodNativeEnum");
      }
      _parse(input) {
        const nativeEnumValues = util.getValidEnumValues(this._def.values);
        const ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
          const expectedValues = util.objectValues(nativeEnumValues);
          addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type
          });
          return INVALID;
        }
        if (!this._cache) {
          this._cache = new Set(util.getValidEnumValues(this._def.values));
        }
        if (!this._cache.has(input.data)) {
          const expectedValues = util.objectValues(nativeEnumValues);
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return INVALID;
        }
        return OK(input.data);
      }
      get enum() {
        return this._def.values;
      }
    };
    ZodNativeEnum.create = (values, params) => {
      return new ZodNativeEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params)
      });
    };
    ZodPromise = class extends ZodType {
      static {
        __name(this, "ZodPromise");
      }
      unwrap() {
        return this._def.type;
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.promise,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
        return OK(promisified.then((data) => {
          return this._def.type.parseAsync(data, {
            path: ctx.path,
            errorMap: ctx.common.contextualErrorMap
          });
        }));
      }
    };
    ZodPromise.create = (schema, params) => {
      return new ZodPromise({
        type: schema,
        typeName: ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params)
      });
    };
    ZodEffects = class extends ZodType {
      static {
        __name(this, "ZodEffects");
      }
      innerType() {
        return this._def.schema;
      }
      sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        const checkCtx = {
          addIssue: /* @__PURE__ */ __name((arg) => {
            addIssueToContext(ctx, arg);
            if (arg.fatal) {
              status.abort();
            } else {
              status.dirty();
            }
          }, "addIssue"),
          get path() {
            return ctx.path;
          }
        };
        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
        if (effect.type === "preprocess") {
          const processed = effect.transform(ctx.data, checkCtx);
          if (ctx.common.async) {
            return Promise.resolve(processed).then(async (processed2) => {
              if (status.value === "aborted")
                return INVALID;
              const result = await this._def.schema._parseAsync({
                data: processed2,
                path: ctx.path,
                parent: ctx
              });
              if (result.status === "aborted")
                return INVALID;
              if (result.status === "dirty")
                return DIRTY(result.value);
              if (status.value === "dirty")
                return DIRTY(result.value);
              return result;
            });
          } else {
            if (status.value === "aborted")
              return INVALID;
            const result = this._def.schema._parseSync({
              data: processed,
              path: ctx.path,
              parent: ctx
            });
            if (result.status === "aborted")
              return INVALID;
            if (result.status === "dirty")
              return DIRTY(result.value);
            if (status.value === "dirty")
              return DIRTY(result.value);
            return result;
          }
        }
        if (effect.type === "refinement") {
          const executeRefinement = /* @__PURE__ */ __name((acc) => {
            const result = effect.refinement(acc, checkCtx);
            if (ctx.common.async) {
              return Promise.resolve(result);
            }
            if (result instanceof Promise) {
              throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
            }
            return acc;
          }, "executeRefinement");
          if (ctx.common.async === false) {
            const inner = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inner.status === "aborted")
              return INVALID;
            if (inner.status === "dirty")
              status.dirty();
            executeRefinement(inner.value);
            return { status: status.value, value: inner.value };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
              if (inner.status === "aborted")
                return INVALID;
              if (inner.status === "dirty")
                status.dirty();
              return executeRefinement(inner.value).then(() => {
                return { status: status.value, value: inner.value };
              });
            });
          }
        }
        if (effect.type === "transform") {
          if (ctx.common.async === false) {
            const base = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (!isValid(base))
              return INVALID;
            const result = effect.transform(base.value, checkCtx);
            if (result instanceof Promise) {
              throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
            }
            return { status: status.value, value: result };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
              if (!isValid(base))
                return INVALID;
              return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
                status: status.value,
                value: result
              }));
            });
          }
        }
        util.assertNever(effect);
      }
    };
    ZodEffects.create = (schema, effect, params) => {
      return new ZodEffects({
        schema,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect,
        ...processCreateParams(params)
      });
    };
    ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
      return new ZodEffects({
        schema,
        effect: { type: "preprocess", transform: preprocess },
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params)
      });
    };
    ZodOptional = class extends ZodType {
      static {
        __name(this, "ZodOptional");
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.undefined) {
          return OK(void 0);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodOptional.create = (type, params) => {
      return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params)
      });
    };
    ZodNullable = class extends ZodType {
      static {
        __name(this, "ZodNullable");
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.null) {
          return OK(null);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodNullable.create = (type, params) => {
      return new ZodNullable({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params)
      });
    };
    ZodDefault = class extends ZodType {
      static {
        __name(this, "ZodDefault");
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === ZodParsedType.undefined) {
          data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      removeDefault() {
        return this._def.innerType;
      }
    };
    ZodDefault.create = (type, params) => {
      return new ZodDefault({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodDefault,
        defaultValue: typeof params.default === "function" ? params.default : () => params.default,
        ...processCreateParams(params)
      });
    };
    ZodCatch = class extends ZodType {
      static {
        __name(this, "ZodCatch");
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const newCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          }
        };
        const result = this._def.innerType._parse({
          data: newCtx.data,
          path: newCtx.path,
          parent: {
            ...newCtx
          }
        });
        if (isAsync(result)) {
          return result.then((result2) => {
            return {
              status: "valid",
              value: result2.status === "valid" ? result2.value : this._def.catchValue({
                get error() {
                  return new ZodError(newCtx.common.issues);
                },
                input: newCtx.data
              })
            };
          });
        } else {
          return {
            status: "valid",
            value: result.status === "valid" ? result.value : this._def.catchValue({
              get error() {
                return new ZodError(newCtx.common.issues);
              },
              input: newCtx.data
            })
          };
        }
      }
      removeCatch() {
        return this._def.innerType;
      }
    };
    ZodCatch.create = (type, params) => {
      return new ZodCatch({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodCatch,
        catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
        ...processCreateParams(params)
      });
    };
    ZodNaN = class extends ZodType {
      static {
        __name(this, "ZodNaN");
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.nan) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.nan,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return { status: "valid", value: input.data };
      }
    };
    ZodNaN.create = (params) => {
      return new ZodNaN({
        typeName: ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params)
      });
    };
    BRAND = Symbol("zod_brand");
    ZodBranded = class extends ZodType {
      static {
        __name(this, "ZodBranded");
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      unwrap() {
        return this._def.type;
      }
    };
    ZodPipeline = class _ZodPipeline extends ZodType {
      static {
        __name(this, "ZodPipeline");
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.common.async) {
          const handleAsync = /* @__PURE__ */ __name(async () => {
            const inResult = await this._def.in._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inResult.status === "aborted")
              return INVALID;
            if (inResult.status === "dirty") {
              status.dirty();
              return DIRTY(inResult.value);
            } else {
              return this._def.out._parseAsync({
                data: inResult.value,
                path: ctx.path,
                parent: ctx
              });
            }
          }, "handleAsync");
          return handleAsync();
        } else {
          const inResult = this._def.in._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inResult.status === "aborted")
            return INVALID;
          if (inResult.status === "dirty") {
            status.dirty();
            return {
              status: "dirty",
              value: inResult.value
            };
          } else {
            return this._def.out._parseSync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          }
        }
      }
      static create(a, b) {
        return new _ZodPipeline({
          in: a,
          out: b,
          typeName: ZodFirstPartyTypeKind.ZodPipeline
        });
      }
    };
    ZodReadonly = class extends ZodType {
      static {
        __name(this, "ZodReadonly");
      }
      _parse(input) {
        const result = this._def.innerType._parse(input);
        const freeze = /* @__PURE__ */ __name((data) => {
          if (isValid(data)) {
            data.value = Object.freeze(data.value);
          }
          return data;
        }, "freeze");
        return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodReadonly.create = (type, params) => {
      return new ZodReadonly({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodReadonly,
        ...processCreateParams(params)
      });
    };
    __name(cleanParams, "cleanParams");
    __name(custom, "custom");
    late = {
      object: ZodObject.lazycreate
    };
    (function(ZodFirstPartyTypeKind2) {
      ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
      ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
      ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
      ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
      ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
      ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
      ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
      ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
      ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
      ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
      ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
      ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
      ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
      ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
      ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
      ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
      ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
      ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
      ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
      ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
      ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
      ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
      ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
      ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
      ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
      ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
      ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
      ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
      ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
      ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
      ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
      ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
      ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
      ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
      ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
      ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
    })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
    instanceOfType = /* @__PURE__ */ __name((cls, params = {
      message: `Input not instance of ${cls.name}`
    }) => custom((data) => data instanceof cls, params), "instanceOfType");
    stringType = ZodString.create;
    numberType = ZodNumber.create;
    nanType = ZodNaN.create;
    bigIntType = ZodBigInt.create;
    booleanType = ZodBoolean.create;
    dateType = ZodDate.create;
    symbolType = ZodSymbol.create;
    undefinedType = ZodUndefined.create;
    nullType = ZodNull.create;
    anyType = ZodAny.create;
    unknownType = ZodUnknown.create;
    neverType = ZodNever.create;
    voidType = ZodVoid.create;
    arrayType = ZodArray.create;
    objectType = ZodObject.create;
    strictObjectType = ZodObject.strictCreate;
    unionType = ZodUnion.create;
    discriminatedUnionType = ZodDiscriminatedUnion.create;
    intersectionType = ZodIntersection.create;
    tupleType = ZodTuple.create;
    recordType = ZodRecord.create;
    mapType = ZodMap.create;
    setType = ZodSet.create;
    functionType = ZodFunction.create;
    lazyType = ZodLazy.create;
    literalType = ZodLiteral.create;
    enumType = ZodEnum.create;
    nativeEnumType = ZodNativeEnum.create;
    promiseType = ZodPromise.create;
    effectsType = ZodEffects.create;
    optionalType = ZodOptional.create;
    nullableType = ZodNullable.create;
    preprocessType = ZodEffects.createWithPreprocess;
    pipelineType = ZodPipeline.create;
    ostring = /* @__PURE__ */ __name(() => stringType().optional(), "ostring");
    onumber = /* @__PURE__ */ __name(() => numberType().optional(), "onumber");
    oboolean = /* @__PURE__ */ __name(() => booleanType().optional(), "oboolean");
    coerce = {
      string: /* @__PURE__ */ __name(((arg) => ZodString.create({ ...arg, coerce: true })), "string"),
      number: /* @__PURE__ */ __name(((arg) => ZodNumber.create({ ...arg, coerce: true })), "number"),
      boolean: /* @__PURE__ */ __name(((arg) => ZodBoolean.create({
        ...arg,
        coerce: true
      })), "boolean"),
      bigint: /* @__PURE__ */ __name(((arg) => ZodBigInt.create({ ...arg, coerce: true })), "bigint"),
      date: /* @__PURE__ */ __name(((arg) => ZodDate.create({ ...arg, coerce: true })), "date")
    };
    NEVER = INVALID;
  }
});

// ../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});
var init_external = __esm({
  "../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/v3/external.js"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_errors();
    init_parseUtil();
    init_typeAliases();
    init_util();
    init_types();
    init_ZodError();
  }
});

// ../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/index.js
var init_zod = __esm({
  "../../../node_modules/.pnpm/zod@3.25.73/node_modules/zod/index.js"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_external();
    init_external();
  }
});

// ../src/lib/messaging/triggers.ts
var MessagingEventType, basePayloadSchema, bookingConfirmedPayloadSchema, arrival7DaysPayloadSchema, arrival48HoursPayloadSchema, arrivalMorningPayloadSchema, messagingPayloadSchema, messagingQueueRecordSchema;
var init_triggers = __esm({
  "../src/lib/messaging/triggers.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_zod();
    MessagingEventType = {
      /** Immediate welcome email after booking confirmation */
      BOOKING_CONFIRMED: "booking.confirmed",
      /** Week-before reminder with readiness checklist */
      ARRIVAL_7_DAYS: "arrival.7days",
      /** 48-hour reminder for cash + ETA confirmation */
      ARRIVAL_48_HOURS: "arrival.48hours",
      /** Day-of check-in with QR code */
      ARRIVAL_MORNING: "arrival.morning"
    };
    basePayloadSchema = external_exports.object({
      /** Occupant UUID */
      uuid: external_exports.string().min(1),
      /** Booking/reservation code */
      bookingCode: external_exports.string().min(1),
      /** Guest's email address */
      email: external_exports.string().email(),
      /** Guest's first name for personalization */
      firstName: external_exports.string().min(1),
      /** Guest's preferred language code (e.g., 'en', 'it') */
      language: external_exports.string().default("en")
    });
    bookingConfirmedPayloadSchema = basePayloadSchema.extend({
      eventType: external_exports.literal(MessagingEventType.BOOKING_CONFIRMED),
      /** Check-in date (ISO format YYYY-MM-DD) */
      checkInDate: external_exports.string(),
      /** Check-out date (ISO format YYYY-MM-DD) */
      checkOutDate: external_exports.string(),
      /** Number of nights */
      nights: external_exports.number().positive(),
      /** Personal portal URL */
      portalUrl: external_exports.string().url()
    });
    arrival7DaysPayloadSchema = basePayloadSchema.extend({
      eventType: external_exports.literal(MessagingEventType.ARRIVAL_7_DAYS),
      /** Check-in date (ISO format YYYY-MM-DD) */
      checkInDate: external_exports.string(),
      /** Days until check-in */
      daysUntil: external_exports.number().nonnegative(),
      /** Current readiness score (0-100) */
      readinessScore: external_exports.number().min(0).max(100),
      /** Personal portal URL */
      portalUrl: external_exports.string().url()
    });
    arrival48HoursPayloadSchema = basePayloadSchema.extend({
      eventType: external_exports.literal(MessagingEventType.ARRIVAL_48_HOURS),
      /** Check-in date (ISO format YYYY-MM-DD) */
      checkInDate: external_exports.string(),
      /** City tax amount due */
      cityTaxDue: external_exports.number().nonnegative(),
      /** Deposit amount due */
      depositDue: external_exports.number().nonnegative(),
      /** Whether ETA has been confirmed */
      etaConfirmed: external_exports.boolean(),
      /** Whether cash is marked as prepared */
      cashPrepared: external_exports.boolean(),
      /** Personal portal URL */
      portalUrl: external_exports.string().url()
    });
    arrivalMorningPayloadSchema = basePayloadSchema.extend({
      eventType: external_exports.literal(MessagingEventType.ARRIVAL_MORNING),
      /** Check-in code for QR generation */
      checkInCode: external_exports.string().min(1),
      /** Check-in time window (e.g., "15:00-22:00") */
      checkInWindow: external_exports.string(),
      /** Expected arrival time if confirmed (HH:MM format) */
      etaWindow: external_exports.string().nullable(),
      /** Total cash to bring */
      totalCashDue: external_exports.number().nonnegative(),
      /** Personal portal URL (for QR code generation) */
      portalUrl: external_exports.string().url()
    });
    messagingPayloadSchema = external_exports.discriminatedUnion("eventType", [
      bookingConfirmedPayloadSchema,
      arrival7DaysPayloadSchema,
      arrival48HoursPayloadSchema,
      arrivalMorningPayloadSchema
    ]);
    messagingQueueRecordSchema = external_exports.object({
      /** Unique event ID */
      eventId: external_exports.string().min(1),
      /** Event type */
      eventType: external_exports.nativeEnum(MessagingEventType),
      /** Event payload */
      payload: messagingPayloadSchema,
      /** When the event was created */
      createdAt: external_exports.number(),
      /** Processing status */
      status: external_exports.enum(["pending", "processing", "sent", "failed"]).default("pending"),
      /** Number of retry attempts */
      retryCount: external_exports.number().default(0),
      /** Last error message if failed */
      lastError: external_exports.string().nullable().default(null),
      /** When the event was processed */
      processedAt: external_exports.number().nullable().default(null)
    });
  }
});

// ../src/lib/messaging/queue-processor.ts
function getErrorMessage(error3) {
  if (error3 instanceof Error && error3.message) {
    return error3.message;
  }
  if (typeof error3 === "string" && error3.trim()) {
    return error3;
  }
  if (error3 && typeof error3 === "object") {
    const maybeMessage = error3.message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return "Unknown provider error";
}
function defaultClassifyProviderError(error3) {
  if (!error3 || typeof error3 !== "object") {
    return "transient";
  }
  const maybeError = error3;
  if (maybeError.permanent === true) {
    return "permanent";
  }
  const rawCode = typeof maybeError.code === "string" ? maybeError.code.toLowerCase() : "";
  if (rawCode === "invalid_payload" || rawCode === "permission_denied" || rawCode === "unauthorized" || rawCode === "forbidden") {
    return "permanent";
  }
  const status = typeof maybeError.status === "number" ? maybeError.status : null;
  if (status !== null && status >= 400 && status < 500 && status !== 429) {
    return "permanent";
  }
  return "transient";
}
async function processArrival48HoursQueueRecord(record, dependencies) {
  if (record.eventType !== MessagingEventType.ARRIVAL_48_HOURS) {
    return {
      outcome: "unsupported",
      transition: null,
      reason: `unsupported_event_type:${record.eventType}`
    };
  }
  if (record.status !== "pending") {
    return {
      outcome: "idempotent",
      transition: null,
      reason: `already_${record.status}`
    };
  }
  const now = dependencies.now ?? Date.now;
  const classifyProviderError = dependencies.classifyProviderError ?? defaultClassifyProviderError;
  try {
    await dependencies.dispatchArrival48Hours(
      record.payload,
      record
    );
    return {
      outcome: "sent",
      transition: {
        status: "sent",
        retryCount: record.retryCount ?? 0,
        lastError: null,
        processedAt: now()
      }
    };
  } catch (error3) {
    const nextRetryCount = (record.retryCount ?? 0) + 1;
    const lastError = getErrorMessage(error3);
    const failureKind = classifyProviderError(error3);
    if (failureKind === "permanent") {
      return {
        outcome: "failed",
        transition: {
          status: "failed",
          retryCount: nextRetryCount,
          lastError,
          processedAt: now()
        }
      };
    }
    return {
      outcome: "retry",
      transition: {
        status: "pending",
        retryCount: nextRetryCount,
        lastError,
        processedAt: null
      }
    };
  }
}
var init_queue_processor = __esm({
  "../src/lib/messaging/queue-processor.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_triggers();
    __name(getErrorMessage, "getErrorMessage");
    __name(defaultClassifyProviderError, "defaultClassifyProviderError");
    __name(processArrival48HoursQueueRecord, "processArrival48HoursQueueRecord");
  }
});

// lib/messaging-dispatcher.ts
function buildQueuePath(eventId) {
  return `messagingQueue/${eventId}`;
}
async function dispatchQueuedArrival48HoursEvent(eventId, dependencies) {
  const queuePath = buildQueuePath(eventId);
  const rawRecord = await dependencies.queueStore.get(queuePath);
  if (!rawRecord) {
    return {
      eventId,
      outcome: "missing",
      reason: "queue_record_missing"
    };
  }
  const parsedRecord = messagingQueueRecordSchema.safeParse(rawRecord);
  if (!parsedRecord.success) {
    const now = dependencies.now ?? Date.now;
    await dependencies.queueStore.update(queuePath, {
      status: "failed",
      retryCount: 1,
      lastError: "Invalid messaging queue record",
      processedAt: now()
    });
    return {
      eventId,
      outcome: "invalid",
      reason: "invalid_queue_record"
    };
  }
  const record = parsedRecord.data;
  if (record.eventType !== MessagingEventType.ARRIVAL_48_HOURS) {
    return {
      eventId,
      outcome: "unsupported",
      reason: `unsupported_event_type:${record.eventType}`
    };
  }
  if (record.status !== "pending") {
    return {
      eventId,
      outcome: "idempotent",
      reason: `already_${record.status}`
    };
  }
  await dependencies.queueStore.update(queuePath, {
    status: "processing",
    lastError: null
  });
  const processorResult = await processArrival48HoursQueueRecord(record, dependencies);
  if (processorResult.transition) {
    await dependencies.queueStore.update(queuePath, processorResult.transition);
  }
  return {
    eventId,
    outcome: processorResult.outcome,
    reason: processorResult.reason,
    transition: processorResult.transition ?? void 0
  };
}
var init_messaging_dispatcher = __esm({
  "lib/messaging-dispatcher.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_triggers();
    init_queue_processor();
    __name(buildQueuePath, "buildQueuePath");
    __name(dispatchQueuedArrival48HoursEvent, "dispatchQueuedArrival48HoursEvent");
  }
});

// api/process-messaging-queue.ts
var onRequestPost6;
var init_process_messaging_queue = __esm({
  "api/process-messaging-queue.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_email_dispatch();
    init_firebase_rest();
    init_messaging_dispatcher();
    onRequestPost6 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
      let body;
      try {
        body = await request.json();
      } catch {
        return errorResponse("Invalid JSON body", 400);
      }
      const eventId = (body.eventId ?? "").trim();
      if (!eventId) {
        return errorResponse("eventId is required", 400);
      }
      const queueStore = new FirebaseRest(env2);
      const result = await dispatchQueuedArrival48HoursEvent(eventId, {
        queueStore,
        dispatchArrival48Hours: /* @__PURE__ */ __name(async (payload) => {
          const sendResult = await dispatchPrimeEmail(
            {
              to: payload.email,
              subject: `Arrival in 48 hours, ${payload.firstName}`,
              text: [
                `Hi ${payload.firstName},`,
                "",
                `You're arriving on ${payload.checkInDate}.`,
                `Please bring EUR ${(payload.cityTaxDue + payload.depositDue).toFixed(2)} in cash.`,
                `Portal: ${payload.portalUrl}`
              ].join("\n")
            },
            env2
          );
          if (!sendResult.delivered) {
            const configError = new Error("Prime email provider is not configured");
            configError.permanent = true;
            throw configError;
          }
        }, "dispatchArrival48Hours")
      });
      return jsonResponse(result);
    }, "onRequestPost");
  }
});

// node-built-in-modules:crypto
import libDefault from "crypto";
var require_crypto = __commonJS({
  "node-built-in-modules:crypto"(exports, module) {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault;
  }
});

// ../../../node_modules/.pnpm/bcryptjs@2.4.3/node_modules/bcryptjs/dist/bcrypt.js
var require_bcrypt = __commonJS({
  "../../../node_modules/.pnpm/bcryptjs@2.4.3/node_modules/bcryptjs/dist/bcrypt.js"(exports, module) {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    (function(global, factory) {
      if (typeof define === "function" && define["amd"])
        define([], factory);
      else if (typeof __require === "function" && typeof module === "object" && module && module["exports"])
        module["exports"] = factory();
      else
        (global["dcodeIO"] = global["dcodeIO"] || {})["bcrypt"] = factory();
    })(exports, function() {
      "use strict";
      var bcrypt = {};
      var randomFallback = null;
      function random(len) {
        if (typeof module !== "undefined" && module && module["exports"])
          try {
            return require_crypto()["randomBytes"](len);
          } catch (e) {
          }
        try {
          var a;
          (self["crypto"] || self["msCrypto"])["getRandomValues"](a = new Uint32Array(len));
          return Array.prototype.slice.call(a);
        } catch (e) {
        }
        if (!randomFallback)
          throw Error("Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative");
        return randomFallback(len);
      }
      __name(random, "random");
      var randomAvailable = false;
      try {
        random(1);
        randomAvailable = true;
      } catch (e) {
      }
      randomFallback = null;
      bcrypt.setRandomFallback = function(random2) {
        randomFallback = random2;
      };
      bcrypt.genSaltSync = function(rounds, seed_length) {
        rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof rounds !== "number")
          throw Error("Illegal arguments: " + typeof rounds + ", " + typeof seed_length);
        if (rounds < 4)
          rounds = 4;
        else if (rounds > 31)
          rounds = 31;
        var salt = [];
        salt.push("$2a$");
        if (rounds < 10)
          salt.push("0");
        salt.push(rounds.toString());
        salt.push("$");
        salt.push(base64_encode(random(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
        return salt.join("");
      };
      bcrypt.genSalt = function(rounds, seed_length, callback) {
        if (typeof seed_length === "function")
          callback = seed_length, seed_length = void 0;
        if (typeof rounds === "function")
          callback = rounds, rounds = void 0;
        if (typeof rounds === "undefined")
          rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
        else if (typeof rounds !== "number")
          throw Error("illegal arguments: " + typeof rounds);
        function _async(callback2) {
          nextTick2(function() {
            try {
              callback2(null, bcrypt.genSaltSync(rounds));
            } catch (err) {
              callback2(err);
            }
          });
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt.hashSync = function(s, salt) {
        if (typeof salt === "undefined")
          salt = GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof salt === "number")
          salt = bcrypt.genSaltSync(salt);
        if (typeof s !== "string" || typeof salt !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof salt);
        return _hash(s, salt);
      };
      bcrypt.hash = function(s, salt, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s === "string" && typeof salt === "number")
            bcrypt.genSalt(salt, function(err, salt2) {
              _hash(s, salt2, callback2, progressCallback);
            });
          else if (typeof s === "string" && typeof salt === "string")
            _hash(s, salt, callback2, progressCallback);
          else
            nextTick2(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof salt)));
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      function safeStringCompare(known, unknown) {
        var right = 0, wrong = 0;
        for (var i = 0, k = known.length; i < k; ++i) {
          if (known.charCodeAt(i) === unknown.charCodeAt(i))
            ++right;
          else
            ++wrong;
        }
        if (right < 0)
          return false;
        return wrong === 0;
      }
      __name(safeStringCompare, "safeStringCompare");
      bcrypt.compareSync = function(s, hash) {
        if (typeof s !== "string" || typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof hash);
        if (hash.length !== 60)
          return false;
        return safeStringCompare(bcrypt.hashSync(s, hash.substr(0, hash.length - 31)), hash);
      };
      bcrypt.compare = function(s, hash, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s !== "string" || typeof hash !== "string") {
            nextTick2(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof hash)));
            return;
          }
          if (hash.length !== 60) {
            nextTick2(callback2.bind(this, null, false));
            return;
          }
          bcrypt.hash(s, hash.substr(0, 29), function(err, comp) {
            if (err)
              callback2(err);
            else
              callback2(null, safeStringCompare(comp, hash));
          }, progressCallback);
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt.getRounds = function(hash) {
        if (typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof hash);
        return parseInt(hash.split("$")[2], 10);
      };
      bcrypt.getSalt = function(hash) {
        if (typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof hash);
        if (hash.length !== 60)
          throw Error("Illegal hash length: " + hash.length + " != 60");
        return hash.substring(0, 29);
      };
      var nextTick2 = typeof process !== "undefined" && process && typeof process.nextTick === "function" ? typeof setImmediate === "function" ? setImmediate : process.nextTick : setTimeout;
      function stringToBytes(str) {
        var out = [], i = 0;
        utfx.encodeUTF16toUTF8(function() {
          if (i >= str.length) return null;
          return str.charCodeAt(i++);
        }, function(b) {
          out.push(b);
        });
        return out;
      }
      __name(stringToBytes, "stringToBytes");
      var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
      var BASE64_INDEX = [
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        0,
        1,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        62,
        63,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        -1,
        -1,
        -1,
        -1,
        -1
      ];
      var stringFromCharCode = String.fromCharCode;
      function base64_encode(b, len) {
        var off2 = 0, rs = [], c1, c2;
        if (len <= 0 || len > b.length)
          throw Error("Illegal len: " + len);
        while (off2 < len) {
          c1 = b[off2++] & 255;
          rs.push(BASE64_CODE[c1 >> 2 & 63]);
          c1 = (c1 & 3) << 4;
          if (off2 >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off2++] & 255;
          c1 |= c2 >> 4 & 15;
          rs.push(BASE64_CODE[c1 & 63]);
          c1 = (c2 & 15) << 2;
          if (off2 >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off2++] & 255;
          c1 |= c2 >> 6 & 3;
          rs.push(BASE64_CODE[c1 & 63]);
          rs.push(BASE64_CODE[c2 & 63]);
        }
        return rs.join("");
      }
      __name(base64_encode, "base64_encode");
      function base64_decode(s, len) {
        var off2 = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
        if (len <= 0)
          throw Error("Illegal len: " + len);
        while (off2 < slen - 1 && olen < len) {
          code = s.charCodeAt(off2++);
          c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          code = s.charCodeAt(off2++);
          c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c1 == -1 || c2 == -1)
            break;
          o = c1 << 2 >>> 0;
          o |= (c2 & 48) >> 4;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off2 >= slen)
            break;
          code = s.charCodeAt(off2++);
          c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c3 == -1)
            break;
          o = (c2 & 15) << 4 >>> 0;
          o |= (c3 & 60) >> 2;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off2 >= slen)
            break;
          code = s.charCodeAt(off2++);
          c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          o = (c3 & 3) << 6 >>> 0;
          o |= c4;
          rs.push(stringFromCharCode(o));
          ++olen;
        }
        var res = [];
        for (off2 = 0; off2 < olen; off2++)
          res.push(rs[off2].charCodeAt(0));
        return res;
      }
      __name(base64_decode, "base64_decode");
      var utfx = (function() {
        "use strict";
        var utfx2 = {};
        utfx2.MAX_CODEPOINT = 1114111;
        utfx2.encodeUTF8 = function(src, dst) {
          var cp = null;
          if (typeof src === "number")
            cp = src, src = /* @__PURE__ */ __name(function() {
              return null;
            }, "src");
          while (cp !== null || (cp = src()) !== null) {
            if (cp < 128)
              dst(cp & 127);
            else if (cp < 2048)
              dst(cp >> 6 & 31 | 192), dst(cp & 63 | 128);
            else if (cp < 65536)
              dst(cp >> 12 & 15 | 224), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128);
            else
              dst(cp >> 18 & 7 | 240), dst(cp >> 12 & 63 | 128), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128);
            cp = null;
          }
        };
        utfx2.decodeUTF8 = function(src, dst) {
          var a, b, c, d, fail = /* @__PURE__ */ __name(function(b2) {
            b2 = b2.slice(0, b2.indexOf(null));
            var err = Error(b2.toString());
            err.name = "TruncatedError";
            err["bytes"] = b2;
            throw err;
          }, "fail");
          while ((a = src()) !== null) {
            if ((a & 128) === 0)
              dst(a);
            else if ((a & 224) === 192)
              (b = src()) === null && fail([a, b]), dst((a & 31) << 6 | b & 63);
            else if ((a & 240) === 224)
              ((b = src()) === null || (c = src()) === null) && fail([a, b, c]), dst((a & 15) << 12 | (b & 63) << 6 | c & 63);
            else if ((a & 248) === 240)
              ((b = src()) === null || (c = src()) === null || (d = src()) === null) && fail([a, b, c, d]), dst((a & 7) << 18 | (b & 63) << 12 | (c & 63) << 6 | d & 63);
            else throw RangeError("Illegal starting byte: " + a);
          }
        };
        utfx2.UTF16toUTF8 = function(src, dst) {
          var c1, c2 = null;
          while (true) {
            if ((c1 = c2 !== null ? c2 : src()) === null)
              break;
            if (c1 >= 55296 && c1 <= 57343) {
              if ((c2 = src()) !== null) {
                if (c2 >= 56320 && c2 <= 57343) {
                  dst((c1 - 55296) * 1024 + c2 - 56320 + 65536);
                  c2 = null;
                  continue;
                }
              }
            }
            dst(c1);
          }
          if (c2 !== null) dst(c2);
        };
        utfx2.UTF8toUTF16 = function(src, dst) {
          var cp = null;
          if (typeof src === "number")
            cp = src, src = /* @__PURE__ */ __name(function() {
              return null;
            }, "src");
          while (cp !== null || (cp = src()) !== null) {
            if (cp <= 65535)
              dst(cp);
            else
              cp -= 65536, dst((cp >> 10) + 55296), dst(cp % 1024 + 56320);
            cp = null;
          }
        };
        utfx2.encodeUTF16toUTF8 = function(src, dst) {
          utfx2.UTF16toUTF8(src, function(cp) {
            utfx2.encodeUTF8(cp, dst);
          });
        };
        utfx2.decodeUTF8toUTF16 = function(src, dst) {
          utfx2.decodeUTF8(src, function(cp) {
            utfx2.UTF8toUTF16(cp, dst);
          });
        };
        utfx2.calculateCodePoint = function(cp) {
          return cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4;
        };
        utfx2.calculateUTF8 = function(src) {
          var cp, l = 0;
          while ((cp = src()) !== null)
            l += utfx2.calculateCodePoint(cp);
          return l;
        };
        utfx2.calculateUTF16asUTF8 = function(src) {
          var n = 0, l = 0;
          utfx2.UTF16toUTF8(src, function(cp) {
            ++n;
            l += utfx2.calculateCodePoint(cp);
          });
          return [n, l];
        };
        return utfx2;
      })();
      Date.now = Date.now || function() {
        return +/* @__PURE__ */ new Date();
      };
      var BCRYPT_SALT_LEN = 16;
      var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
      var BLOWFISH_NUM_ROUNDS = 16;
      var MAX_EXECUTION_TIME = 100;
      var P_ORIG = [
        608135816,
        2242054355,
        320440878,
        57701188,
        2752067618,
        698298832,
        137296536,
        3964562569,
        1160258022,
        953160567,
        3193202383,
        887688300,
        3232508343,
        3380367581,
        1065670069,
        3041331479,
        2450970073,
        2306472731
      ];
      var S_ORIG = [
        3509652390,
        2564797868,
        805139163,
        3491422135,
        3101798381,
        1780907670,
        3128725573,
        4046225305,
        614570311,
        3012652279,
        134345442,
        2240740374,
        1667834072,
        1901547113,
        2757295779,
        4103290238,
        227898511,
        1921955416,
        1904987480,
        2182433518,
        2069144605,
        3260701109,
        2620446009,
        720527379,
        3318853667,
        677414384,
        3393288472,
        3101374703,
        2390351024,
        1614419982,
        1822297739,
        2954791486,
        3608508353,
        3174124327,
        2024746970,
        1432378464,
        3864339955,
        2857741204,
        1464375394,
        1676153920,
        1439316330,
        715854006,
        3033291828,
        289532110,
        2706671279,
        2087905683,
        3018724369,
        1668267050,
        732546397,
        1947742710,
        3462151702,
        2609353502,
        2950085171,
        1814351708,
        2050118529,
        680887927,
        999245976,
        1800124847,
        3300911131,
        1713906067,
        1641548236,
        4213287313,
        1216130144,
        1575780402,
        4018429277,
        3917837745,
        3693486850,
        3949271944,
        596196993,
        3549867205,
        258830323,
        2213823033,
        772490370,
        2760122372,
        1774776394,
        2652871518,
        566650946,
        4142492826,
        1728879713,
        2882767088,
        1783734482,
        3629395816,
        2517608232,
        2874225571,
        1861159788,
        326777828,
        3124490320,
        2130389656,
        2716951837,
        967770486,
        1724537150,
        2185432712,
        2364442137,
        1164943284,
        2105845187,
        998989502,
        3765401048,
        2244026483,
        1075463327,
        1455516326,
        1322494562,
        910128902,
        469688178,
        1117454909,
        936433444,
        3490320968,
        3675253459,
        1240580251,
        122909385,
        2157517691,
        634681816,
        4142456567,
        3825094682,
        3061402683,
        2540495037,
        79693498,
        3249098678,
        1084186820,
        1583128258,
        426386531,
        1761308591,
        1047286709,
        322548459,
        995290223,
        1845252383,
        2603652396,
        3431023940,
        2942221577,
        3202600964,
        3727903485,
        1712269319,
        422464435,
        3234572375,
        1170764815,
        3523960633,
        3117677531,
        1434042557,
        442511882,
        3600875718,
        1076654713,
        1738483198,
        4213154764,
        2393238008,
        3677496056,
        1014306527,
        4251020053,
        793779912,
        2902807211,
        842905082,
        4246964064,
        1395751752,
        1040244610,
        2656851899,
        3396308128,
        445077038,
        3742853595,
        3577915638,
        679411651,
        2892444358,
        2354009459,
        1767581616,
        3150600392,
        3791627101,
        3102740896,
        284835224,
        4246832056,
        1258075500,
        768725851,
        2589189241,
        3069724005,
        3532540348,
        1274779536,
        3789419226,
        2764799539,
        1660621633,
        3471099624,
        4011903706,
        913787905,
        3497959166,
        737222580,
        2514213453,
        2928710040,
        3937242737,
        1804850592,
        3499020752,
        2949064160,
        2386320175,
        2390070455,
        2415321851,
        4061277028,
        2290661394,
        2416832540,
        1336762016,
        1754252060,
        3520065937,
        3014181293,
        791618072,
        3188594551,
        3933548030,
        2332172193,
        3852520463,
        3043980520,
        413987798,
        3465142937,
        3030929376,
        4245938359,
        2093235073,
        3534596313,
        375366246,
        2157278981,
        2479649556,
        555357303,
        3870105701,
        2008414854,
        3344188149,
        4221384143,
        3956125452,
        2067696032,
        3594591187,
        2921233993,
        2428461,
        544322398,
        577241275,
        1471733935,
        610547355,
        4027169054,
        1432588573,
        1507829418,
        2025931657,
        3646575487,
        545086370,
        48609733,
        2200306550,
        1653985193,
        298326376,
        1316178497,
        3007786442,
        2064951626,
        458293330,
        2589141269,
        3591329599,
        3164325604,
        727753846,
        2179363840,
        146436021,
        1461446943,
        4069977195,
        705550613,
        3059967265,
        3887724982,
        4281599278,
        3313849956,
        1404054877,
        2845806497,
        146425753,
        1854211946,
        1266315497,
        3048417604,
        3681880366,
        3289982499,
        290971e4,
        1235738493,
        2632868024,
        2414719590,
        3970600049,
        1771706367,
        1449415276,
        3266420449,
        422970021,
        1963543593,
        2690192192,
        3826793022,
        1062508698,
        1531092325,
        1804592342,
        2583117782,
        2714934279,
        4024971509,
        1294809318,
        4028980673,
        1289560198,
        2221992742,
        1669523910,
        35572830,
        157838143,
        1052438473,
        1016535060,
        1802137761,
        1753167236,
        1386275462,
        3080475397,
        2857371447,
        1040679964,
        2145300060,
        2390574316,
        1461121720,
        2956646967,
        4031777805,
        4028374788,
        33600511,
        2920084762,
        1018524850,
        629373528,
        3691585981,
        3515945977,
        2091462646,
        2486323059,
        586499841,
        988145025,
        935516892,
        3367335476,
        2599673255,
        2839830854,
        265290510,
        3972581182,
        2759138881,
        3795373465,
        1005194799,
        847297441,
        406762289,
        1314163512,
        1332590856,
        1866599683,
        4127851711,
        750260880,
        613907577,
        1450815602,
        3165620655,
        3734664991,
        3650291728,
        3012275730,
        3704569646,
        1427272223,
        778793252,
        1343938022,
        2676280711,
        2052605720,
        1946737175,
        3164576444,
        3914038668,
        3967478842,
        3682934266,
        1661551462,
        3294938066,
        4011595847,
        840292616,
        3712170807,
        616741398,
        312560963,
        711312465,
        1351876610,
        322626781,
        1910503582,
        271666773,
        2175563734,
        1594956187,
        70604529,
        3617834859,
        1007753275,
        1495573769,
        4069517037,
        2549218298,
        2663038764,
        504708206,
        2263041392,
        3941167025,
        2249088522,
        1514023603,
        1998579484,
        1312622330,
        694541497,
        2582060303,
        2151582166,
        1382467621,
        776784248,
        2618340202,
        3323268794,
        2497899128,
        2784771155,
        503983604,
        4076293799,
        907881277,
        423175695,
        432175456,
        1378068232,
        4145222326,
        3954048622,
        3938656102,
        3820766613,
        2793130115,
        2977904593,
        26017576,
        3274890735,
        3194772133,
        1700274565,
        1756076034,
        4006520079,
        3677328699,
        720338349,
        1533947780,
        354530856,
        688349552,
        3973924725,
        1637815568,
        332179504,
        3949051286,
        53804574,
        2852348879,
        3044236432,
        1282449977,
        3583942155,
        3416972820,
        4006381244,
        1617046695,
        2628476075,
        3002303598,
        1686838959,
        431878346,
        2686675385,
        1700445008,
        1080580658,
        1009431731,
        832498133,
        3223435511,
        2605976345,
        2271191193,
        2516031870,
        1648197032,
        4164389018,
        2548247927,
        300782431,
        375919233,
        238389289,
        3353747414,
        2531188641,
        2019080857,
        1475708069,
        455242339,
        2609103871,
        448939670,
        3451063019,
        1395535956,
        2413381860,
        1841049896,
        1491858159,
        885456874,
        4264095073,
        4001119347,
        1565136089,
        3898914787,
        1108368660,
        540939232,
        1173283510,
        2745871338,
        3681308437,
        4207628240,
        3343053890,
        4016749493,
        1699691293,
        1103962373,
        3625875870,
        2256883143,
        3830138730,
        1031889488,
        3479347698,
        1535977030,
        4236805024,
        3251091107,
        2132092099,
        1774941330,
        1199868427,
        1452454533,
        157007616,
        2904115357,
        342012276,
        595725824,
        1480756522,
        206960106,
        497939518,
        591360097,
        863170706,
        2375253569,
        3596610801,
        1814182875,
        2094937945,
        3421402208,
        1082520231,
        3463918190,
        2785509508,
        435703966,
        3908032597,
        1641649973,
        2842273706,
        3305899714,
        1510255612,
        2148256476,
        2655287854,
        3276092548,
        4258621189,
        236887753,
        3681803219,
        274041037,
        1734335097,
        3815195456,
        3317970021,
        1899903192,
        1026095262,
        4050517792,
        356393447,
        2410691914,
        3873677099,
        3682840055,
        3913112168,
        2491498743,
        4132185628,
        2489919796,
        1091903735,
        1979897079,
        3170134830,
        3567386728,
        3557303409,
        857797738,
        1136121015,
        1342202287,
        507115054,
        2535736646,
        337727348,
        3213592640,
        1301675037,
        2528481711,
        1895095763,
        1721773893,
        3216771564,
        62756741,
        2142006736,
        835421444,
        2531993523,
        1442658625,
        3659876326,
        2882144922,
        676362277,
        1392781812,
        170690266,
        3921047035,
        1759253602,
        3611846912,
        1745797284,
        664899054,
        1329594018,
        3901205900,
        3045908486,
        2062866102,
        2865634940,
        3543621612,
        3464012697,
        1080764994,
        553557557,
        3656615353,
        3996768171,
        991055499,
        499776247,
        1265440854,
        648242737,
        3940784050,
        980351604,
        3713745714,
        1749149687,
        3396870395,
        4211799374,
        3640570775,
        1161844396,
        3125318951,
        1431517754,
        545492359,
        4268468663,
        3499529547,
        1437099964,
        2702547544,
        3433638243,
        2581715763,
        2787789398,
        1060185593,
        1593081372,
        2418618748,
        4260947970,
        69676912,
        2159744348,
        86519011,
        2512459080,
        3838209314,
        1220612927,
        3339683548,
        133810670,
        1090789135,
        1078426020,
        1569222167,
        845107691,
        3583754449,
        4072456591,
        1091646820,
        628848692,
        1613405280,
        3757631651,
        526609435,
        236106946,
        48312990,
        2942717905,
        3402727701,
        1797494240,
        859738849,
        992217954,
        4005476642,
        2243076622,
        3870952857,
        3732016268,
        765654824,
        3490871365,
        2511836413,
        1685915746,
        3888969200,
        1414112111,
        2273134842,
        3281911079,
        4080962846,
        172450625,
        2569994100,
        980381355,
        4109958455,
        2819808352,
        2716589560,
        2568741196,
        3681446669,
        3329971472,
        1835478071,
        660984891,
        3704678404,
        4045999559,
        3422617507,
        3040415634,
        1762651403,
        1719377915,
        3470491036,
        2693910283,
        3642056355,
        3138596744,
        1364962596,
        2073328063,
        1983633131,
        926494387,
        3423689081,
        2150032023,
        4096667949,
        1749200295,
        3328846651,
        309677260,
        2016342300,
        1779581495,
        3079819751,
        111262694,
        1274766160,
        443224088,
        298511866,
        1025883608,
        3806446537,
        1145181785,
        168956806,
        3641502830,
        3584813610,
        1689216846,
        3666258015,
        3200248200,
        1692713982,
        2646376535,
        4042768518,
        1618508792,
        1610833997,
        3523052358,
        4130873264,
        2001055236,
        3610705100,
        2202168115,
        4028541809,
        2961195399,
        1006657119,
        2006996926,
        3186142756,
        1430667929,
        3210227297,
        1314452623,
        4074634658,
        4101304120,
        2273951170,
        1399257539,
        3367210612,
        3027628629,
        1190975929,
        2062231137,
        2333990788,
        2221543033,
        2438960610,
        1181637006,
        548689776,
        2362791313,
        3372408396,
        3104550113,
        3145860560,
        296247880,
        1970579870,
        3078560182,
        3769228297,
        1714227617,
        3291629107,
        3898220290,
        166772364,
        1251581989,
        493813264,
        448347421,
        195405023,
        2709975567,
        677966185,
        3703036547,
        1463355134,
        2715995803,
        1338867538,
        1343315457,
        2802222074,
        2684532164,
        233230375,
        2599980071,
        2000651841,
        3277868038,
        1638401717,
        4028070440,
        3237316320,
        6314154,
        819756386,
        300326615,
        590932579,
        1405279636,
        3267499572,
        3150704214,
        2428286686,
        3959192993,
        3461946742,
        1862657033,
        1266418056,
        963775037,
        2089974820,
        2263052895,
        1917689273,
        448879540,
        3550394620,
        3981727096,
        150775221,
        3627908307,
        1303187396,
        508620638,
        2975983352,
        2726630617,
        1817252668,
        1876281319,
        1457606340,
        908771278,
        3720792119,
        3617206836,
        2455994898,
        1729034894,
        1080033504,
        976866871,
        3556439503,
        2881648439,
        1522871579,
        1555064734,
        1336096578,
        3548522304,
        2579274686,
        3574697629,
        3205460757,
        3593280638,
        3338716283,
        3079412587,
        564236357,
        2993598910,
        1781952180,
        1464380207,
        3163844217,
        3332601554,
        1699332808,
        1393555694,
        1183702653,
        3581086237,
        1288719814,
        691649499,
        2847557200,
        2895455976,
        3193889540,
        2717570544,
        1781354906,
        1676643554,
        2592534050,
        3230253752,
        1126444790,
        2770207658,
        2633158820,
        2210423226,
        2615765581,
        2414155088,
        3127139286,
        673620729,
        2805611233,
        1269405062,
        4015350505,
        3341807571,
        4149409754,
        1057255273,
        2012875353,
        2162469141,
        2276492801,
        2601117357,
        993977747,
        3918593370,
        2654263191,
        753973209,
        36408145,
        2530585658,
        25011837,
        3520020182,
        2088578344,
        530523599,
        2918365339,
        1524020338,
        1518925132,
        3760827505,
        3759777254,
        1202760957,
        3985898139,
        3906192525,
        674977740,
        4174734889,
        2031300136,
        2019492241,
        3983892565,
        4153806404,
        3822280332,
        352677332,
        2297720250,
        60907813,
        90501309,
        3286998549,
        1016092578,
        2535922412,
        2839152426,
        457141659,
        509813237,
        4120667899,
        652014361,
        1966332200,
        2975202805,
        55981186,
        2327461051,
        676427537,
        3255491064,
        2882294119,
        3433927263,
        1307055953,
        942726286,
        933058658,
        2468411793,
        3933900994,
        4215176142,
        1361170020,
        2001714738,
        2830558078,
        3274259782,
        1222529897,
        1679025792,
        2729314320,
        3714953764,
        1770335741,
        151462246,
        3013232138,
        1682292957,
        1483529935,
        471910574,
        1539241949,
        458788160,
        3436315007,
        1807016891,
        3718408830,
        978976581,
        1043663428,
        3165965781,
        1927990952,
        4200891579,
        2372276910,
        3208408903,
        3533431907,
        1412390302,
        2931980059,
        4132332400,
        1947078029,
        3881505623,
        4168226417,
        2941484381,
        1077988104,
        1320477388,
        886195818,
        18198404,
        3786409e3,
        2509781533,
        112762804,
        3463356488,
        1866414978,
        891333506,
        18488651,
        661792760,
        1628790961,
        3885187036,
        3141171499,
        876946877,
        2693282273,
        1372485963,
        791857591,
        2686433993,
        3759982718,
        3167212022,
        3472953795,
        2716379847,
        445679433,
        3561995674,
        3504004811,
        3574258232,
        54117162,
        3331405415,
        2381918588,
        3769707343,
        4154350007,
        1140177722,
        4074052095,
        668550556,
        3214352940,
        367459370,
        261225585,
        2610173221,
        4209349473,
        3468074219,
        3265815641,
        314222801,
        3066103646,
        3808782860,
        282218597,
        3406013506,
        3773591054,
        379116347,
        1285071038,
        846784868,
        2669647154,
        3771962079,
        3550491691,
        2305946142,
        453669953,
        1268987020,
        3317592352,
        3279303384,
        3744833421,
        2610507566,
        3859509063,
        266596637,
        3847019092,
        517658769,
        3462560207,
        3443424879,
        370717030,
        4247526661,
        2224018117,
        4143653529,
        4112773975,
        2788324899,
        2477274417,
        1456262402,
        2901442914,
        1517677493,
        1846949527,
        2295493580,
        3734397586,
        2176403920,
        1280348187,
        1908823572,
        3871786941,
        846861322,
        1172426758,
        3287448474,
        3383383037,
        1655181056,
        3139813346,
        901632758,
        1897031941,
        2986607138,
        3066810236,
        3447102507,
        1393639104,
        373351379,
        950779232,
        625454576,
        3124240540,
        4148612726,
        2007998917,
        544563296,
        2244738638,
        2330496472,
        2058025392,
        1291430526,
        424198748,
        50039436,
        29584100,
        3605783033,
        2429876329,
        2791104160,
        1057563949,
        3255363231,
        3075367218,
        3463963227,
        1469046755,
        985887462
      ];
      var C_ORIG = [
        1332899944,
        1700884034,
        1701343084,
        1684370003,
        1668446532,
        1869963892
      ];
      function _encipher(lr, off2, P, S) {
        var n, l = lr[off2], r = lr[off2 + 1];
        l ^= P[0];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[1];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[2];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[3];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[4];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[5];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[6];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[7];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[8];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[9];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[10];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[11];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[12];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[13];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[14];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[15];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[16];
        lr[off2] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
        lr[off2 + 1] = l;
        return lr;
      }
      __name(_encipher, "_encipher");
      function _streamtoword(data, offp) {
        for (var i = 0, word = 0; i < 4; ++i)
          word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
        return { key: word, offp };
      }
      __name(_streamtoword, "_streamtoword");
      function _key(key, P, S) {
        var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
        for (i = 0; i < plen; i += 2)
          lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      __name(_key, "_key");
      function _ekskey(data, key, P, S) {
        var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
        offp = 0;
        for (i = 0; i < plen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      __name(_ekskey, "_ekskey");
      function _crypt(b, salt, rounds, callback, progressCallback) {
        var cdata = C_ORIG.slice(), clen = cdata.length, err;
        if (rounds < 4 || rounds > 31) {
          err = Error("Illegal number of rounds (4-31): " + rounds);
          if (callback) {
            nextTick2(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.length !== BCRYPT_SALT_LEN) {
          err = Error("Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN);
          if (callback) {
            nextTick2(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        rounds = 1 << rounds >>> 0;
        var P, S, i = 0, j;
        if (Int32Array) {
          P = new Int32Array(P_ORIG);
          S = new Int32Array(S_ORIG);
        } else {
          P = P_ORIG.slice();
          S = S_ORIG.slice();
        }
        _ekskey(salt, b, P, S);
        function next() {
          if (progressCallback)
            progressCallback(i / rounds);
          if (i < rounds) {
            var start = Date.now();
            for (; i < rounds; ) {
              i = i + 1;
              _key(b, P, S);
              _key(salt, P, S);
              if (Date.now() - start > MAX_EXECUTION_TIME)
                break;
            }
          } else {
            for (i = 0; i < 64; i++)
              for (j = 0; j < clen >> 1; j++)
                _encipher(cdata, j << 1, P, S);
            var ret = [];
            for (i = 0; i < clen; i++)
              ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
            if (callback) {
              callback(null, ret);
              return;
            } else
              return ret;
          }
          if (callback)
            nextTick2(next);
        }
        __name(next, "next");
        if (typeof callback !== "undefined") {
          next();
        } else {
          var res;
          while (true)
            if (typeof (res = next()) !== "undefined")
              return res || [];
        }
      }
      __name(_crypt, "_crypt");
      function _hash(s, salt, callback, progressCallback) {
        var err;
        if (typeof s !== "string" || typeof salt !== "string") {
          err = Error("Invalid string / salt: Not a string");
          if (callback) {
            nextTick2(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var minor, offset;
        if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
          err = Error("Invalid salt version: " + salt.substring(0, 2));
          if (callback) {
            nextTick2(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.charAt(2) === "$")
          minor = String.fromCharCode(0), offset = 3;
        else {
          minor = salt.charAt(2);
          if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
            err = Error("Invalid salt revision: " + salt.substring(2, 4));
            if (callback) {
              nextTick2(callback.bind(this, err));
              return;
            } else
              throw err;
          }
          offset = 4;
        }
        if (salt.charAt(offset + 2) > "$") {
          err = Error("Missing salt rounds");
          if (callback) {
            nextTick2(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
        s += minor >= "a" ? "\0" : "";
        var passwordb = stringToBytes(s), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
        function finish(bytes) {
          var res = [];
          res.push("$2");
          if (minor >= "a")
            res.push(minor);
          res.push("$");
          if (rounds < 10)
            res.push("0");
          res.push(rounds.toString());
          res.push("$");
          res.push(base64_encode(saltb, saltb.length));
          res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
          return res.join("");
        }
        __name(finish, "finish");
        if (typeof callback == "undefined")
          return finish(_crypt(passwordb, saltb, rounds));
        else {
          _crypt(passwordb, saltb, rounds, function(err2, bytes) {
            if (err2)
              callback(err2, null);
            else
              callback(null, finish(bytes));
          }, progressCallback);
        }
      }
      __name(_hash, "_hash");
      bcrypt.encodeBase64 = base64_encode;
      bcrypt.decodeBase64 = base64_decode;
      return bcrypt;
    });
  }
});

// lib/firebase-custom-token.ts
function normalizePemPrivateKey(privateKey) {
  return privateKey.replace(/\\n/g, "\n").trim();
}
function base64Encode(bytes) {
  if (typeof btoa === "function") {
    let binary = "";
    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index]);
    }
    return btoa(binary);
  }
  const maybeBuffer = globalThis.Buffer;
  if (maybeBuffer) {
    return maybeBuffer.from(bytes).toString("base64");
  }
  throw new Error("No base64 encoder available in this runtime");
}
function base64Decode(base64) {
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }
  const maybeBuffer = globalThis.Buffer;
  if (maybeBuffer) {
    return new Uint8Array(maybeBuffer.from(base64, "base64"));
  }
  throw new Error("No base64 decoder available in this runtime");
}
function base64UrlEncodeJson(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return base64Encode(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function base64UrlEncodeBytes(bytes) {
  return base64Encode(new Uint8Array(bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function pemToPkcs8Bytes(privateKeyPem) {
  const normalizedPem = normalizePemPrivateKey(privateKeyPem);
  const base64 = normalizedPem.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s+/g, "");
  return base64Decode(base64).buffer;
}
async function signRs256(data, privateKeyPem) {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8Bytes(privateKeyPem),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(data)
  );
  return base64UrlEncodeBytes(signed);
}
async function createFirebaseCustomToken(payload, options) {
  const nowSeconds = Math.floor((options.nowMs ?? Date.now()) / 1e3);
  const tokenHeader = {
    alg: "RS256",
    typ: "JWT"
  };
  const tokenPayload = {
    iss: options.serviceAccountEmail,
    sub: options.serviceAccountEmail,
    aud: FIREBASE_CUSTOM_TOKEN_AUDIENCE,
    iat: nowSeconds,
    exp: nowSeconds + FIREBASE_CUSTOM_TOKEN_TTL_SECONDS,
    uid: payload.uid,
    claims: payload.claims
  };
  const encodedHeader = base64UrlEncodeJson(tokenHeader);
  const encodedPayload = base64UrlEncodeJson(tokenPayload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await signRs256(signingInput, options.serviceAccountPrivateKey);
  return `${signingInput}.${signature}`;
}
var FIREBASE_CUSTOM_TOKEN_AUDIENCE, FIREBASE_CUSTOM_TOKEN_TTL_SECONDS;
var init_firebase_custom_token = __esm({
  "lib/firebase-custom-token.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    FIREBASE_CUSTOM_TOKEN_AUDIENCE = "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";
    FIREBASE_CUSTOM_TOKEN_TTL_SECONDS = 60 * 60;
    __name(normalizePemPrivateKey, "normalizePemPrivateKey");
    __name(base64Encode, "base64Encode");
    __name(base64Decode, "base64Decode");
    __name(base64UrlEncodeJson, "base64UrlEncodeJson");
    __name(base64UrlEncodeBytes, "base64UrlEncodeBytes");
    __name(pemToPkcs8Bytes, "pemToPkcs8Bytes");
    __name(signRs256, "signRs256");
    __name(createFirebaseCustomToken, "createFirebaseCustomToken");
  }
});

// api/staff-auth-session.ts
function getMaxAttempts(env2) {
  const parsed = Number.parseInt(env2.PRIME_STAFF_LOCKOUT_MAX_ATTEMPTS ?? "", 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return DEFAULT_MAX_ATTEMPTS;
}
function getLockoutWindowMs(env2) {
  const parsed = Number.parseInt(env2.PRIME_STAFF_LOCKOUT_WINDOW_SECONDS ?? "", 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed * 1e3;
  }
  return DEFAULT_LOCKOUT_WINDOW_SECONDS * 1e3;
}
function normalizeRole(role) {
  const normalizedRole = (role ?? "staff").toLowerCase();
  if (STAFF_ROLE_PRIORITY2.includes(normalizedRole)) {
    return normalizedRole;
  }
  return "staff";
}
function getStaffUid(env2) {
  return (env2.PRIME_STAFF_AUTH_UID ?? "prime_staff").trim() || "prime_staff";
}
function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP")?.trim() || "unknown";
}
function getLockoutStateKey(clientIp) {
  return `prime:staff-auth:lockout:${clientIp}`;
}
async function readLockoutState(env2, key) {
  if (!env2.RATE_LIMIT) {
    return {
      failedAttempts: 0,
      lockedUntil: null,
      lastFailedAt: null
    };
  }
  const raw = await env2.RATE_LIMIT.get(key);
  if (!raw) {
    return {
      failedAttempts: 0,
      lockedUntil: null,
      lastFailedAt: null
    };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      failedAttempts: Number.isFinite(parsed.failedAttempts) ? Number(parsed.failedAttempts) : 0,
      lockedUntil: Number.isFinite(parsed.lockedUntil) ? Number(parsed.lockedUntil) : null,
      lastFailedAt: Number.isFinite(parsed.lastFailedAt) ? Number(parsed.lastFailedAt) : null
    };
  } catch {
    return {
      failedAttempts: 0,
      lockedUntil: null,
      lastFailedAt: null
    };
  }
}
async function writeLockoutState(env2, key, state) {
  if (!env2.RATE_LIMIT) {
    return;
  }
  await env2.RATE_LIMIT.put(key, JSON.stringify(state), {
    expirationTtl: LOCKOUT_STATE_TTL_SECONDS
  });
}
async function clearLockoutState(env2, key) {
  if (!env2.RATE_LIMIT) {
    return;
  }
  await env2.RATE_LIMIT.delete(key);
}
function buildFailurePayload(error3, state, maxAttempts) {
  const attemptsRemaining = Math.max(0, maxAttempts - state.failedAttempts);
  return {
    error: error3,
    failedAttempts: state.failedAttempts,
    attemptsRemaining,
    lockedUntil: state.lockedUntil
  };
}
var import_bcryptjs, DEFAULT_MAX_ATTEMPTS, DEFAULT_LOCKOUT_WINDOW_SECONDS, LOCKOUT_STATE_TTL_SECONDS, STAFF_ROLE_PRIORITY2, onRequestPost7;
var init_staff_auth_session = __esm({
  "api/staff-auth-session.ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    import_bcryptjs = __toESM(require_bcrypt());
    init_firebase_custom_token();
    init_firebase_rest();
    DEFAULT_MAX_ATTEMPTS = 5;
    DEFAULT_LOCKOUT_WINDOW_SECONDS = 15 * 60;
    LOCKOUT_STATE_TTL_SECONDS = 60 * 60;
    STAFF_ROLE_PRIORITY2 = ["owner", "admin", "staff"];
    __name(getMaxAttempts, "getMaxAttempts");
    __name(getLockoutWindowMs, "getLockoutWindowMs");
    __name(normalizeRole, "normalizeRole");
    __name(getStaffUid, "getStaffUid");
    __name(getClientIp, "getClientIp");
    __name(getLockoutStateKey, "getLockoutStateKey");
    __name(readLockoutState, "readLockoutState");
    __name(writeLockoutState, "writeLockoutState");
    __name(clearLockoutState, "clearLockoutState");
    __name(buildFailurePayload, "buildFailurePayload");
    onRequestPost7 = /* @__PURE__ */ __name(async ({ request, env: env2 }) => {
      if (!env2.PRIME_STAFF_PIN_HASH) {
        return errorResponse("Staff auth is not configured (missing PRIME_STAFF_PIN_HASH)", 503);
      }
      if (!env2.PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL || !env2.PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY) {
        return errorResponse(
          "Staff auth is not configured (missing Firebase service account credentials)",
          503
        );
      }
      let body;
      try {
        body = await request.json();
      } catch {
        return errorResponse("Invalid JSON body", 400);
      }
      const pin = (body.pin ?? "").trim();
      if (!pin) {
        return errorResponse("PIN is required", 400);
      }
      const maxAttempts = getMaxAttempts(env2);
      const lockoutWindowMs = getLockoutWindowMs(env2);
      const now = Date.now();
      const lockoutKey = getLockoutStateKey(getClientIp(request));
      const existingState = await readLockoutState(env2, lockoutKey);
      if (existingState.lockedUntil !== null && existingState.lockedUntil > now) {
        return jsonResponse(
          buildFailurePayload("Too many invalid PIN attempts. Try again later.", existingState, maxAttempts),
          429
        );
      }
      const pinMatches = await (0, import_bcryptjs.compare)(pin, env2.PRIME_STAFF_PIN_HASH);
      if (!pinMatches) {
        const nextFailedAttempts = existingState.failedAttempts + 1;
        const shouldLock = nextFailedAttempts >= maxAttempts;
        const nextState = {
          failedAttempts: nextFailedAttempts,
          lockedUntil: shouldLock ? now + lockoutWindowMs : null,
          lastFailedAt: now
        };
        await writeLockoutState(env2, lockoutKey, nextState);
        return jsonResponse(buildFailurePayload("Invalid PIN", nextState, maxAttempts), 401);
      }
      await clearLockoutState(env2, lockoutKey);
      const role = normalizeRole(env2.PRIME_STAFF_AUTH_ROLE);
      const uid = getStaffUid(env2);
      const claims = {
        role,
        roles: [role],
        staff: true,
        hostelId: "prime"
      };
      const customToken = await createFirebaseCustomToken(
        {
          uid,
          claims
        },
        {
          serviceAccountEmail: env2.PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL,
          serviceAccountPrivateKey: env2.PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY,
          nowMs: now
        }
      );
      return jsonResponse({
        customToken,
        uid,
        role,
        claims
      });
    }, "onRequestPost");
  }
});

// g/[token].ts
var onRequest;
var init_token = __esm({
  "g/[token].ts"() {
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    onRequest = /* @__PURE__ */ __name(async ({ params, request }) => {
      const token = params.token;
      const url = new URL(request.url);
      url.pathname = "/g/";
      url.searchParams.set("token", token);
      return Response.redirect(url.toString(), 302);
    }, "onRequest");
  }
});

// ../.wrangler/tmp/pages-JMy5rI/functionsRoutes-0.09631784979000191.mjs
var routes;
var init_functionsRoutes_0_09631784979000191 = __esm({
  "../.wrangler/tmp/pages-JMy5rI/functionsRoutes-0.09631784979000191.mjs"() {
    init_bookings();
    init_guest_details();
    init_preorders();
    init_preorders();
    init_bag_drop_request();
    init_check_in_code();
    init_check_in_code();
    init_check_in_lookup();
    init_extension_request();
    init_find_booking();
    init_guest_booking();
    init_guest_session2();
    init_guest_session2();
    init_process_messaging_queue();
    init_staff_auth_session();
    init_token();
    routes = [
      {
        routePath: "/api/firebase/bookings",
        mountPath: "/api/firebase",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet]
      },
      {
        routePath: "/api/firebase/guest-details",
        mountPath: "/api/firebase",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet2]
      },
      {
        routePath: "/api/firebase/preorders",
        mountPath: "/api/firebase",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet3]
      },
      {
        routePath: "/api/firebase/preorders",
        mountPath: "/api/firebase",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost]
      },
      {
        routePath: "/api/bag-drop-request",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost2]
      },
      {
        routePath: "/api/check-in-code",
        mountPath: "/api",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet4]
      },
      {
        routePath: "/api/check-in-code",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost3]
      },
      {
        routePath: "/api/check-in-lookup",
        mountPath: "/api",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet5]
      },
      {
        routePath: "/api/extension-request",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost4]
      },
      {
        routePath: "/api/find-booking",
        mountPath: "/api",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet6]
      },
      {
        routePath: "/api/guest-booking",
        mountPath: "/api",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet7]
      },
      {
        routePath: "/api/guest-session",
        mountPath: "/api",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet8]
      },
      {
        routePath: "/api/guest-session",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost5]
      },
      {
        routePath: "/api/process-messaging-queue",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost6]
      },
      {
        routePath: "/api/staff-auth-session",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost7]
      },
      {
        routePath: "/g/:token",
        mountPath: "/g",
        method: "",
        middlewares: [],
        modules: [onRequest]
      }
    ];
  }
});

// ../../../node_modules/.pnpm/path-to-regexp@8.3.0/node_modules/path-to-regexp/dist/index.js
var require_dist = __commonJS({
  "../../../node_modules/.pnpm/path-to-regexp@8.3.0/node_modules/path-to-regexp/dist/index.js"(exports) {
    "use strict";
    init_functionsRoutes_0_09631784979000191();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PathError = exports.TokenData = void 0;
    exports.parse = parse;
    exports.compile = compile;
    exports.match = match2;
    exports.pathToRegexp = pathToRegexp;
    exports.stringify = stringify;
    var DEFAULT_DELIMITER = "/";
    var NOOP_VALUE = /* @__PURE__ */ __name((value) => value, "NOOP_VALUE");
    var ID_START = /^[$_\p{ID_Start}]$/u;
    var ID_CONTINUE = /^[$\u200c\u200d\p{ID_Continue}]$/u;
    var SIMPLE_TOKENS = {
      // Groups.
      "{": "{",
      "}": "}",
      // Reserved.
      "(": "(",
      ")": ")",
      "[": "[",
      "]": "]",
      "+": "+",
      "?": "?",
      "!": "!"
    };
    function escapeText(str) {
      return str.replace(/[{}()\[\]+?!:*\\]/g, "\\$&");
    }
    __name(escapeText, "escapeText");
    function escape(str) {
      return str.replace(/[.+*?^${}()[\]|/\\]/g, "\\$&");
    }
    __name(escape, "escape");
    var TokenData = class {
      static {
        __name(this, "TokenData");
      }
      constructor(tokens, originalPath) {
        this.tokens = tokens;
        this.originalPath = originalPath;
      }
    };
    exports.TokenData = TokenData;
    var PathError = class extends TypeError {
      static {
        __name(this, "PathError");
      }
      constructor(message, originalPath) {
        let text = message;
        if (originalPath)
          text += `: ${originalPath}`;
        text += `; visit https://git.new/pathToRegexpError for info`;
        super(text);
        this.originalPath = originalPath;
      }
    };
    exports.PathError = PathError;
    function parse(str, options = {}) {
      const { encodePath = NOOP_VALUE } = options;
      const chars = [...str];
      const tokens = [];
      let index = 0;
      let pos = 0;
      function name() {
        let value = "";
        if (ID_START.test(chars[index])) {
          do {
            value += chars[index++];
          } while (ID_CONTINUE.test(chars[index]));
        } else if (chars[index] === '"') {
          let quoteStart = index;
          while (index++ < chars.length) {
            if (chars[index] === '"') {
              index++;
              quoteStart = 0;
              break;
            }
            if (chars[index] === "\\")
              index++;
            value += chars[index];
          }
          if (quoteStart) {
            throw new PathError(`Unterminated quote at index ${quoteStart}`, str);
          }
        }
        if (!value) {
          throw new PathError(`Missing parameter name at index ${index}`, str);
        }
        return value;
      }
      __name(name, "name");
      while (index < chars.length) {
        const value = chars[index];
        const type = SIMPLE_TOKENS[value];
        if (type) {
          tokens.push({ type, index: index++, value });
        } else if (value === "\\") {
          tokens.push({ type: "escape", index: index++, value: chars[index++] });
        } else if (value === ":") {
          tokens.push({ type: "param", index: index++, value: name() });
        } else if (value === "*") {
          tokens.push({ type: "wildcard", index: index++, value: name() });
        } else {
          tokens.push({ type: "char", index: index++, value });
        }
      }
      tokens.push({ type: "end", index, value: "" });
      function consumeUntil(endType) {
        const output = [];
        while (true) {
          const token = tokens[pos++];
          if (token.type === endType)
            break;
          if (token.type === "char" || token.type === "escape") {
            let path = token.value;
            let cur = tokens[pos];
            while (cur.type === "char" || cur.type === "escape") {
              path += cur.value;
              cur = tokens[++pos];
            }
            output.push({
              type: "text",
              value: encodePath(path)
            });
            continue;
          }
          if (token.type === "param" || token.type === "wildcard") {
            output.push({
              type: token.type,
              name: token.value
            });
            continue;
          }
          if (token.type === "{") {
            output.push({
              type: "group",
              tokens: consumeUntil("}")
            });
            continue;
          }
          throw new PathError(`Unexpected ${token.type} at index ${token.index}, expected ${endType}`, str);
        }
        return output;
      }
      __name(consumeUntil, "consumeUntil");
      return new TokenData(consumeUntil("end"), str);
    }
    __name(parse, "parse");
    function compile(path, options = {}) {
      const { encode = encodeURIComponent, delimiter = DEFAULT_DELIMITER } = options;
      const data = typeof path === "object" ? path : parse(path, options);
      const fn = tokensToFunction(data.tokens, delimiter, encode);
      return /* @__PURE__ */ __name(function path2(params = {}) {
        const [path3, ...missing] = fn(params);
        if (missing.length) {
          throw new TypeError(`Missing parameters: ${missing.join(", ")}`);
        }
        return path3;
      }, "path");
    }
    __name(compile, "compile");
    function tokensToFunction(tokens, delimiter, encode) {
      const encoders = tokens.map((token) => tokenToFunction(token, delimiter, encode));
      return (data) => {
        const result = [""];
        for (const encoder of encoders) {
          const [value, ...extras] = encoder(data);
          result[0] += value;
          result.push(...extras);
        }
        return result;
      };
    }
    __name(tokensToFunction, "tokensToFunction");
    function tokenToFunction(token, delimiter, encode) {
      if (token.type === "text")
        return () => [token.value];
      if (token.type === "group") {
        const fn = tokensToFunction(token.tokens, delimiter, encode);
        return (data) => {
          const [value, ...missing] = fn(data);
          if (!missing.length)
            return [value];
          return [""];
        };
      }
      const encodeValue = encode || NOOP_VALUE;
      if (token.type === "wildcard" && encode !== false) {
        return (data) => {
          const value = data[token.name];
          if (value == null)
            return ["", token.name];
          if (!Array.isArray(value) || value.length === 0) {
            throw new TypeError(`Expected "${token.name}" to be a non-empty array`);
          }
          return [
            value.map((value2, index) => {
              if (typeof value2 !== "string") {
                throw new TypeError(`Expected "${token.name}/${index}" to be a string`);
              }
              return encodeValue(value2);
            }).join(delimiter)
          ];
        };
      }
      return (data) => {
        const value = data[token.name];
        if (value == null)
          return ["", token.name];
        if (typeof value !== "string") {
          throw new TypeError(`Expected "${token.name}" to be a string`);
        }
        return [encodeValue(value)];
      };
    }
    __name(tokenToFunction, "tokenToFunction");
    function match2(path, options = {}) {
      const { decode = decodeURIComponent, delimiter = DEFAULT_DELIMITER } = options;
      const { regexp, keys } = pathToRegexp(path, options);
      const decoders = keys.map((key) => {
        if (decode === false)
          return NOOP_VALUE;
        if (key.type === "param")
          return decode;
        return (value) => value.split(delimiter).map(decode);
      });
      return /* @__PURE__ */ __name(function match3(input) {
        const m = regexp.exec(input);
        if (!m)
          return false;
        const path2 = m[0];
        const params = /* @__PURE__ */ Object.create(null);
        for (let i = 1; i < m.length; i++) {
          if (m[i] === void 0)
            continue;
          const key = keys[i - 1];
          const decoder = decoders[i - 1];
          params[key.name] = decoder(m[i]);
        }
        return { path: path2, params };
      }, "match");
    }
    __name(match2, "match");
    function pathToRegexp(path, options = {}) {
      const { delimiter = DEFAULT_DELIMITER, end = true, sensitive = false, trailing = true } = options;
      const keys = [];
      const flags = sensitive ? "" : "i";
      const sources = [];
      for (const input of pathsToArray(path, [])) {
        const data = typeof input === "object" ? input : parse(input, options);
        for (const tokens of flatten(data.tokens, 0, [])) {
          sources.push(toRegExpSource(tokens, delimiter, keys, data.originalPath));
        }
      }
      let pattern = `^(?:${sources.join("|")})`;
      if (trailing)
        pattern += `(?:${escape(delimiter)}$)?`;
      pattern += end ? "$" : `(?=${escape(delimiter)}|$)`;
      const regexp = new RegExp(pattern, flags);
      return { regexp, keys };
    }
    __name(pathToRegexp, "pathToRegexp");
    function pathsToArray(paths, init) {
      if (Array.isArray(paths)) {
        for (const p of paths)
          pathsToArray(p, init);
      } else {
        init.push(paths);
      }
      return init;
    }
    __name(pathsToArray, "pathsToArray");
    function* flatten(tokens, index, init) {
      if (index === tokens.length) {
        return yield init;
      }
      const token = tokens[index];
      if (token.type === "group") {
        for (const seq of flatten(token.tokens, 0, init.slice())) {
          yield* flatten(tokens, index + 1, seq);
        }
      } else {
        init.push(token);
      }
      yield* flatten(tokens, index + 1, init);
    }
    __name(flatten, "flatten");
    function toRegExpSource(tokens, delimiter, keys, originalPath) {
      let result = "";
      let backtrack = "";
      let isSafeSegmentParam = true;
      for (const token of tokens) {
        if (token.type === "text") {
          result += escape(token.value);
          backtrack += token.value;
          isSafeSegmentParam || (isSafeSegmentParam = token.value.includes(delimiter));
          continue;
        }
        if (token.type === "param" || token.type === "wildcard") {
          if (!isSafeSegmentParam && !backtrack) {
            throw new PathError(`Missing text before "${token.name}" ${token.type}`, originalPath);
          }
          if (token.type === "param") {
            result += `(${negate(delimiter, isSafeSegmentParam ? "" : backtrack)}+)`;
          } else {
            result += `([\\s\\S]+)`;
          }
          keys.push(token);
          backtrack = "";
          isSafeSegmentParam = false;
          continue;
        }
      }
      return result;
    }
    __name(toRegExpSource, "toRegExpSource");
    function negate(delimiter, backtrack) {
      if (backtrack.length < 2) {
        if (delimiter.length < 2)
          return `[^${escape(delimiter + backtrack)}]`;
        return `(?:(?!${escape(delimiter)})[^${escape(backtrack)}])`;
      }
      if (delimiter.length < 2) {
        return `(?:(?!${escape(backtrack)})[^${escape(delimiter)}])`;
      }
      return `(?:(?!${escape(backtrack)}|${escape(delimiter)})[\\s\\S])`;
    }
    __name(negate, "negate");
    function stringifyTokens(tokens) {
      let value = "";
      let i = 0;
      function name(value2) {
        const isSafe = isNameSafe(value2) && isNextNameSafe(tokens[i]);
        return isSafe ? value2 : JSON.stringify(value2);
      }
      __name(name, "name");
      while (i < tokens.length) {
        const token = tokens[i++];
        if (token.type === "text") {
          value += escapeText(token.value);
          continue;
        }
        if (token.type === "group") {
          value += `{${stringifyTokens(token.tokens)}}`;
          continue;
        }
        if (token.type === "param") {
          value += `:${name(token.name)}`;
          continue;
        }
        if (token.type === "wildcard") {
          value += `*${name(token.name)}`;
          continue;
        }
        throw new TypeError(`Unknown token type: ${token.type}`);
      }
      return value;
    }
    __name(stringifyTokens, "stringifyTokens");
    function stringify(data) {
      return stringifyTokens(data.tokens);
    }
    __name(stringify, "stringify");
    function isNameSafe(name) {
      const [first, ...rest] = name;
      return ID_START.test(first) && rest.every((char) => ID_CONTINUE.test(char));
    }
    __name(isNameSafe, "isNameSafe");
    function isNextNameSafe(token) {
      if (token && token.type === "text")
        return !ID_CONTINUE.test(token.value[0]);
      return true;
    }
    __name(isNextNameSafe, "isNextNameSafe");
  }
});

// ../.wrangler/tmp/bundle-ffHqik/middleware-loader.entry.ts
init_functionsRoutes_0_09631784979000191();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../.wrangler/tmp/bundle-ffHqik/middleware-insertion-facade.js
init_functionsRoutes_0_09631784979000191();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../../node_modules/.pnpm/wrangler@4.60.0_@cloudflare+workers-types@4.20260123.0/node_modules/wrangler/templates/pages-template-worker.ts
init_functionsRoutes_0_09631784979000191();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var import_path_to_regexp = __toESM(require_dist());
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = (0, import_path_to_regexp.match)(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = (0, import_path_to_regexp.match)(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = (0, import_path_to_regexp.match)(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = (0, import_path_to_regexp.match)(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context2 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context2);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error3) {
      if (isFailOpen) {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error3;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../node_modules/.pnpm/wrangler@4.60.0_@cloudflare+workers-types@4.20260123.0/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_functionsRoutes_0_09631784979000191();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../node_modules/.pnpm/wrangler@4.60.0_@cloudflare+workers-types@4.20260123.0/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_functionsRoutes_0_09631784979000191();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-ffHqik/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../node_modules/.pnpm/wrangler@4.60.0_@cloudflare+workers-types@4.20260123.0/node_modules/wrangler/templates/middleware/common.ts
init_functionsRoutes_0_09631784979000191();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-ffHqik/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
/*! Bundled license information:

bcryptjs/dist/bcrypt.js:
  (**
   * @license bcrypt.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
   * Released under the Apache License, Version 2.0
   * see: https://github.com/dcodeIO/bcrypt.js for details
   *)
*/
//# sourceMappingURL=functionsWorker-0.13164947693298323.mjs.map
