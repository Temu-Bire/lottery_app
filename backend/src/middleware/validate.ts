import { type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import { type ZodTypeAny } from 'zod';

export const validateBody = (schema: ZodTypeAny): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodTypeAny): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.query);
      req.query = parsed as Record<string, string>;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateParams = (schema: ZodTypeAny): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.params);
      req.params = parsed as Record<string, string>;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateHeaders = (schema: ZodTypeAny): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.headers);
      req.headers = parsed as typeof req.headers;
      next();
    } catch (error) {
      next(error);
    }
  };
};
