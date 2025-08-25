import { updateComponent } from "./helpers";
import { commit } from "../history";
export function update(state, action) {
  return commit(state, updateComponent(state.present, action.id, action.patch));
}
export default update;
