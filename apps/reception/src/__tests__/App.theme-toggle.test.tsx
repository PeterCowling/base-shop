import "@testing-library/jest-dom";

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

import App from "../App";

const useAuthMock = jest.fn();
const useRouterMock = jest.fn();
const usePathnameMock = jest.fn();
const useOfflineSyncMock = jest.fn();
const useFirebaseDatabaseMock = jest.fn();

jest.mock("../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

jest.mock("../services/useFirebase", () => ({
  useFirebaseDatabase: () => useFirebaseDatabaseMock(),
}));

jest.mock("../lib/offline/useOfflineSync", () => ({
  useOfflineSync: (...args: unknown[]) => useOfflineSyncMock(...args),
}));

jest.mock("../hooks/client/useInactivityLogoutClient", () => jest.fn());

jest.mock("next/navigation", () => ({
  useRouter: () => useRouterMock(),
  usePathname: () => usePathnameMock(),
}));

jest.mock("@acme/ui/operations", () => ({
  NotificationContainer: () => <div data-testid="notifications" />,
  NotificationProviderWithGlobal: function NotificationProviderWithGlobalMock({ children }: { children: ReactNode }) {
    return <>{children}</>;
  },
}));

jest.mock("../components/common/ThemeModeDock", () => function ThemeModeDockMock() {
  return <div data-testid="theme-mode-dock" />;
});

jest.mock("../components/Login", () => function LoginMock() {
  return <div data-testid="login-screen" />;
});

jest.mock("../components/AuthenticatedApp", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="authenticated-app">{children}</div>
  ),
}));

describe("App theme toggle mount", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: null,
      status: "idle",
      logout: jest.fn(),
    });
    useRouterMock.mockReturnValue({ push: jest.fn() });
    usePathnameMock.mockReturnValue("/");
    useFirebaseDatabaseMock.mockReturnValue({});
    useOfflineSyncMock.mockReturnValue({ pendingCount: 0 });
  });

  it("renders the theme dock on the unauthenticated app shell", () => {
    render(<App><div>route</div></App>);

    expect(screen.getByTestId("theme-mode-dock")).toBeInTheDocument();
    expect(screen.getByTestId("login-screen")).toBeInTheDocument();
  });
});
