/* src/types/IconModalProps.ts */
import { type User } from "../domains/userDomain";

/**
 * Props for components that display an icon-triggered modal.
 */
export interface IconModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  // Make 'user' required so we never pass 'undefined'.
  user: User;
  /**
   * When false, the icon actions are non-interactive and simply render.
   * Defaults to true so existing modals continue to work as before.
   */
  interactive?: boolean;
}
