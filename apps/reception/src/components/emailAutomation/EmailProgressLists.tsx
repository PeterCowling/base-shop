import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";

import { showToast } from "../../utils/toastUtils";
import ArrivalDateChip from "./ArrivalDateChip";
import BookingRefChip from "./BookingRefChip";
import "./EmailProgress.css";
import TimeElapsedChip from "./TimeElapsedChip";

export interface EmailProgressListItem {
  occupantId: string;
  bookingRef: string;
  occupantName: string;
  occupantEmail: string;
  hoursElapsed: number | null;
  currentCode: number;
  arrivalDate?: string;
}

export interface EmailProgressListsProps {
  emailData: EmailProgressListItem[];
  logNextActivity: (args: { bookingRef: string }) => Promise<void> | void;
  logConfirmActivity: (args: { bookingRef: string }) => Promise<void> | void;
}

/**
 * This component removes the occupant row immediately on confirm,
 * but applies a "move" transition so that other rows slide up smoothly.
 */
export default function EmailProgressLists({
  emailData,
  logNextActivity,
  logConfirmActivity,
}: EmailProgressListsProps) {
  // Store a local array of items so we can remove them instantly on confirm.
  const [localItems, setLocalItems] = useState<EmailProgressListItem[]>([]);

  // On mount + whenever emailData changes, sync localItems to match it
  useEffect(() => {
    setLocalItems(emailData);
  }, [emailData]);

  /**
   * Handle occupant's next activity (1->2->3->4).
   * Using promise-based error handling instead of try/catch.
   */
  const handleNextButton = useCallback(
    (item: EmailProgressListItem) => {
      Promise.resolve(logNextActivity({ bookingRef: item.bookingRef }))
        .then(() => {
          showToast(
            `Logged next activity for Booking Ref: ${item.bookingRef}`,
            "success"
          );
          // Immediately move occupant to the next code group
          setLocalItems((prev) =>
            prev.map((x) =>
              x.occupantId === item.occupantId
                ? { ...x, currentCode: x.currentCode + 1 }
                : x
            )
          );
        })
        .catch((err) => {
          console.error("[EmailProgressLists] Next activity error:", err);
          showToast(
            `Error logging next activity for ${item.bookingRef}`,
            "error"
          );
        });
    },
    [logNextActivity]
  );

  /**
   * Handle occupant's confirm => remove occupant row immediately from localItems.
   * Using promise-based error handling instead of try/catch.
   */
  const handleConfirmButton = useCallback(
    (item: EmailProgressListItem) => {
      Promise.resolve(logConfirmActivity({ bookingRef: item.bookingRef }))
        .then(() => {
          showToast(
            `Guest(s) confirmed T&Cs for Booking Ref: ${item.bookingRef}`,
            "success"
          );
          // Immediately remove occupant from local state -> row is unmounted instantly
          setLocalItems((prev) =>
            prev.filter((x) => x.occupantId !== item.occupantId)
          );
        })
        .catch((err) => {
          console.error("[EmailProgressLists] Confirm error:", err);
          showToast(
            `Error logging confirm activity for ${item.bookingRef}`,
            "error"
          );
        });
    },
    [logConfirmActivity]
  );

  // Group localItems by currentCode so we can render separate sections
  const code1List = useMemo(
    () => localItems.filter((d) => d.currentCode === 1),
    [localItems]
  );
  const code2List = useMemo(
    () => localItems.filter((d) => d.currentCode === 2),
    [localItems]
  );
  const code3List = useMemo(
    () => localItems.filter((d) => d.currentCode === 3),
    [localItems]
  );
  const code4List = useMemo(
    () => localItems.filter((d) => d.currentCode === 4),
    [localItems]
  );

  return (
    <div className="flex flex-col font-body w-full">
      {code1List.length > 0 && (
        <ActivityCodeSection
          code={1}
          label="Booking Created"
          list={code1List}
          onNext={handleNextButton}
          onConfirm={handleConfirmButton}
        />
      )}
      {code2List.length > 0 && (
        <ActivityCodeSection
          code={2}
          label="First Reminder Sent"
          list={code2List}
          onNext={handleNextButton}
          onConfirm={handleConfirmButton}
        />
      )}
      {code3List.length > 0 && (
        <ActivityCodeSection
          code={3}
          label="Second Reminder Sent"
          list={code3List}
          onNext={handleNextButton}
          onConfirm={handleConfirmButton}
        />
      )}
      {code4List.length > 0 && (
        <ActivityCodeSection
          code={4}
          label="Cancelled"
          list={code4List}
          onNext={handleNextButton}
          onConfirm={handleConfirmButton}
        />
      )}
    </div>
  );
}

/**
 * ActivityCodeSection: Wraps a TransitionGroup so that any removed items
 * instantly disappear, but triggers a "move" animation for rows below.
 */
function ActivityCodeSection({
  code,
  label,
  list,
  onNext,
  onConfirm,
}: {
  code: number;
  label: string;
  list: EmailProgressListItem[];
  onNext: (item: EmailProgressListItem) => void;
  onConfirm: (item: EmailProgressListItem) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemNodeRefs = useRef(
    new Map<string, React.RefObject<HTMLLIElement | null>>()
  );

  useEffect(() => {
    const currentIds = new Set(list.map((item) => item.occupantId));

    itemNodeRefs.current.forEach((_, key) => {
      if (!currentIds.has(key)) {
        itemNodeRefs.current.delete(key);
      }
    });
  }, [list]);

  return (
    <TransitionGroup component={React.Fragment}>
      <CSSTransition
        key={label}
        timeout={300}
        classNames="instant-container"
        nodeRef={containerRef}
      >
        <div
          ref={containerRef}
          className="mb-8 w-full bg-white border rounded dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
        >
          <div className="p-4 bg-primary-main text-white font-heading text-lg font-bold uppercase border-b border-primary-main">
            {label} ({list.length})
          </div>
          <TransitionGroup component="ul" className="p-4">
            {list.map((item) => {
              let nodeRef = itemNodeRefs.current.get(item.occupantId);

              if (!nodeRef) {
                nodeRef = React.createRef<HTMLLIElement>();
                itemNodeRefs.current.set(item.occupantId, nodeRef);
              }

              return (
                <CSSTransition
                  key={item.occupantId}
                  timeout={300}
                  classNames="instant"
                  unmountOnExit
                  nodeRef={nodeRef}
                >
                  <li
                    ref={nodeRef}
                    className="instant-move my-4 p-4 rounded bg-white shadow-sm flex justify-between items-center dark:bg-darkSurface dark:text-darkAccentGreen"
                  >
                    <div className="flex items-center gap-4">
                      {item.hoursElapsed != null && (
                        <TimeElapsedChip
                          hoursElapsed={item.hoursElapsed}
                          currentCode={item.currentCode}
                      />
                    )}

                    <BookingRefChip bookingRef={item.bookingRef} />

                    {/*
                      Only show the ArrivalDateChip if arrivalDate is present.
                      If you want to display a placeholder anyway, remove this condition.
                    */}
                    {item.arrivalDate && (
                      <ArrivalDateChip arrivalDate={item.arrivalDate} />
                    )}

                    <span className="text-gray-700 dark:text-darkAccentGreen">{item.occupantName}</span>
                  </div>

                  {item.currentCode < 4 && (
                    <div className="flex items-center gap-2">
                      <button
                        className="px-4 py-2 bg-secondary-main text-white text-sm rounded hover:bg-secondary-dark transition-colors"
                        onClick={() => onNext(item)}
                      >
                        {code === 1
                          ? "Send First Reminder"
                          : code === 2
                          ? "Send Second Reminder"
                          : "Cancel Booking"}
                      </button>
                      <button
                        className="px-4 py-2 bg-success-main text-white text-sm rounded hover:bg-success-dark transition-colors"
                        onClick={() => onConfirm(item)}
                      >
                        Confirm
                      </button>
                    </div>
                  )}
                </li>
              </CSSTransition>
              );
            })}
          </TransitionGroup>
        </div>
      </CSSTransition>
    </TransitionGroup>
  );
}
