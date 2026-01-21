"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { fingerprintLead } from "@/lib/pipeline/fingerprint";

import DuplicateReviewCard from "./DuplicateReviewCard";
import LeadCooldownCard from "./LeadCooldownCard";
import LeadTriageFilters from "./LeadTriageFilters";
import LeadTriageTable from "./LeadTriageTable";
import type {
  DuplicateGroup,
  LeadFilters,
  LeadSummary,
  LeadTriageStrings,
  LeadWithFingerprint,
} from "./types";

type CooldownFormState = {
  reasonCode: string;
  severity: "short_cooldown" | "long_cooldown" | "permanent";
  whatWouldChange: string;
  recheckDays: string;
};

const DEFAULT_FILTERS: LeadFilters = {
  source: "",
  sourceContext: "",
  status: "",
  triageBand: "",
  search: "",
};

function parsePromotionLimit(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function parseRecheckDays(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function withFingerprint(lead: LeadSummary): LeadWithFingerprint {
  const persisted = lead.fingerprint ?? null;
  return {
    ...lead,
    fingerprint: persisted ?? fingerprintLead({ title: lead.title, url: lead.url }),
  };
}

function buildDuplicateGroups(leads: LeadWithFingerprint[]): DuplicateGroup[] {
  const groups = new Map<string, LeadWithFingerprint[]>();
  for (const lead of leads) {
    if (!lead.fingerprint) continue;
    const group = groups.get(lead.fingerprint) ?? [];
    group.push(lead);
    groups.set(lead.fingerprint, group);
  }

  const duplicates: DuplicateGroup[] = [];
  for (const [fingerprint, members] of groups.entries()) {
    if (members.length < 2) continue;
    const sorted = [...members].sort((a, b) => {
      const scoreA = a.triageScore ?? -Infinity;
      const scoreB = b.triageScore ?? -Infinity;
      if (scoreA !== scoreB) return scoreB - scoreA;
      const dateA = a.createdAt ?? "";
      const dateB = b.createdAt ?? "";
      return dateA.localeCompare(dateB);
    });
    const primary = sorted[0] ?? members[0];
    if (!primary) continue;
    duplicates.push({ fingerprint, primary, members: sorted });
  }

  return duplicates;
}

export default function LeadTriageClient({
  strings,
}: {
  strings: LeadTriageStrings;
}) {
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningStageP, setRunningStageP] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<LeadFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<LeadFilters>(DEFAULT_FILTERS);
  const [promotionLimit, setPromotionLimit] = useState("5");
  const promotionValue = useMemo(
    () => parsePromotionLimit(promotionLimit),
    [promotionLimit],
  );

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "200");
      if (filters.source) params.set("source", filters.source);
      if (filters.sourceContext) {
        params.set("source_context", filters.sourceContext);
      }
      if (filters.status) params.set("status", filters.status);
      if (filters.triageBand) {
        params.set("triage_band", filters.triageBand);
      }
      if (filters.search) params.set("q", filters.search);

      const response = await fetch(`/api/leads?${params.toString()}`);
      if (!response.ok) return;
      const data = (await response.json()) as { ok?: boolean; leads?: LeadSummary[] };
      if (data.ok && Array.isArray(data.leads)) {
        setLeads(data.leads);
        const allowed = new Set(data.leads.map((lead) => lead.id));
        setSelectedIds((current) => current.filter((id) => allowed.has(id)));
      }
    } catch (error) {
      console.error(error);
      setMessage(strings.messages.error);
    } finally {
      setLoading(false);
    }
  }, [filters, strings.messages.error]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const leadsWithFingerprint = useMemo(
    () => leads.map(withFingerprint),
    [leads],
  );

  const duplicateGroups = useMemo(
    () => buildDuplicateGroups(leadsWithFingerprint),
    [leadsWithFingerprint],
  );

  const duplicateLookup = useMemo(() => {
    const map = new Map<string, { primaryId: string; isPrimary: boolean }>();
    for (const lead of leadsWithFingerprint) {
      if (!lead.duplicateOf) continue;
      map.set(lead.id, { primaryId: lead.duplicateOf, isPrimary: false });
    }
    for (const group of duplicateGroups) {
      for (const member of group.members) {
        map.set(member.id, {
          primaryId: group.primary.id,
          isPrimary: member.id === group.primary.id,
        });
      }
    }
    return map;
  }, [duplicateGroups, leadsWithFingerprint]);

  const eligibleLeadIds = useMemo(
    () =>
      leads
        .filter((lead) => lead.status === "NEW" || lead.status === "ON_HOLD")
        .map((lead) => lead.id),
    [leads],
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected =
    leads.length > 0 && leads.every((lead) => selectedSet.has(lead.id));

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((current) => {
      if (leads.length === 0) return current;
      const allIds = leads.map((lead) => lead.id);
      const isAllSelected = allIds.every((id) => current.includes(id));
      return isAllSelected ? [] : allIds;
    });
  }, [leads]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((existing) => existing !== id);
      }
      return [...current, id];
    });
  }, []);

  const runStageP = useCallback(async () => {
    if (eligibleLeadIds.length === 0) return;
    setRunningStageP(true);
    setMessage(strings.messages.running);
    try {
      await fetch("/api/stages/p/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: eligibleLeadIds }),
      });
      setMessage(strings.messages.runComplete);
    } catch (error) {
      console.error(error);
      setMessage(strings.messages.error);
    } finally {
      setRunningStageP(false);
      await loadLeads();
    }
  }, [eligibleLeadIds, loadLeads, strings.messages]);

  const promoteTop = useCallback(async () => {
    if (eligibleLeadIds.length === 0) return;
    setRunningStageP(true);
    setMessage(strings.messages.running);
    try {
      await fetch("/api/stages/p/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: eligibleLeadIds,
          promotionLimit: promotionValue,
        }),
      });
      setMessage(strings.messages.runComplete);
    } catch (error) {
      console.error(error);
      setMessage(strings.messages.error);
    } finally {
      setRunningStageP(false);
      await loadLeads();
    }
  }, [eligibleLeadIds, loadLeads, promotionValue, strings.messages]);

  const applyFilters = useCallback(() => {
    setFilters(draftFilters);
  }, [draftFilters]);

  const resetFilters = useCallback(() => {
    setDraftFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
  }, []);

  const updateLeadStatus = useCallback(async (leadId: string, status: string) => {
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }, []);

  const handleHoldGroup = useCallback(
    async (group: DuplicateGroup) => {
      const others = group.members.filter((member) => member.id !== group.primary.id);
      for (const lead of others) {
        await updateLeadStatus(lead.id, "ON_HOLD");
      }
      await loadLeads();
    },
    [loadLeads, updateLeadStatus],
  );

  const applyCooldowns = useCallback(
    async (form: CooldownFormState) => {
      if (selectedIds.length === 0) {
        setMessage(strings.cooldown.noSelection);
        return;
      }

      let successCount = 0;
      const recheckDays = parseRecheckDays(form.recheckDays);
      for (const lead of leadsWithFingerprint) {
        if (!selectedSet.has(lead.id)) continue;
        if (!lead.fingerprint) continue;

        const payload = {
          fingerprint: lead.fingerprint,
          reasonCode: form.reasonCode,
          severity: form.severity,
          whatWouldChange: form.whatWouldChange,
          ...(recheckDays ? { recheckAfterDays: recheckDays } : {}),
          snapshot: {
            leadId: lead.id,
            source: lead.source,
            title: lead.title,
          },
        };

        const response = await fetch("/api/cooldowns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const status = form.severity === "permanent" ? "REJECTED" : "ON_HOLD";
          await updateLeadStatus(lead.id, status);
          successCount += 1;
        }
      }

      setMessage(successCount > 0 ? strings.cooldown.success : strings.cooldown.error);
      setSelectedIds([]);
      await loadLeads();
    },
    [leadsWithFingerprint, loadLeads, selectedIds.length, selectedSet, strings.cooldown, updateLeadStatus],
  );

  const sortedLeads = useMemo(() => {
    return [...leadsWithFingerprint].sort((a, b) => {
      const scoreA = a.triageScore ?? -Infinity;
      const scoreB = b.triageScore ?? -Infinity;
      return scoreB - scoreA;
    });
  }, [leadsWithFingerprint]);

  return (
    <div className="grid gap-6">
      <LeadTriageFilters
        strings={strings}
        draftFilters={draftFilters}
        promotionLimit={promotionLimit}
        message={message}
        loading={loading}
        runningStageP={runningStageP}
        eligibleCount={eligibleLeadIds.length}
        promotionValid={Boolean(promotionValue)}
        onDraftChange={setDraftFilters}
        onPromotionLimitChange={setPromotionLimit}
        onApply={applyFilters}
        onReset={resetFilters}
        onRunStageP={runStageP}
        onPromoteTop={promoteTop}
      />
      <LeadTriageTable
        strings={strings}
        leads={sortedLeads}
        loading={loading}
        selectedSet={selectedSet}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelected={toggleSelected}
        duplicateLookup={duplicateLookup}
      />
      <LeadCooldownCard
        strings={strings}
        selectedCount={selectedIds.length}
        onApply={applyCooldowns}
      />
      <DuplicateReviewCard
        groups={duplicateGroups}
        strings={strings}
        onHoldGroup={handleHoldGroup}
      />
    </div>
  );
}
