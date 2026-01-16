import Swal from "sweetalert2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { confirmAndAllocateRoom } from "../confirmAndAllocateRoom";
import * as toastUtils from "../toastUtils";

describe("confirmAndAllocateRoom", () => {
  const fireMock = vi.fn();
  const toastMock = vi.fn();

  beforeEach(() => {
    vi.spyOn(Swal, "fire").mockImplementation(fireMock);
    vi.spyOn(toastUtils, "showToast").mockImplementation(toastMock);
    fireMock.mockReset();
    toastMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns early when room value is unchanged", async () => {
    const onConfirm = vi.fn();
    confirmAndAllocateRoom({
      occupantId: "1",
      oldRoomValue: "101",
      newRoomValue: "101",
      onConfirm,
    });
    expect(fireMock).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("triggers onConfirm and onSuccess when confirmed", async () => {
    const onConfirm = vi.fn().mockResolvedValue("102");
    const onSuccess = vi.fn();
    fireMock.mockResolvedValue({ isConfirmed: true });

    await confirmAndAllocateRoom({
      occupantId: "1",
      oldRoomValue: "101",
      newRoomValue: "102",
      onConfirm,
      onSuccess,
    });

    expect(fireMock).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith("102");
  });

  it("calls onConfirmAll and shows success toast when 'All guests' selected", async () => {
    const onConfirm = vi.fn();
    const onConfirmAll = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    fireMock.mockResolvedValue({ isDenied: true });

    await confirmAndAllocateRoom({
      occupantId: "1",
      oldRoomValue: "101",
      newRoomValue: "102",
      onConfirm,
      onConfirmAll,
      onSuccess,
      occupantCount: 2,
    });

    expect(fireMock).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onConfirmAll).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      "All guests successfully moved to 102.",
      "success"
    );
    expect(onSuccess).toHaveBeenCalledWith("102");
  });

  it("shows info toast and calls onCancel when cancelled", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    fireMock.mockResolvedValue({ dismiss: Swal.DismissReason.cancel });

    await confirmAndAllocateRoom({
      occupantId: "1",
      oldRoomValue: "101",
      newRoomValue: "102",
      onConfirm,
      onCancel,
    });

    expect(toastMock).toHaveBeenCalledWith("Cancelling room update.", "info");
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onDismiss when the dialog is dismissed", async () => {
    const onConfirm = vi.fn();
    const onDismiss = vi.fn();
    fireMock.mockResolvedValue({ dismiss: Swal.DismissReason.backdrop });

    await confirmAndAllocateRoom({
      occupantId: "1",
      oldRoomValue: "101",
      newRoomValue: "102",
      onConfirm,
      onDismiss,
    });

    expect(onDismiss).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
