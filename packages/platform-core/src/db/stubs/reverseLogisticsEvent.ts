import type { ReverseLogisticsEvent } from "@acme/types";

export function createReverseLogisticsEventDelegate() {
  const events: ReverseLogisticsEvent[] = [];
  return {
    async create({ data }: { data: ReverseLogisticsEvent }) {
      events.push({ ...data });
      return data;
    },
    async createMany({ data }: { data: ReverseLogisticsEvent[] }) {
      events.push(...data.map((e) => ({ ...e })));
      return { count: data.length };
    },
    async findMany({ where }: { where?: Partial<ReverseLogisticsEvent> } = {}) {
      return events.filter((e) =>
        Object.entries(where ?? {}).every(
          ([k, v]) => e[k as keyof ReverseLogisticsEvent] === v,
        ),
      );
    },
  };
}
