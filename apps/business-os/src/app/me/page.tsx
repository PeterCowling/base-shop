import { listCardsForBoard } from "@acme/platform-core/repositories/businessOs.server";

import { MyWorkView } from "@/components/my-work/MyWorkView";
import { BUSINESSES } from "@/lib/business-catalog";
import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { getDb } from "@/lib/d1.server";

/**
 * /me route - "My Work" view
 * Shows cards assigned to current user
 * MVP-D3: Filtered view for non-admin users
 */
export const runtime = "edge";

export default async function MyWorkPage() {
  const db = getDb();
  const currentUser = await getCurrentUserServer();

  // Fetch all cards (excluding archived)
  const allCards = await listCardsForBoard(db, {});

  // Filter: Assigned to me (not Done)
  const assignedToMe = allCards.filter(
    (card) => card.Owner === currentUser.name && card.Lane !== "Done"
  );

  // Filter: Waiting acceptance (Owner = me, Lane = Inbox)
  const waitingAcceptance = allCards.filter(
    (card) => card.Owner === currentUser.name && card.Lane === "Inbox"
  );

  // Filter: Due soon (next 7 days)
  const today = new Date();
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  const dueSoon = allCards.filter((card) => {
    if (!card["Due-Date"]) return false;
    if (card.Lane === "Done") return false;
    if (card.Owner !== currentUser.name) return false;

    const dueDate = new Date(card["Due-Date"]);
    return dueDate >= today && dueDate <= sevenDaysFromNow;
  });

  return (
    <MyWorkView
      assignedToMe={assignedToMe}
      waitingAcceptance={waitingAcceptance}
      dueSoon={dueSoon}
      businesses={BUSINESSES}
      currentUser={currentUser}
    />
  );
}
