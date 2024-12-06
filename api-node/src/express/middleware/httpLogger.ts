import { NextFunction, Request, Response } from "express";
import { Logger } from "../../util/logger";
import { randomUUID } from 'crypto';
import chalk from "chalk";

export const httpLogger = (logger: Logger = Logger.createScopedLogger('server')) => (req: Request, res: Response<any, { traceId: string }>, next: NextFunction) => {
    const start = Date.now();
    res.locals.traceId = randomUUID();
    res.set('ApiTraceId', res.locals.traceId);
    res.set('Access-Control-Expose-Headers', 'ApiTraceId');
    res.set('Access-Control-Allow-Headers', 'ApiTraceId');

    res.once('finish', () => {
        logger.debug(`${chalk.yellow(res.locals.traceId)} | ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`, {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode.toString(),
            duration: Date.now() - start,
            ip: req.ip,
            traceId: res.locals.traceId,
        });
    });

    next();
}