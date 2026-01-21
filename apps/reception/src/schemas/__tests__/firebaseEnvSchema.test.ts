
import "@testing-library/jest-dom";
import { firebaseEnvSchema } from "../firebaseEnvSchema";

type Env = {
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_AUTH_DOMAIN: string;
  VITE_FIREBASE_PROJECT_ID: string;
  VITE_FIREBASE_STORAGE_BUCKET: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  VITE_FIREBASE_APP_ID: string;
  VITE_FIREBASE_DATABASE_URL: string;
  VITE_FIREBASE_MEASUREMENT_ID: string;
};

const validEnv: Env = {
  VITE_FIREBASE_API_KEY: "key",
  VITE_FIREBASE_AUTH_DOMAIN: "domain",
  VITE_FIREBASE_PROJECT_ID: "pid",
  VITE_FIREBASE_STORAGE_BUCKET: "bucket",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "sender",
  VITE_FIREBASE_APP_ID: "app",
  VITE_FIREBASE_DATABASE_URL: "db",
  VITE_FIREBASE_MEASUREMENT_ID: "meas",
};

describe("firebaseEnvSchema", () => {
  it("passes with a complete set of variables", () => {
    expect(() => firebaseEnvSchema.parse(validEnv)).not.toThrow();
  });

  it("throws when any variable is an empty string", () => {
    (Object.keys(validEnv) as Array<keyof Env>).forEach((key) => {
      const env = { ...validEnv, [key]: "" } as Partial<Env>;
      expect(() => firebaseEnvSchema.parse(env)).toThrow();
    });
  });

  it("throws when any variable is missing", () => {
    (Object.keys(validEnv) as Array<keyof Env>).forEach((key) => {
      const { [key]: _omit, ...rest } = validEnv;
      expect(() => firebaseEnvSchema.parse(rest as Partial<Env>)).toThrow();
    });
  });
});
