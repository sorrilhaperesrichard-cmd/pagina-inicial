import { deleteSession } from '../../../src/lib/session.js';

export async function onRequestPost({ request, env }) {
  const clear = await deleteSession(request, env.DB);
  return new Response(null, { status: 204, headers: { 'Set-Cookie': clear } });
}
