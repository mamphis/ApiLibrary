import { createWriteStream, existsSync } from "fs";
import { LogEvent, LogLevel } from "../logger";
import { getFormatter, LoggerTransport } from "./loggerTransport";
import { FileHandle, mkdir, open, readdir, rename, stat, unlink } from "fs/promises";
import { join } from "path";

export enum RotatingInterval {
    Hourly = 'hourly',
    Daily = 'daily',
    Weekly = 'weekly',
    Monthly = 'monthly',
}

type RotatingFileTransportConfig = {
    minimumLevel: LogLevel;
    maxFiles: number;
    maxSingleFileSize: number;
    rotateInterval: RotatingInterval;
    logFileName: string;
}

export class LoggerRotatingFileTransport implements LoggerTransport {
    private config: RotatingFileTransportConfig;
    private messageFormatter: (event: LogEvent) => string;
    private messageQueue: string[] = [];

    constructor(private logDirectory: string, config?: Partial<RotatingFileTransportConfig>) {
        this.config = {
            minimumLevel: LogLevel.info,
            maxFiles: 10,
            maxSingleFileSize: 1024 * 1024 * 10,
            rotateInterval: RotatingInterval.Daily,
            logFileName: 'log.txt',
            ...config,
        };

        this.messageFormatter = getFormatter({
            color: false,
        });

        this.logFile = join(this.logDirectory, this.config.logFileName);
    }

    private logFile: string;

    private async rotateFile() {
        if (!this.stream) {
            // open the file if it is not opened jet. If the file Size is to big it doesnt matter at least we can log now.
            await this.rotate();
            return;
        }

        let shouldRotate = false;
        const stats = await this.getFileStats();

        // check if file is to old
        const now = new Date();
        const lastModified = new Date(stats.mtime);

        switch (this.config.rotateInterval) {
            case RotatingInterval.Hourly:
                shouldRotate = now.getHours() !== lastModified.getHours();
                break;
            case RotatingInterval.Daily:
                shouldRotate = now.getDate() !== lastModified.getDate();
                break;
            case RotatingInterval.Weekly:
                shouldRotate = now.getDay() !== lastModified.getDay();
                break;
            case RotatingInterval.Monthly:
                shouldRotate = now.getMonth() !== lastModified.getMonth();
                break;
        }

        // check if file is to big
        if (stats.size > this.config.maxSingleFileSize) {
            shouldRotate = true;
        }

        if (shouldRotate) { 
            await this.rotate();
        }

        // delete old files
        const files = await this.getFiles();
        if (files.length > this.config.maxFiles) {
            const filesToDelete = files.slice(0, files.length - this.config.maxFiles);
            await Promise.all(filesToDelete.map(file => unlink(file))).catch(() => {
                // ignore errors
            });
        }
    }

    private stream?: NodeJS.WritableStream;

    private async rotate() {
        if (this.stream) {
            this.stream.end();
            this.stream = undefined;
        }

        const newFile = this.logFile + '.' + new Date().toISOString().replace(/:/g, '-').replace(/\..+$/, '');

        if (existsSync(this.logFile)) {
            await rename(this.logFile, newFile);
        }

        this.stream = createWriteStream(this.logFile, { flags: 'a', autoClose: false, encoding: 'utf8' });
        this.stream.write(this.messageQueue.join(''));
        this.messageQueue = [];
    }

    private async getFiles() {
        const files = (await readdir(this.logDirectory)).filter(file => file !== this.config.logFileName).map(file => join(this.logDirectory, file));
        // sort by date.
        files.sort((a, b) => {
            const aDate = new Date(a.split('.').pop()!);
            const bDate = new Date(b.split('.').pop()!);
            return aDate.getTime() - bDate.getTime();
        });

        return files;
    }

    private async getFileStats() {
        return stat(this.logFile).catch(() => ({ size: 0, mtime: new Date(0) }));
    }

    async processEvent(event: LogEvent): Promise<void> {
        if (event.level > this.config.minimumLevel) {
            return;
        }

        // ensure directory exists
        if (!existsSync(this.logDirectory)) {
            await mkdir(this.logDirectory, { recursive: true });
        }

        const logLine = this.messageFormatter(event) + '\n';

        // get file to append to
        await this.rotateFile();

        if (this.stream) {
            this.stream.write(logLine);
        } else {
            // queue the messages and write them when the stream
            this.messageQueue.push(logLine);
        }
    }
}
