import { NextFunction, Request, Response } from "express";
import { Logger } from "../../util/logger";
import { randomUUID } from 'crypto';
import chalk from "chalk";

export const httpLogger = (logger: Logger = Logger.createScopedLogger('server')) => (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.locals.traceId = randomUUID();
    res.set('ApiTraceId', res.locals.traceId);
    res.set('Access-Control-Expose-Headers', 'ApiTraceId');
    res.set('Access-Control-Allow-Headers', 'ApiTraceId');

    res.on('finish', () => {
        logger.debug(`${chalk.yellow(res.locals.traceId)} | ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
    });

    next();
}