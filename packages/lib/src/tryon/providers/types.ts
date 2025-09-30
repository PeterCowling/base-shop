import type { ProviderResponse } from "@acme/types/tryon";

export interface Segmenter { run(imgUrl: string): Promise<ProviderResponse>; }
export interface DepthEstimator { run(imgUrl: string): Promise<ProviderResponse>; }
export interface PoseEstimator { run(imgUrl: string): Promise<ProviderResponse>; }
export interface Relight {
  run(opts: { baseUrl: string; overlayUrl: string }): Promise<ProviderResponse>;
}
export interface TryOnGenerator {
  run(opts: {
    mode: 'garment';
    sourceUrl: string;
    garmentAssets: { flatUrl?: string; exemplarUrl?: string };
    poseUrl?: string;
    depthUrl?: string;
    maskUrl?: string;
  }): Promise<ProviderResponse>;
}

export interface TryOnProvider {
  segmenter?: Segmenter;
  depth?: DepthEstimator;
  pose?: PoseEstimator;
  relight?: Relight;
  generator?: TryOnGenerator;
}
