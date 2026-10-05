import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from '../../shared/exceptions/index.js';
import { errorBody } from '../../shared/helpers/response.js';
import { logger } from '../../shared/utils/logger.js';
import { zodDetails } from './validation.middleware.js';
import { isProd } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json(errorBody('NOT_FOUND', `Route ${req.method} ${req.path} not found`));
}

function pgConstraintPath(err) {
  // e.g. Key (tenant_id, slug)=(..., foo) already exists.
  const m = /Key \(([^)]+)\)/.exec(err.detail || '');
  if (!m) return '_';
  const cols = m[1].split(',').map((c) => c.trim()).filter((c) => c !== 'tenant_id');
  return cols.join('.') || '_';
}

/** Map any error to the contract error envelope. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong';
  let details;

  if (err instanceof AppError) {
    ({ status, code, message, details } = err);
  } else if (err instanceof ZodError) {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = zodDetails(err);
  } else if (err instanceof multer.MulterError) {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
    details = [{ path: err.field || 'file', message }];
  } else if (err?.code === '23505') {
    const path = pgConstraintPath(err);
    status = 409;
    code = 'CONFLICT';
    message = `A record with this ${path.replace(/\./g, ', ')} already exists`;
    details = [{ path, message }];
  } else if (err?.code === '23503') {
    if (/still referenced/i.test(err.detail || '')) {
      status = 409;
      code = 'CONFLICT';
      message = 'This record is in use and cannot be deleted';
    } else {
      const path = pgConstraintPath(err);
      status = 422;
      code = 'VALIDATION_ERROR';
      message = 'Referenced record does not exist';
      details = [{ path, message }];
    }
  } else if (err?.code === '22P02' || err?.code === '22007' || err?.code === '22008') {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Invalid input value';
  } else if (err?.type === 'entity.parse.failed') {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Malformed JSON body';
  } else if (err?.type === 'entity.too.large') {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Request body too large';
  }

  if (status >= 500) {
    (req.log || logger).error({ err, reqId: req.id }, 'Unhandled error');
    if (!isProd && err?.message) message = err.message;
  }

  res.status(status).json(errorBody(code, message, details));
}
