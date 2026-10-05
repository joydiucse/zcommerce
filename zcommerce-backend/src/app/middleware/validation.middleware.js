import { ZodError } from 'zod';
import { ValidationError } from '../../shared/exceptions/index.js';

export const zodDetails = (err) =>
  err.issues.map((i) => ({ path: i.path.length ? i.path.join('.') : '_', message: i.message }));

/**
 * validate({ body, query, params }) — parses each part with its zod schema, replaces it with the
 * parsed (coerced/defaulted) value, and responds 422 VALIDATION_ERROR with `details` on failure.
 */
export function validate(schemas = {}) {
  return (req, _res, next) => {
    const details = [];
    req.validated = req.validated || {};
    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        details.push(...zodDetails(result.error).map((d) => ({ ...d, path: part === 'body' ? d.path : `${part}.${d.path}` })));
        continue;
      }
      req.validated[part] = result.data;
      if (part === 'body') req.body = result.data;
      else Object.defineProperty(req, part, { value: result.data, writable: true, configurable: true, enumerable: true });
    }
    if (details.length) return next(new ValidationError('Validation failed', details));
    return next();
  };
}

export { ZodError };
export default validate;
