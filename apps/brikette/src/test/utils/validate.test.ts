import "@testing-library/jest-dom";
import { z } from "zod";

import { validateOrThrow } from "@/utils/validate";

const schema = z.object({
  id: z.number(),
  name: z.string(),
});

describe("validateOrThrow", () => {
  it("returns parsed data when valid", () => {
    const data = { id: 1, name: "Foo" };
    const result = validateOrThrow(schema, data);
    expect(result).toEqual(data);
  });

  it("throws Response with issues on invalid data", () => {
    try {
      validateOrThrow(schema, { id: "x" });
    } catch (err) {
      expect(err).toBeInstanceOf(Response);
      expect((err as Response).status).toBe(400);
    }
  });

  it("uses custom status code", () => {
    try {
      validateOrThrow(schema, { id: "x" }, 422);
    } catch (err) {
      expect((err as Response).status).toBe(422);
    }
  });

  it("includes detailed issues from Zod in response body", async () => {
    try {
      validateOrThrow(schema, { id: "x" });
    } catch (err) {
      const response = err as Response;
      const body = await response.json();

      expect(body).toHaveProperty("message", "Validation failed");
      expect(Array.isArray(body.issues)).toBe(true);
      expect(body.issues[0]).toMatchObject({
        path: ["id"],
        code: "invalid_type",
      });
    }
  });

  it("preserves inferred types for typed usage", () => {
    const input = { id: 7, name: "Maria" };
    const result = validateOrThrow(schema, input);

    const id: number = result.id;
    const name: string = result.name;

    expect(id).toBe(7);
    expect(name).toBe("Maria");
  });
});