import chalk from "chalk";
import { LogEvent, LogLevel } from "../logger";
import { LoggerTransport } from "./loggerTransport";

const getChalk = (level: LogLevel) => {
    switch (level) {
        case LogLevel.info:
            return chalk.green;
        case LogLevel.error:
            return chalk.red;
        case LogLevel.debug:
            return chalk.blue;
        case LogLevel.warn:
            return chalk.yellow;
        case LogLevel.http:
            return chalk.cyan;
    }

    return chalk.white;
};


export class LoggerConsoleTransport implements LoggerTransport {
    constructor(private minimumLevel: LogLevel = LogLevel.info) {
    }

    private formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat('de', {
        dateStyle: 'short',
        timeStyle: 'medium',
    });

    async processEvent(event: LogEvent): Promise<void> {
        if (event.level > this.minimumLevel) {
            return;
        }

        const preamble = `${chalk.blue(this.formatter.format(event.timestamp))} [${getChalk(event.level)(LogLevel[event.level].toUpperCase())}]`;
        const traceId = event.context?.traceId ? chalk.gray(`[${event.context.traceId}]`) : '';
        const message = event.message;

        console.log(`${preamble} ${traceId} ${message}`);
    }
}
