export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
// TODO replace all consolo log with 
export class Logger {
    private static level: LogLevel = LogLevel.INFO; // Change this number: 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR

    static setLevel(level: LogLevel): void {
        this.level = level;
        this.info('Log level changed', 'Logger', { newLevel: LogLevel[level] });
    }

    // ALWAYS log errors and throws (ignore level setting)
    static error(message: string, context?: string, data?: any): void {
        this.log('ERROR', message, context, data);
    }

    static errorAndThrow(message: string, context?: string, data?: any): never {
        this.log('ERROR', message, context, data);
        throw new Error(context ? `${context}: ${message}` : message);
    }

    static debug(message: string, context?: string, data?: any): void {
        if (this.level <= LogLevel.DEBUG) {
            this.log('DEBUG', message, context, data);
        }
    }

    static info(message: string, context?: string, data?: any): void {
        if (this.level <= LogLevel.INFO) {
            this.log('INFO', message, context, data);
        }
    }

    static warn(message: string, context?: string, data?: any): void {
        if (this.level <= LogLevel.WARN) {
            this.log('WARN', message, context, data);
        }
    }

    private static log(level: string, message: string, context?: string, data?: any): void {
        const timestamp = new Date().toISOString().substr(11, 8);
        const prefix = context ? `[${level}] ${timestamp} ${context}:` : `[${level}] ${timestamp}`;
        if (data)
            console.log(`${prefix} ${message}`, data);
        else
            console.log(`${prefix} ${message}`);
    }
}