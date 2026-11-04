import { getUser } from '../../src/lib/session.js';

export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env.DB);
  if (!user) return Response.json({ error: 'not_logged_in' }, { status: 401 });
  return Response.json(user);
}
