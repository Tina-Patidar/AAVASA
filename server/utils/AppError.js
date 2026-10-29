/** An error we throw on purpose; the error handler turns it into a clean JSON response. */
export class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

export const badRequest = (msg, details) => new AppError(msg, 400, details);
export const unauthorized = (msg = 'Please sign in to continue.') => new AppError(msg, 401);
export const forbidden = (msg = 'You do not have permission to do that.') => new AppError(msg, 403);
export const notFound = (msg = 'Not found.') => new AppError(msg, 404);
export const conflict = (msg, details) => new AppError(msg, 409, details);
