export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ service: "itam-web", status: "ok", time: new Date().toISOString() });
}
