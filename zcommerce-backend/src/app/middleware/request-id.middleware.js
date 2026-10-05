import crypto from 'node:crypto';

/** Attach a request id (reuse a sane incoming X-Request-Id) and echo it on the response. */
export function requestId(req, res, next) {
  const incoming = req.get('x-request-id');
  const id = incoming && /^[\w.-]{8,128}$/.test(incoming) ? incoming : crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}

export default requestId;
