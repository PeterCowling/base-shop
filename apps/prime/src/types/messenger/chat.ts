// src/types/messenger/chat.ts
import type { Role } from './roles';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderRole: Role;
  senderName?: string;
  createdAt: number;
  deleted?: boolean;
  imageUrl?: string;
}
