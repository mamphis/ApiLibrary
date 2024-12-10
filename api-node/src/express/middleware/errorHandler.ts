import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";
import { NextFunction, Request, Response } from "express";
import { handlePrismaClientKnownRequestError } from "../../db/error";
import { ZodError } from "zod";
import createHttpError from "http-errors";
import chalk from "chalk";
import { Log, TraceLogger } from "../../util/logger";
import { error } from "console";

function isPrismaClientKnownRequestError(err: any): err is PrismaClientKnownRequestError {
    return err instanceof Error && 'code' in err && err.name === 'PrismaClientKnownRequestError';
}

export const errorHandler = () => (err: unknown, req: Request, res: Response<any, { logger: TraceLogger }>, next: NextFunction) => {
    let statusCode = 500;
    let context: {
        type: string;
        name: string;
        error: string;
        traceId?: string;
        data?: any;
    } = {
        type: 'Error',
        name: 'Error',
        error: 'Internal server error',
    };

    if (err instanceof Error) {
        context = {
            type: 'Error',
            name: err.name,
            error: err.message,
        };

        if (process.env.NODE_ENV !== 'production') {
            context.data = err.stack;
        }

        if ('code' in err && typeof err['code'] === 'number') {
            statusCode = err.code;
        }

        if ('status' in err && typeof err['status'] === 'number') {
            statusCode = err.status
        }

        if ('statusCode' in err && typeof err['statusCode'] === 'number') {
            statusCode = err.statusCode
        }
    }

    if (err instanceof PrismaClientValidationError) {
        statusCode = 400;
        context = {
            type: 'ValidationError',
            error: err.message,
            name: err.name,
        };

    }

    if (isPrismaClientKnownRequestError(err)) {
        const prismaError = handlePrismaClientKnownRequestError(err);

        statusCode = prismaError.status;
        context = {
            type: prismaError.type,
            name: prismaError.name,
            error: prismaError.message,
            data: [
                {
                    message: prismaError.message,
                    path: prismaError.path,
                }
            ]
        };
    }

    if (err instanceof ZodError) {
        statusCode = 400;
        context = {
            type: 'ValidationError',
            name: err.name,
            error: err.name,
            data: err.errors.map(e => {
                return {
                    message: e.message,
                    path: e.path.join('.'),
                };
            })
        };
    }

    if (err instanceof createHttpError.HttpError) {
        statusCode = err.statusCode;
        context = {
            type: 'HttpError',
            name: err.name,
            error: err.message,
        };
    }

    context.traceId = req.logger.traceId;
    if (err instanceof Error) {
        req.logger.error(err, context);
    } else {
        req.logger.error(context.error, context);
    }

    res.status(statusCode).json(context);
};