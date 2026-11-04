import { cookie, randomToken } from '../../../../src/lib/session.js';

export function onRequestGet({ request, env }) {
  const state = randomToken();
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', new URL('/api/auth/github/callback', request.url).href);
  url.searchParams.set('state', state);
  return new Response(null, {
    status: 302,
    headers: { Location: url.href, 'Set-Cookie': cookie('oauth_state', state, 600) },
  });
}
