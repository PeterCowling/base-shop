/**
 * useTrackQuestTask
 *
 * A utility hook for tracking quest-related task completions.
 * Use this hook to mark tasks as complete for quest progression.
 *
 * Example usage:
 * ```tsx
 * function GuidebookPage() {
 *   useTrackQuestTask('guidebookVisited');
 *   return <div>...</div>;
 * }
 * ```
 *
 * This hook is idempotent - calling it multiple times for the same
 * task will only mark it complete once per component mount.
 */

import { useEffect, useRef } from 'react';
import { useCompletedTaskMutator } from './mutator/useCompletedTaskMutator';

/**
 * Valid quest task IDs that can be tracked.
 */
export type QuestTaskId =
  | 'activityJoined'
  | 'guidebookVisited'
  | 'localSpotVisited'
  | 'profileOnboardingComplete';

/**
 * Track a quest task completion on component mount.
 *
 * @param taskId - The task ID to mark as complete
 * @param enabled - Whether to track (default: true). Use for conditional tracking.
 */
export function useTrackQuestTask(
  taskId: QuestTaskId,
  enabled: boolean = true,
): void {
  const { completeTask } = useCompletedTaskMutator({});
  const hasTracked = useRef(false);

  useEffect(() => {
    if (enabled && !hasTracked.current) {
      hasTracked.current = true;
      void completeTask(taskId, true);
    }
  }, [taskId, enabled, completeTask]);
}

/**
 * Track a quest task completion manually (for event handlers).
 *
 * Returns a function that can be called to mark the task complete.
 * The function is idempotent per hook instance.
 *
 * @param taskId - The task ID to mark as complete
 * @returns Function to call when the task should be marked complete
 *
 * Example usage:
 * ```tsx
 * function GuideRecommendation({ link }) {
 *   const trackSpotVisited = useTrackQuestTaskManual('localSpotVisited');
 *
 *   return (
 *     <a href={link} onClick={trackSpotVisited}>
 *       Visit this spot
 *     </a>
 *   );
 * }
 * ```
 */
export function useTrackQuestTaskManual(taskId: QuestTaskId): () => void {
  const { completeTask } = useCompletedTaskMutator({});
  const hasTracked = useRef(false);

  return () => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      void completeTask(taskId, true);
    }
  };
}
