import { PrismaClient } from "@prisma/client"
import { TraceLogger } from "./logger";

type QueryEvent = {
    timestamp: Date;
    query: string; // Query sent to the database
    params: string; // Query parameters
    duration: number; // Time elapsed (in milliseconds) between client issuing query and database responding - not only time taken to run query
    target: string;
};

type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
};

export const handlePrismaQuery = (client: PrismaClient, logger: TraceLogger) => {
    client.$on('query', (e: QueryEvent) => {
        logger.lastActiveSpan().silly('Prisma Query', { ...e, '@i': 0x10001 });
    });
    client.$on('info', (e: LogEvent) => {
        logger.lastActiveSpan().info(e.message, { timestamp: e.timestamp, target: e.target, '@i': 0x10002 });
    });
    client.$on('warn', (e: LogEvent) => {
        logger.lastActiveSpan().warn(e.message, { timestamp: e.timestamp, target: e.target, '@i': 0x10003 });
    });
    client.$on('error', (e: LogEvent) => {
        logger.lastActiveSpan().error(e.message, { timestamp: e.timestamp, target: e.target, '@i': 0x10004 });
    });
}

type PrismaLogLevel = 'query' | 'error' | 'info' | 'warn';

type PrismaClientLoggingParameters = {
    log: {
        emit: 'event';
        level: PrismaLogLevel;
    }[];
}

export const getPrismaClientLoggingParameters = (level: PrismaLogLevel[] = ['query', 'info', 'warn', 'error']): PrismaClientLoggingParameters => {
    return {
        log: level.map(l => ({ emit: 'event', level: l }))
    }
}