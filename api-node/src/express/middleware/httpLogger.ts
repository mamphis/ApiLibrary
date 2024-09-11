import { NextFunction, Request, Response } from "express";
import { Logger } from "../../util/logger";

export const httpLogger = (logger: Logger = Logger.createScopedLogger('server')) => (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        logger.debug(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
}