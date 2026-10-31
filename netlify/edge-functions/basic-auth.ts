// Basic-auth poort voor de hele site (gratis Netlify-plan).
// Credentials staan als env-vars in Netlify (NIET in de code):
//   Environment variables → username / password
//   scope: Functions · contexts: Production + Deploy Previews

type EnvSource = { get?: (key: string) => string | undefined };

function envGet(key: string): string | undefined {
  const netlify = (globalThis as { Netlify?: EnvSource }).Netlify;
  if (netlify?.env?.get) {
    const v = netlify.env.get(key);
    if (v) return v;
  }
  const deno = (globalThis as { Deno?: EnvSource }).Deno;
  if (deno?.env?.get) return deno.env.get(key);
  return undefined;
}

function unauthorized(): Response {
  return new Response('Authenticatie vereist', {
    status: 401,
    headers: {
      'WWW-Authenticate':
        'Basic realm="Dessert Verkoop - enkel bestuur", charset="UTF-8"',
    },
  });
}

export default async function (
  request: Request,
  context: { next(): Response | Promise<Response> }
): Promise<Response> {
  const username = envGet('username');
  const password = envGet('password');

  // Niet geconfigureerd? Dan géén toegang (fail closed).
  if (!username || !password) return unauthorized();

  const header = request.headers.get('Authorization');
  if (header && header.startsWith('Basic ')) {
    let decoded = '';
    try {
      decoded = atob(header.slice(6));
    } catch {
      return unauthorized();
    }
    const sep = decoded.indexOf(':');
    if (sep !== -1) {
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      if (user === username && pass === password) {
        return context.next();
      }
    }
  }
  return unauthorized();
}

export const config = { path: '/*' };
