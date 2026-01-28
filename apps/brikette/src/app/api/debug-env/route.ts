// Temporary debug endpoint to check environment variables
export async function GET() {
  return Response.json({
    NEXT_PUBLIC_PREVIEW_TOKEN: process.env.NEXT_PUBLIC_PREVIEW_TOKEN,
    NEXT_PUBLIC_ENABLE_GUIDE_AUTHORING: process.env.NEXT_PUBLIC_ENABLE_GUIDE_AUTHORING,
    NODE_ENV: process.env.NODE_ENV,
  });
}
