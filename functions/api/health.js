export function onRequestGet() {
  return Response.json({ ok: true, time: new Date().toISOString() });
}
