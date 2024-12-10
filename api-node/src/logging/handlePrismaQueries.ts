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

const getEntityNameFromQuery = (query: string): string => {
    const [operation, ...rest] = query.split(' ');
    let name = operation + ' ';
    switch (operation) {
        case 'SELECT':
            name += rest.lastIndexOf('FROM') > -1 ? rest[rest.lastIndexOf('FROM') + 1] : 'Unknown';
            break;
        case 'INSERT':
            name += rest.lastIndexOf('INTO') > -1 ? rest[rest.lastIndexOf('INTO') + 1] : 'Unknown';
            break;
        case 'UPDATE':
            name += rest.lastIndexOf('UPDATE') > -1 ? rest[rest.lastIndexOf('UPDATE') + 1] : 'Unknown';
            break;
        case 'DELETE':
            name += rest.lastIndexOf('FROM') > -1 ? rest[rest.lastIndexOf('FROM') + 1] : 'Unknown';
            break;
        default:
            name += 'Unknown';
            break;
    }

    return name;
}

export const handlePrismaQuery = (client: PrismaClient, logger: TraceLogger) => {
    client.$on('query', (e: QueryEvent) => {
        const entityName = getEntityNameFromQuery(e.query);

        logger.lastActiveSpan().silly('Prisma Query {entityName}', { ...e, entityName, '@i': 0x10001 });
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