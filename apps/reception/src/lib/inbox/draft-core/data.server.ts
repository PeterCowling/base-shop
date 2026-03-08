import "server-only";

import briketteKnowledgeSnapshot from "../../../../data/brikette-knowledge.snapshot.json";
import draftGuideData from "../../../../data/draft-guide.json";
import emailTemplatesData from "../../../../data/email-templates.json";
import rankerTemplatePriorsData from "../../../../data/ranker-template-priors.json";
import voiceExamplesData from "../../../../data/voice-examples.json";

export type ReceptionKnowledgeSnapshot = typeof briketteKnowledgeSnapshot;
export type ReceptionKnowledgeResourceUri =
  keyof ReceptionKnowledgeSnapshot["resources"];
export type ReceptionDraftGuide = typeof draftGuideData;
export type ReceptionEmailTemplate = (typeof emailTemplatesData)[number];
export type ReceptionRankerTemplatePriors = typeof rankerTemplatePriorsData;
export type ReceptionVoiceExamples = typeof voiceExamplesData;

export function getBriketteKnowledgeSnapshot(): ReceptionKnowledgeSnapshot {
  return briketteKnowledgeSnapshot;
}

export function getDraftGuideData(): ReceptionDraftGuide {
  return draftGuideData;
}

export function getEmailTemplates(): ReceptionEmailTemplate[] {
  return emailTemplatesData;
}

export function getRankerTemplatePriors(): ReceptionRankerTemplatePriors {
  return rankerTemplatePriorsData;
}

export function getVoiceExamplesData(): ReceptionVoiceExamples {
  return voiceExamplesData;
}
