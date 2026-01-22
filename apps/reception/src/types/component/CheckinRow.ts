/* /src/types/component/CheckinRow.ts */
import { type z } from "zod";

import { checkInRowSchema } from "../../schemas/checkInRowSchema";

export type CheckInRow = z.infer<typeof checkInRowSchema>;
export { checkInRowSchema };
