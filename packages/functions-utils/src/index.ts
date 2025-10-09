// LuckyFields Platform - functions-utils (skeleton)
// Public API: normalizeRuntime, json, error, methodNotAllowed

export type HeadersLike = Headers | Record<string, string | undefined>;

export interface NormalizedRuntimeInput {
  method: string;
  headers: Headers;
  bodyText: string | null;
}

export async function normalizeRuntime(input: Request | any): Promise<NormalizedRuntimeInput> {
  // Supports Web Request or Netlify HandlerEvent-like object
  if (typeof Request !== 'undefined' && input instanceof Request) {
    const req = input as Request;
    return {
      method: req.method,
      headers: req.headers,
      bodyText: await req.text(),
    };
  }
  // Fallback: assume { httpMethod, headers, body }
  const httpMethod = input?.httpMethod || input?.requestContext?.http?.method || input?.method || 'GET';
  const hdrs = new Headers(input?.headers || {});
  const bodyTxt = typeof input?.body === 'string' ? input.body : (input?.body ? JSON.stringify(input.body) : null);
  return { method: httpMethod, headers: hdrs, bodyText: bodyTxt };
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  const body = JSON.stringify(data);
  const headers = new Headers(init.headers || {});
  if (!headers.has('content-type')) headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(body, { ...init, headers });
}

export function error(message: string, status = 500, init: ResponseInit = {}): Response {
  return json({ error: message }, { ...init, status });
}

export function methodNotAllowed(allow: string[] = ['GET']): Response {
  return error(`Method not allowed. Allowed: ${allow.join(', ')}`, 405, { headers: { Allow: allow.join(', ') } });
}
