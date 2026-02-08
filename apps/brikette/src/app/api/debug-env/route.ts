// Temporary debug endpoint to check environment variables
export const dynamic: "force-static" | undefined = process.env.OUTPUT_EXPORT
  ? "force-static"
  : undefined;

export async function GET() {
  return Response.json({
    NODE_ENV: process.env.NODE_ENV,
  });
}
