import { commit } from "../history";
export function set(state, action) {
  return commit(state, action.components);
}
export default set;
