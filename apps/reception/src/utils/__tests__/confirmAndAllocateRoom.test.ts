import "@testing-library/jest-dom";
import Swal from "sweetalert2";

import { confirmAndAllocateRoom } from "../confirmAndAllocateRoom";
import * as toastUtils from "../toastUtils";

describe("confirmAndAllocateRoom", () => {
  const fireMock = jest.fn();
  const toastMock = jest.fn();

  beforeEach(() => {
    jest.spyOn(Swal, "fire").mockImplementation(fireMock);
    jest.spyOn(toastUtils, "showToast").mockImplementation(toastMock);
    fireMock.mockReset();
    toastMock.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns early when room value is unchanged", async () => {
    const onConfirm = jest.fn();
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
    const onConfirm = jest.fn().mockResolvedValue("102");
    const onSuccess = jest.fn();
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
    const onConfirm = jest.fn();
    const onConfirmAll = jest.fn().mockResolvedValue(undefined);
    const onSuccess = jest.fn();
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
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
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
    const onConfirm = jest.fn();
    const onDismiss = jest.fn();
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
