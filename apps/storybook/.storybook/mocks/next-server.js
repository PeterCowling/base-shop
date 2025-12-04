// Minimal ESM stub for next/server in Storybook Vite builds
export class NextResponse {
  static json(body, init) {
    return { body, init, type: "json" };
  }

  static redirect(url, init) {
    return { url, init, type: "redirect" };
  }
}

export class NextRequest {}

export const draftMode = () => ({ isEnabled: false });

const nextServerMock = {
  NextResponse,
  NextRequest,
  draftMode,
};

export default nextServerMock;
