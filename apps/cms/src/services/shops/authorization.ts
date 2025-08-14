import { ensureAuthorized } from "../../actions/common/auth";

export async function authorize() {
  await ensureAuthorized();
}
