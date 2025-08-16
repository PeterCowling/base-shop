import type { Options } from "./parse";
/**
 * Prompt for any options not provided on the command line.
 */
export declare function gatherOptions(shopId: string, options: Options, themeProvided: boolean, templateProvided: boolean): Promise<void>;
