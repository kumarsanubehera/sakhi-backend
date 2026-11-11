import { AppError } from '../utils/helpers.js';
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    next(new AppError('Validation failed', 422, error.details.map((detail) => detail.message)));
    return;
  }
  req[source] = value;
  next();
};