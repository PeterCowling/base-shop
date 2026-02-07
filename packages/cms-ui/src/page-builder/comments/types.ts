export type ThreadMessage = { id: string; text: string; ts: string };

export type Thread = {
  id: string;
  componentId: string;
  resolved: boolean;
  assignedTo?: string | null;
  messages: ThreadMessage[];
  pos?: { x: number; y: number } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ComponentRect = { left: number; top: number; width: number; height: number };

export type PositionsMap = Record<string, ComponentRect>;

