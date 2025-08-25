import { removeComponent } from "./helpers";
import { commit } from "../history";
export function remove(state, action) {
  return commit(state, removeComponent(state.present, action.id));
}
export default remove;
