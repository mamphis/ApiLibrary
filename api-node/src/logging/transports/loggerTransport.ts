import chalk from "chalk";
import { LogEvent, LogLevel } from "../logger";
import { MessageTemplate } from "./messageTemplate";

export interface LoggerTransport {
    processEvent(event: LogEvent): Promise<void>;
}
const getChalk = (options: FormattingOptions, level: LogLevel) => {
    if (!options.color) {
        return (text: string) => text;
    }

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

type FormattingOptions = {
    color: boolean;
    timestampFormatter: Intl.DateTimeFormat;
}

export const getFormatter = (options: Partial<FormattingOptions>): (event: LogEvent) => string => {
    const defaultOptions: FormattingOptions = {
        color: false,
        timestampFormatter: new Intl.DateTimeFormat('de', {
            dateStyle: 'short',
            timeStyle: 'medium',
        }),
    };

    const usedOptions: FormattingOptions = { ...defaultOptions, ...options };
    return (event: LogEvent) => {
        const timeStamp = usedOptions.timestampFormatter.format(event.timestamp);
        const preamble = `${options.color ? chalk.blue(timeStamp) : timeStamp} [${getChalk(usedOptions, event.level)(LogLevel[event.level].toUpperCase())}]`;
        const traceId = event.context?.traceId ? `[${event.context.traceId}]` : '';
        let message = event.message;

        const messageTemplate = new MessageTemplate(event.message, usedOptions);
        message = messageTemplate.render(event.context);

        if (event.context?.exception) {
            message += `\n${event.context.exception}`;
        }

        if (event.level === LogLevel.silly) {
            const context = JSON.stringify(event.context);
            message += `\n  ${usedOptions.color ? chalk.gray(context) : context}`;
        }

        return `${preamble} ${usedOptions.color ? chalk.gray(traceId) : traceId} ${message}`;
    };
}