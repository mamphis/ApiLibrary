import { NextFunction, Request, Response } from "express";
import { Log, TraceLogger } from "../../logging/logger";

export const httpLogger = (logger: Log) => (req: Request, res: Response, next: NextFunction) => {
    req.logger = logger.startTrace('http-logger');

    res.set('ApiTraceId', req.logger.traceId);
    res.set('Access-Control-Expose-Headers', 'ApiTraceId');
    res.set('Access-Control-Allow-Headers', 'ApiTraceId');

    res.once('finish', () => {
        req.logger.http(req, res);
    });

    next();
}