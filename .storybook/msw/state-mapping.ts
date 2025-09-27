import type { StoryDataState, ToolbarGlobals } from '../types';

export interface MswState {
  delayMs: number;
  netError: boolean;
  scenario: NonNullable<ToolbarGlobals['scenario']>;
}

export function mapDataStateToMsw(
  state: StoryDataState,
  globals: Partial<ToolbarGlobals>
): MswState {
  const netProfile = globals.net ?? 'normal';
  const scenario = globals.scenario ?? 'featured';

  const delayMs = netProfile === 'fast' ? 0 : netProfile === 'slow' ? 1200 : 300;
  const netError = state === 'error' || globals.netError === 'on';

  return { delayMs, netError, scenario };
}

