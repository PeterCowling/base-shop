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
  type CardRow,
  type CardUpdateInput,
  CardSchema,
  CardFrontmatterSchema,
  CardUpdateInputSchema,
  type Lane,
  LaneSchema,
  type Priority,
  PrioritySchema,
  listCardsForBoard,
  getCardById,
  upsertCard,
  moveCardToLane,
  getCardsVersion,
} from "./businessOsCards.server";

// Ideas repository
export {
  type Idea,
  type IdeaFrontmatter,
  type IdeaRow,
  IdeaSchema,
  IdeaFrontmatterSchema,
  type IdeaStatus,
  IdeaStatusSchema,
  type IdeaLocation,
  IdeaLocationSchema,
  listInboxIdeas,
  listWorkedIdeas,
  getIdeaById,
  upsertIdea,
  updateIdeaStatus,
} from "./businessOsIdeas.server";

// Stage docs repository
export {
  type StageDoc,
  type StageDocFrontmatter,
  type StageDocRow,
  StageDocSchema,
  StageDocFrontmatterSchema,
  type StageType,
  StageTypeSchema,
  listStageDocsForCard,
  getStageDocById,
  getLatestStageDoc,
  upsertStageDoc,
} from "./businessOsStageDocs.server";

// Audit log repository
export {
  type AuditEntry,
  AuditEntrySchema,
  type AuditEntityType,
  AuditEntityTypeSchema,
  type AuditAction,
  AuditActionSchema,
  appendAuditEntry,
  listAuditEntries,
  listRecentAuditEntries,
  listAuditEntriesByActor,
} from "./businessOsAudit.server";
