import { moveComponent } from "./helpers";
import { commit } from "../history";
export function move(state, action) {
  return commit(state, moveComponent(state.present, action.from, action.to));
}
export default move;
