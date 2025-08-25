import { addComponent } from "./helpers";
import { commit } from "../history";
export function add(state, action) {
  return commit(
    state,
    addComponent(state.present, action.parentId, action.index, action.component),
  );
}
export default add;
