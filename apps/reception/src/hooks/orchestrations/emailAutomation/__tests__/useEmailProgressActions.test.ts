import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import { ActivityCode } from "../../../../constants/activities";
import type { Activities } from "../../../../types/hooks/data/activitiesData";
import type { FirebaseBookings } from "../../../../types/hooks/data/bookingsData";
import useEmailProgressActions from "../useEmailProgressActions";

let activities: Activities;
let bookings: FirebaseBookings;
const addActivityMock = jest.fn();

jest.mock("../../../mutations/useActivitiesMutations", () => ({
  default: () => ({ addActivity: addActivityMock }),
}));
jest.mock("../../../data/useActivitiesData", () => ({
  default: () => ({ activities }),
}));
jest.mock("../../../data/useBookingsData", () => ({
  default: () => ({ bookings }),
}));

const bookingRef = "BOOK1";

function setupData() {
  activities = {
    occ1: { a1: { code: ActivityCode.BOOKING_CREATED, who: "sys" } },
    occ2: { a1: { code: ActivityCode.FIRST_REMINDER, who: "sys" } },
    occ3: { a1: { code: ActivityCode.SECOND_REMINDER, who: "sys" } },
    occ4: { a1: { code: ActivityCode.AUTO_CANCEL_NO_TNC, who: "sys" } },
    occ5: { a1: { code: ActivityCode.AGREED_NONREFUNDABLE_TNC, who: "sys" } },
  };
  bookings = {
    [bookingRef]: {
      occ1: {},
      occ2: {},
      occ3: {},
      occ4: {},
      occ5: {},
    },
  };
  addActivityMock.mockReset();
  addActivityMock.mockResolvedValue({ success: true });
}

describe("useEmailProgressActions", () => {
  beforeEach(() => {
    setupData();
  });

  it("logNextActivity advances codes for each occupant", async () => {
    const { result } = renderHook(() => useEmailProgressActions());

    await act(async () => {
      await result.current.logNextActivity({ bookingRef });
    });

    expect(addActivityMock).toHaveBeenCalledTimes(3);
    expect(addActivityMock).toHaveBeenCalledWith(
      "occ1",
      ActivityCode.FIRST_REMINDER
    );
    expect(addActivityMock).toHaveBeenCalledWith(
      "occ2",
      ActivityCode.SECOND_REMINDER
    );
    expect(addActivityMock).toHaveBeenCalledWith(
      "occ3",
      ActivityCode.AUTO_CANCEL_NO_TNC
    );
    expect(addActivityMock).not.toHaveBeenCalledWith("occ4", expect.anything());
    expect(addActivityMock).not.toHaveBeenCalledWith("occ5", expect.anything());
  });

  it("logConfirmActivity logs code 21 for occupants not already confirmed or cancelled", async () => {
    const { result } = renderHook(() => useEmailProgressActions());

    await act(async () => {
      await result.current.logConfirmActivity({ bookingRef });
    });

    expect(addActivityMock).toHaveBeenCalledTimes(3);
    expect(addActivityMock).toHaveBeenCalledWith(
      "occ1",
      ActivityCode.AGREED_NONREFUNDABLE_TNC
    );
    expect(addActivityMock).toHaveBeenCalledWith(
      "occ2",
      ActivityCode.AGREED_NONREFUNDABLE_TNC
    );
    expect(addActivityMock).toHaveBeenCalledWith(
      "occ3",
      ActivityCode.AGREED_NONREFUNDABLE_TNC
    );
    expect(addActivityMock).not.toHaveBeenCalledWith("occ4", expect.anything());
    expect(addActivityMock).not.toHaveBeenCalledWith("occ5", expect.anything());
  });
});
