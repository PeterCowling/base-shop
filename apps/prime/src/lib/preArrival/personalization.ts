import type { ArrivalConfidence, EtaMethod } from '../../types/preArrival';
import type { Route, TransportMode } from '../../types/routes';

const METHOD_TO_PRIMARY_MODE: Partial<Record<EtaMethod, TransportMode>> = {
  bus: 'bus',
  ferry: 'ferry',
  train: 'train',
  taxi: 'taxi',
  private: 'taxi',
};

const CONFIDENCE_DEFAULT_ETA: Record<ArrivalConfidence, string> = {
  confident: '17:30-18:00',
  'need-guidance': '18:00-18:30',
};

const BASE_ETA_WINDOWS = [
  '16:30-17:00',
  '17:00-17:30',
  '17:30-18:00',
  '18:00-18:30',
  '18:30-19:00',
] as const;

export function sortRoutesForPersonalization(routes: Route[], method: EtaMethod | null): Route[] {
  const preferredMode = method ? METHOD_TO_PRIMARY_MODE[method] : null;
  if (!preferredMode) {
    return [...routes];
  }

  const preferred = routes.filter((route) => route.primaryMode === preferredMode);
  const others = routes.filter((route) => route.primaryMode !== preferredMode);
  return [...preferred, ...others];
}

export function getDefaultEtaWindow(confidence: ArrivalConfidence | null): string {
  if (!confidence) {
    return '18:00-18:30';
  }

  return CONFIDENCE_DEFAULT_ETA[confidence];
}

export function getEtaWindowOptions(confidence: ArrivalConfidence | null): string[] {
  const preferredWindow = getDefaultEtaWindow(confidence);
  return [preferredWindow, ...BASE_ETA_WINDOWS.filter((window) => window !== preferredWindow)];
}
