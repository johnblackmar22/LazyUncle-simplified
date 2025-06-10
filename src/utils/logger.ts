export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level && this.config.enableConsole;
  }

  private formatMessage(level: string, message: string, ...args: any[]): void {
    if (!this.config.enableConsole) return;
    
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    const logMessage = `${timestamp} ${prefix}[${level}] ${message}`;
    
    switch (level) {
      case 'ERROR':
        console.error(logMessage, ...args);
        break;
      case 'WARN':
        console.warn(logMessage, ...args);
        break;
      case 'INFO':
        console.info(logMessage, ...args);
        break;
      case 'DEBUG':
        console.log(logMessage, ...args);
        break;
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.formatMessage('ERROR', message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.formatMessage('WARN', message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.formatMessage('INFO', message, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.formatMessage('DEBUG', message, ...args);
    }
  }
}

// Create default logger instance
const isDevelopment = import.meta.env.DEV;
const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

export const logger = new Logger({
  level: isDevelopment || isDemo ? LogLevel.DEBUG : LogLevel.WARN,
  enableConsole: isDevelopment || isDemo,
  prefix: 'LazyUncle',
});

// Helper functions for specific areas
export const authLogger = new Logger({
  level: isDevelopment || isDemo ? LogLevel.DEBUG : LogLevel.ERROR,
  enableConsole: isDevelopment || isDemo,
  prefix: 'Auth',
});

export const storeLogger = new Logger({
  level: isDevelopment || isDemo ? LogLevel.DEBUG : LogLevel.ERROR,
  enableConsole: isDevelopment || isDemo,
  prefix: 'Store',
});

export const apiLogger = new Logger({
  level: isDevelopment || isDemo ? LogLevel.INFO : LogLevel.ERROR,
  enableConsole: isDevelopment || isDemo,
  prefix: 'API',
}); 