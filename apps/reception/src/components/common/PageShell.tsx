/**
 * PageShell — backward-compatibility re-export.
 *
 * The canonical component is now OperationalTableScreen.
 * All existing consumers continue to work via this re-export.
 * New code should import OperationalTableScreen directly.
 *
 * Migration: TASK-04 (check-in) migrates to OperationalTableScreen + primitives.
 * This shim can be removed once all consumers are migrated.
 */
export {
  OperationalTableScreen as PageShell,
  type OperationalTableScreenProps as PageShellProps,
} from "./OperationalTableScreen";
