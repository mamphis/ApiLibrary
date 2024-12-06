import chalk from "chalk";
import EventEmitter from "events";
import { LoggerTransport } from "./transports/loggerTransport";

enum LogLevel {
    'error' = 1,
    'info' = 3,
    'debug' = 5,
}

const getChalk = (level: LogLevel) => {
    switch (level) {
        case LogLevel.info:
            return chalk.green;
        case LogLevel.error:
            return chalk.red;
        case LogLevel.debug:
            return chalk.blue;
    }

    return chalk.white;
};

type LogContext = Record<string, string | number | boolean | undefined>;

export type LogEvent = {
    timestamp: Date,
    level: LogLevel,
    message: string,
    context?: LogContext,
}

export class Logger {
    private logLevel: LogLevel;
    private formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat('de', {
        dateStyle: 'short',
        timeStyle: 'medium',
    });

    private static logger?: Logger;
    private static eventEmitter: EventEmitter = new EventEmitter();

    public static on(event: 'log', listener: (logEvent: LogEvent) => void): void {
        this.eventEmitter.on(event, listener);
    }

    protected constructor() {
        if (process.env.NODE_ENV === 'production') {
            this.logLevel = LogLevel.info;
        } else {
            this.logLevel = LogLevel.debug;
        }
    }

    public static createScopedLogger(scope: string): ScopedLogger {
        return new ScopedLogger(scope);
    }

    public static createLogger(): Logger {
        if (!Logger.logger) {
            Logger.logger = new Logger();
        }

        return Logger.logger;
    }

    public setLogLevel(logLevel: LogLevel): void {
        this.logLevel = logLevel;
    }

    protected log(level: LogLevel, message: string, context?: LogContext): void {
        const timestamp = new Date();
        Logger.eventEmitter.emit('log', { timestamp, level, message, context });
        if (level > this.logLevel) {
            return;
        }

        console.log(`${chalk.blue(this.formatter.format(timestamp))} [${getChalk(level)(LogLevel[level].toUpperCase())}] ${message}`);
    }

    public info(message: string, context?: LogContext): void {
        this.log(LogLevel.info, message, context);
    }

    public error(message: string, context?: LogContext): void {
        this.log(LogLevel.error, message, context);
    }

    public debug(message: string, context?: LogContext): void {
        this.log(LogLevel.debug, message, context);
    }

    public static addTransportLayer(transport: LoggerTransport): void {
        this.eventEmitter.on('log', async (logEvent: LogEvent) => {
            await transport.processEvent(logEvent);
        });
    }
}

class ScopedLogger extends Logger {
    constructor(private scope: string) {
        super();
    }

    protected log(level: LogLevel, message: string, context?: LogContext): void {
        super.log(level, `(${this.scope}) ${message}`, {...context, scope: this.scope});
    }

    public info(message: string, context?: LogContext): void {
        this.log(LogLevel.info, message, context);
    }

    public error(message: string, context?: LogContext): void {
        this.log(LogLevel.error, message, context);
    }

    public debug(message: string, context?: LogContext): void {
        this.log(LogLevel.debug, message, context);
    }
}
