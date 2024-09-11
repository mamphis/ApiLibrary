import chalk from "chalk";

enum LogLevel {
    'info',
    'error',
    'debug',
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

export class Logger {
    private logLevel: LogLevel;
    private formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat('de', {
        dateStyle: 'short',
        timeStyle: 'medium',
    });

    private static logger?: Logger;

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

    protected log(level: LogLevel, message: string): void {
        if (level < this.logLevel) {
            return;
        }

        console.log(`${chalk.blue(this.formatter.format(new Date()))} [${getChalk(level)(LogLevel[level].toUpperCase())}] ${message}`);
    }

    public info(message: string): void {
        this.log(LogLevel.info, message);
    }

    public error(message: string): void {
        this.log(LogLevel.error, message);
    }

    public debug(message: string): void {
        this.log(LogLevel.debug, message);
    }
}

class ScopedLogger extends Logger {
    constructor(private scope: string) {
        super();
    }

    protected log(level: LogLevel, message: string): void {
        super.log(level, `(${this.scope}) ${message}`);
    }

    public info(message: string): void {
        this.log(LogLevel.info, message);
    }

    public error(message: string): void {
        this.log(LogLevel.error, message);
    }

    public debug(message: string): void {
        this.log(LogLevel.debug, message);
    }
}
