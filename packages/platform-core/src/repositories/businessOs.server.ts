/**
 * Business OS Repositories Module
 *
 * Centralized exports for all Business OS D1 repositories.
 * Server-only module providing type-safe database operations.
 *
 * @packageDocumentation
 */

import "server-only";

// Cards repository
export {
  type Card,
  type CardFrontmatter,
  CardFrontmatterSchema,
  type CardRow,
  CardSchema,
  type CardUpdateInput,
  CardUpdateInputSchema,
  getCardById,
  getCardsVersion,
  type Lane,
  LaneSchema,
  listCardsForBoard,
  moveCardToLane,
  type Priority,
  PrioritySchema,
  upsertCard,
} from "./businessOsCards.server";

// Ideas repository
export {
  countIdeas,
  getIdeaById,
  type Idea,
  type IdeaFrontmatter,
  IdeaFrontmatterSchema,
  type IdeaLocation,
  IdeaLocationSchema,
  type IdeaPriority,
  IdeaPrioritySchema,
  type IdeaRow,
  IdeaSchema,
  type IdeaStatus,
  IdeaStatusSchema,
  listIdeas,
  type ListIdeasOptions,
  listInboxIdeas,
  listWorkedIdeas,
  updateIdeaStatus,
  upsertIdea,
} from "./businessOsIdeas.server";

// Stage docs repository
export {
  getLatestStageDoc,
  getStageDocById,
  listStageDocsForCard,
  type StageDoc,
  type StageDocFrontmatter,
  StageDocFrontmatterSchema,
  type StageDocRow,
  StageDocSchema,
  type StageType,
  StageTypeSchema,
  upsertStageDoc,
} from "./businessOsStageDocs.server";

// Audit log repository
export {
  appendAuditEntry,
  type AuditAction,
  AuditActionSchema,
  type AuditEntityType,
  AuditEntityTypeSchema,
  type AuditEntry,
  AuditEntrySchema,
  listAuditEntries,
  listAuditEntriesByActor,
  listRecentAuditEntries,
} from "./businessOsAudit.server";

// ID allocation (counters)
export { allocateNextCardId, allocateNextIdeaId } from "./businessOsIds.server";
