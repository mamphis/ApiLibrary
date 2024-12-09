import { LogEvent, LogLevel } from "../logger";
import { LoggerTransport } from "./loggerTransport";

export class LoggerSeqTransport implements LoggerTransport {
    constructor(private clefEndpoint: string, private apiKey: string) {
    }

    async processEvent(event: LogEvent): Promise<void> {
        const body = {
            '@t': event.timestamp.toISOString(),
            '@l': LogLevel[event.level],
            '@mt': event.message,
            '@tr': event.context?.traceId,
            '@sp': event.context?.spanId,
            '@ps': event.context?.parentSpanId,
            '@st': event.context?.start?.toISOString(),
            '@x': event.context?.exception,
            ...event.context,
            '@r': event.context,
            'Application': event.context?.serviceName ?? event.context?.scope,
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

        if (!result.ok) {
            console.error('Error sending log to Seq', await result.text(), body);
        }
    }
}