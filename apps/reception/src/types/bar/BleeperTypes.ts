/* File: /src/types/BleeperTypes.ts */
export interface BleepersState {
  [key: number]: boolean;
}

export interface BleeperResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UseBleepersResult {
  bleepers: BleepersState;
  loading: boolean;
  error: unknown;
  setBleeperAvailability: (
    bleeperNumber: number,
    isAvailable: boolean
  ) => Promise<BleeperResult>;
  findNextAvailableBleeper: (start?: number) => number | null;
  firstAvailableBleeper: number | null;
}
