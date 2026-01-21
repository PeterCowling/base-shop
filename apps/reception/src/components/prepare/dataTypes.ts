/* File: src/types/dataTypes.ts */
export interface OccupantInfo {
  guestIds: string[];
}

export interface DateToRoomMap {
  [roomIndex: string]: {
    [roomNumber: string]: OccupantInfo;
  };
}

export interface RoomsByDateData {
  [date: string]: DateToRoomMap;
}

export interface CheckinsByDateData {
  [date: string]: {
    [checkinId: string]: unknown; // Or a more specific type if known
  };
}
