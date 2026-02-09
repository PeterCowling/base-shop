// Design-system specific Jest setup
// Configure jest-axe matcher
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);
