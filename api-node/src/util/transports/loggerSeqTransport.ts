import { LogEvent } from "../logger";
import { LoggerTransport } from "./loggerTransport";

export class LoggerSeqTransport implements LoggerTransport{
    constructor(private clefEndpoint: string, private apiKey: string) {
    }

    async processEvent(event: LogEvent): Promise<void> {
        const body = {
            '@t': event.timestamp.toISOString(),
            '@l': event.level,
            '@m': event.message,
            '@tr': event.context?.traceId,
            '@sc': event.context?.scope,
            '@x': event.context,
        }

        const headers = {
            'Content-Type': 'application/json',
            'X-Seq-ApiKey': this.apiKey,
        }

        const result = await fetch(this.clefEndpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
    }
}