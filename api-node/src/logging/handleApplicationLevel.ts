import { TraceLogger } from "./logger";

const handleUncaughtException = (log: TraceLogger) => {
    process.on('uncaughtException', (error, origin) => {

        log.error(error, { '@i': 5, origin })
    });
}

const handleUncaughtRejection = (log: TraceLogger) => {
    process.on('unhandledRejection', (error, promise) => {
        if (error instanceof Error) {
            log.error(error, { '@i': 6 });
        } else {
            log.error('An unhandled rejection occurred', { '@i': 6, error });
        }
    });
}

export { handleUncaughtException, handleUncaughtRejection };
