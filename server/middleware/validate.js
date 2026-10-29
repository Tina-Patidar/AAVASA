/**
 * validate(schema, source) parses req[source] with a Zod schema.
 * On success the parsed (and stripped/coerced) data replaces the original.
 * On failure the ZodError flows to the central error handler (HTTP 400).
 */
export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    if (source === 'query') {
      // req.query is a getter in some Express versions, so store parsed values separately
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }
    next();
  };
