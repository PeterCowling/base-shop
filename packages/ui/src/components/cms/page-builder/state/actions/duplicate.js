import { duplicateComponent } from "./helpers";
import { commit } from "../history";
export function duplicate(state, action) {
  return commit(state, duplicateComponent(state.present, action.id));
}
export default duplicate;
