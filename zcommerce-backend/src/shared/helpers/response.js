/** Contract success envelope: { success: true, data, meta? } */
export function ok(res, data = null, meta) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(200).json(body);
}

export function created(res, data = null) {
  return res.status(201).json({ success: true, data });
}

export function sendList(res, { data, meta }) {
  return ok(res, data, meta);
}

export function errorBody(code, message, details) {
  const error = { code, message };
  if (details && details.length) error.details = details;
  return { success: false, error };
}
