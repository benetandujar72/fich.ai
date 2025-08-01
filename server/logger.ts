import fs from 'fs';
import path from 'path';

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  error?: Error;
}

class Logger {
  private logFile: string;
  private isProduction = process.env.NODE_ENV === 'production';

  constructor() {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Create log file with date
    const date = new Date().toISOString().split('T')[0];
    this.logFile = path.join(logsDir, `app-${date}.log`);
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, component, message, data, error } = entry;
    let logLine = `[${timestamp}] ${level} [${component}] ${message}`;
    
    if (data) {
      logLine += ` | Data: ${JSON.stringify(data)}`;
    }
    
    if (error) {
      logLine += ` | Error: ${error.message}`;
      if (error.stack) {
        logLine += ` | Stack: ${error.stack}`;
      }
    }
    
    return logLine;
  }

  private writeToFile(logEntry: LogEntry) {
    try {
      const logLine = this.formatLogEntry(logEntry) + '\n';
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private log(level: LogLevel, component: string, message: string, data?: any, error?: Error) {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      component,
      message,
      data,
      error
    };

    // Always log to console in development
    if (!this.isProduction) {
      const consoleMessage = this.formatLogEntry(logEntry);
      switch (level) {
        case LogLevel.ERROR:
          console.error(consoleMessage);
          break;
        case LogLevel.WARN:
          console.warn(consoleMessage);
          break;
        case LogLevel.INFO:
          console.info(consoleMessage);
          break;
        case LogLevel.DEBUG:
          console.debug(consoleMessage);
          break;
      }
    }

    // Write to file
    this.writeToFile(logEntry);
  }

  error(component: string, message: string, error?: Error, data?: any) {
    this.log(LogLevel.ERROR, component, message, data, error);
  }

  warn(component: string, message: string, data?: any) {
    this.log(LogLevel.WARN, component, message, data);
  }

  info(component: string, message: string, data?: any) {
    this.log(LogLevel.INFO, component, message, data);
  }

  debug(component: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, component, message, data);
  }

  // Database operations logging
  dbQuery(operation: string, table: string, data?: any) {
    this.debug('DATABASE', `${operation} on ${table}`, data);
  }

  dbError(operation: string, table: string, error: Error, data?: any) {
    this.error('DATABASE', `${operation} failed on ${table}`, error, data);
  }

  // API operations logging
  apiRequest(method: string, endpoint: string, userId?: string, data?: any) {
    this.info('API', `${method} ${endpoint}${userId ? ` | User: ${userId}` : ''}`, data);
  }

  apiError(method: string, endpoint: string, error: Error, userId?: string, data?: any) {
    this.error('API', `${method} ${endpoint}${userId ? ` | User: ${userId}` : ''}`, error, data);
  }

  // Email operations logging
  emailSent(to: string, subject: string, type: string = 'general') {
    this.info('EMAIL', `Email sent to ${to} | Subject: ${subject} | Type: ${type}`);
  }

  emailError(to: string, subject: string, error: Error, type: string = 'general') {
    this.error('EMAIL', `Failed to send email to ${to} | Subject: ${subject} | Type: ${type}`, error);
  }

  // Schedule import logging
  scheduleImport(operation: string, details: string, data?: any) {
    this.info('SCHEDULE_IMPORT', `${operation}: ${details}`, data);
  }

  scheduleImportError(operation: string, error: Error, data?: any) {
    this.error('SCHEDULE_IMPORT', `${operation} failed`, error, data);
  }

  // Attendance logging
  attendance(action: string, employeeId: string, details?: string) {
    this.info('ATTENDANCE', `${action} for employee ${employeeId}${details ? ` | ${details}` : ''}`);
  }

  attendanceError(action: string, employeeId: string, error: Error) {
    this.error('ATTENDANCE', `${action} failed for employee ${employeeId}`, error);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export helper function for easy access
export function log() {
  return logger;
}