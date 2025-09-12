import { renderHook } from "@testing-library/react";
import * as pkg from "../index";

describe("index exports", () => {
  it("exposes startReverseLogisticsService", () => {
    expect(pkg.startReverseLogisticsService).toBe(
      require("../startReverseLogisticsService").startReverseLogisticsService,
    );
  });

  it("exposes startLateFeeService", () => {
    expect(pkg.startLateFeeService).toBe(
      require("../lateFeeService").startLateFeeService,
    );
  });

  it("exposes useFSM", () => {
    expect(pkg.useFSM).toBe(require("../useFSM").useFSM);
    const { result } = renderHook(() => pkg.useFSM("idle", []));
    expect(result.current.state).toBe("idle");
  });

  it("exposes maintenance scheduler", () => {
    const mod = require("../maintenanceScheduler");
    expect(pkg.runMaintenanceScan).toBe(mod.runMaintenanceScan);
    expect(pkg.startMaintenanceScheduler).toBe(mod.startMaintenanceScheduler);
  });
});
