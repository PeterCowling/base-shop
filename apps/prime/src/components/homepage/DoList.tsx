/**
 * DoList.tsx
 *
 * Displays a list of tasks, separated by completion status.
 * Fetches display text using react-i18next based on task ID.
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import TaskCard from './cards/TaskCard';

/** DoListTask - data for a single task */
export interface DoListTask {
  id: string;
  image: string;
  to: string;
  isStandard: boolean;
}

export interface DoListProps {
  tasks: DoListTask[];
  /** Function to check if a task is completed */
  isTaskCompleted: (taskId: string) => boolean;
  className?: string;
}

/**
 * DoList (UI Component)
 * Displays a list of tasks, separated by completion status.
 */
function DoList({
  tasks,
  isTaskCompleted,
  className = '',
}: DoListProps) {
  const { t } = useTranslation('Homepage');

  if (!tasks || tasks.length === 0) {
    return null;
  }

  // Split tasks by completion status
  const incompleteTasks = tasks.filter((task) => !isTaskCompleted(task.id));
  const completedTasksList = tasks.filter((task) => isTaskCompleted(task.id));

  // Further categorize incomplete tasks
  const incompleteStandardTasks = incompleteTasks.filter(
    (task) => task.isStandard,
  );
  const incompleteDiscretionaryTasks = incompleteTasks.filter(
    (task) => !task.isStandard,
  );

  // Order tasks: standard incomplete first, then discretionary incomplete, then completed
  const orderedTasks = [
    ...incompleteStandardTasks,
    ...incompleteDiscretionaryTasks,
    ...completedTasksList,
  ];

  const isAnyTaskCompleted = completedTasksList.length > 0;

  // Get subheader text from translations
  const subheaderText = isAnyTaskCompleted
    ? t('doList.continueToExplore')
    : t('doList.startYourEpicStay');

  return (
    <div className={`text-justify max-w-[400px] mx-auto ${className}`}>
      {/* Subheader */}
      <p className="text-2xl font-bold text-gray-800 text-center mt-6 mb-4">
        {subheaderText}
      </p>

      {/* Render tasks as a list */}
      <ul className="list-none flex flex-col gap-4 items-stretch px-4 mb-8">
        {orderedTasks.map((task) => {
          const completed = isTaskCompleted(task.id);
          // Construct translation keys dynamically using the task id
          const titleKey = `tasks.${task.id}.title`;
          const completedTitleKey = `tasks.${task.id}.completedTitle`;
          const noteKey = `tasks.${task.id}.note`;
          const altKey = `tasks.${task.id}.alt`;

          // Fetch translations using the keys
          const title = t(titleKey, { defaultValue: task.id });
          const completedTitle = t(completedTitleKey, { defaultValue: title });
          const note = t(noteKey, { defaultValue: '' });
          const alt = t(altKey, { defaultValue: title });

          return (
            <li key={task.id}>
              <TaskCard
                title={title}
                completedTitle={completedTitle}
                note={note || undefined}
                image={task.image}
                alt={alt}
                link={completed ? undefined : task.to}
                completed={completed}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default memo(DoList);
