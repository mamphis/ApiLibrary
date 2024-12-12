import chalk from "chalk";
import { LogEvent, LogLevel } from "../logger";
import { LoggerTransport, getFormatter } from "./loggerTransport";

export class LoggerConsoleTransport implements LoggerTransport {
    private messageFormatter: (event: LogEvent) => string;
    constructor(private minimumLevel: LogLevel = LogLevel.info) {
        this.messageFormatter = getFormatter({
            color: true,
        });
    }

    async processEvent(event: LogEvent): Promise<void> {
        if (event.level > this.minimumLevel) {
            return;
        }

        const message = this.messageFormatter(event);

        switch (event.level) {
            case LogLevel.error:
                console.error(message);
                break;
            case LogLevel.warn:
                console.warn(message);
                break;
            default:
                console.log(message);
        }
    }
}
