import EventEmitter from "events";
import { Request, Response } from "express";
import { customAlphabet } from 'nanoid';
import { LoggerTransport } from "./transports/loggerTransport";

const hexNano = customAlphabet('0123456789abcdef', 20);

export enum LogLevel {
    error = 0,
    warn = 1,
    info = 2,
    http = 3,
    verbose = 4,
    debug = 5,
    silly = 6
}

export type LogEvent = {
    timestamp: Date;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
};

class Logger {
    constructor(protected log: Log) {
    }

    protected getDefaultContext(): Record<string, any> {
        return {};
    }

    async error(error: Error, context?: Record<string, any>): Promise<void>;
    async error(message: string, context?: Record<string, any>): Promise<void>;
    async error(message: string | Error, context?: Record<string, any>): Promise<void> {
        if (message instanceof Error) {
            this.log.log(LogLevel.error, message.message, {
                ...this.getDefaultContext(),
                ...message,
                exception: `${message.stack}`,
                ...context
            });
        } else {
            this.log.log(LogLevel.error, message, { ...this.getDefaultContext(), ...context });
        }
    }

    async warn(message: string, context?: Record<string, any>): Promise<void> {
        this.log.log(LogLevel.warn, message, { ...this.getDefaultContext(), ...context });
    }

    async info(message: string, context?: Record<string, any>): Promise<void> {
        this.log.log(LogLevel.info, message, { ...this.getDefaultContext(), ...context });
    }

    async http(req: Request, res: Response, context?: Record<string, any>): Promise<void> {
        this.log.log(LogLevel.http, `{method} {url} -> {status}`, {
            ...this.getDefaultContext(),
            ...context,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode.toString(),
            duration: Date.now() - req.logger.start.getTime(),
            ip: req.ip,
            sessionId: req.headers.sessionid?.toString(),
            userAgent: req.headers['user-agent']?.toString(),
            locals: res.locals,
        });
    }

    async verbose(message: string, context?: Record<string, any>): Promise<void> {
        this.log.log(LogLevel.verbose, message, { ...this.getDefaultContext(), ...context });
    }

    async debug(message: string, context?: Record<string, any>): Promise<void> {
        this.log.log(LogLevel.debug, message, { ...this.getDefaultContext(), ...context });
    }

    async silly(message: string, context?: Record<string, any>): Promise<void> {
        this.log.log(LogLevel.silly, message, { ...this.getDefaultContext(), ...context });
    }
}


export class TraceLogger extends Logger {
    protected _traceId: string;
    readonly spanId: string;
    readonly start: Date;
    protected parent?: TraceLogger;

    get traceId() {
        return this._traceId;
    }

    constructor(protected log: Log, private scope?: string) {
        super(log);

        this._traceId = hexNano();
        this.start = new Date();
        this.spanId = hexNano(16);
    }

    protected getDefaultContext(): Record<string, any> {
        return {
            traceId: this.traceId,
            spanId: this.spanId,
            parentSpanId: this.parent?.spanId,
            start: this.start,
            scope: this.scope,
        };
    }

    startSpan(scope?: string): TraceLogger {
        const logger = new TraceLogger(this.log, scope);
        logger.parent = this;
        logger._traceId = this.traceId;
        logger.scope = scope ?? this.scope;
        LastActiveTrace.lastParent = logger;

        return logger;
    }

    lastActiveSpan(): LastActiveTrace {
        const logger = new LastActiveTrace(this.log);
        logger.parent = this;
        logger._traceId = this.traceId;
        logger.scope = this.scope;

        return logger;
    }

    setActiveSpan(): void {
        LastActiveTrace.lastParent = this;
    }
}

class LastActiveTrace extends TraceLogger {
    static lastParent?: TraceLogger;

    constructor(protected log: Log) {
        super(log);
    }

    protected getDefaultContext(): Record<string, any> {
        const context = super.getDefaultContext();

        return {
            ...context,
            parentSpanId: LastActiveTrace.lastParent?.spanId ?? this.parent?.spanId,
            traceId: LastActiveTrace.lastParent?.traceId ?? this.parent?.traceId,
        };
    }
}

export class Log {
    private emitter = new EventEmitter();
    constructor() {
    }


    addTransport(transport: LoggerTransport) {
        this.emitter.on('log', (event: LogEvent) => {
            transport.processEvent(event);
        });
        return this;
    }

    log(level: LogLevel, message: string, context?: Record<string, any>) {
        const event = {
            timestamp: new Date(),
            level,
            message,
            context,
        };
        this.emitter.emit('log', event);
    }

    startTrace(scope?: string): TraceLogger {
        return new TraceLogger(this, scope);
    }
}
