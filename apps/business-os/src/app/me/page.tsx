import { MyWorkView } from "@/components/my-work/MyWorkView";
import { getCurrentUserServer } from "@/lib/current-user";
import { getRepoRoot } from "@/lib/get-repo-root";
import { createRepoReader } from "@/lib/repo-reader";

/**
 * /me route - "My Work" view
 * Shows cards assigned to current user
 * MVP-D3: Filtered view for non-admin users
 */
export default async function MyWorkPage() {
  const repoRoot = getRepoRoot();
  const reader = createRepoReader(repoRoot);
  const currentUser = await getCurrentUserServer();

  // Fetch all cards (excluding archived)
  const allCards = await reader.queryCards({
    includeArchived: false,
  });

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

  // Fetch businesses for card metadata
  const businesses = await reader.getBusinesses();

  return (
    <MyWorkView
      assignedToMe={assignedToMe}
      waitingAcceptance={waitingAcceptance}
      dueSoon={dueSoon}
      businesses={businesses}
      currentUser={currentUser}
    />
  );
}
