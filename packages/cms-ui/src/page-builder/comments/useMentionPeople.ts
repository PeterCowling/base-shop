import { useEffect, useState } from "react";

export function useMentionPeople() {
  const [mentionPeople, setMentionPeople] = useState<string[]>([]);

  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await fetch(`/cms/api/rbac/users`);
        const data = await res.json();
        const arr: string[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.users)
            ? data.users
            : [];
        setMentionPeople(arr.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()));
      } catch {
        // ignore
      }
    };
    void doFetch();
  }, []);

  return mentionPeople;
}

