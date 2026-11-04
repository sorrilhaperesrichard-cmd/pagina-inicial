import { ensureSchema } from '../../../../src/lib/db.js';
import { cookie, createSession, getCookie } from '../../../../src/lib/session.js';

function fail(message, status = 400) {
  return new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = getCookie(request, 'oauth_state');
  if (!code || !state || state !== savedState) return fail('Login inválido ou expirado. Tente de novo.');

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: new URL('/api/auth/github/callback', request.url).href,
    }),
  });
  const { access_token } = await tokenRes.json();
  if (!access_token) return fail('O GitHub recusou o login.', 502);

  const ghRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${access_token}`, 'User-Agent': 'pagina-inicial', Accept: 'application/vnd.github+json' },
  });
  if (!ghRes.ok) return fail('Não consegui ler o perfil do GitHub.', 502);
  const gh = await ghRes.json();

  const allowed = (env.ALLOWED_GITHUB_LOGINS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(String(gh.login).toLowerCase())) return fail('Cadastro ainda fechado.', 403);

  const db = env.DB;
  await ensureSchema(db);
  const identity = await db.prepare('SELECT user_id FROM identities WHERE provider = ? AND provider_user_id = ?')
    .bind('github', String(gh.id)).first();
  let userId = identity?.user_id;
  if (!userId) {
    userId = crypto.randomUUID();
    await db.batch([
      db.prepare('INSERT INTO users (id, name, avatar_url, created_at) VALUES (?, ?, ?, ?)')
        .bind(userId, gh.name || gh.login, gh.avatar_url, Date.now()),
      db.prepare('INSERT INTO identities (provider, provider_user_id, user_id) VALUES (?, ?, ?)')
        .bind('github', String(gh.id), userId),
    ]);
  }

  const headers = new Headers({ Location: '/' });
  headers.append('Set-Cookie', await createSession(db, userId));
  headers.append('Set-Cookie', cookie('oauth_state', '', 0));
  return new Response(null, { status: 302, headers });
}
