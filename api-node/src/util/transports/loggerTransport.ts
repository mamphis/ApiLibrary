import { LogEvent } from "../logger";

export interface LoggerTransport {
    processEvent(event: LogEvent): Promise<void>;
}