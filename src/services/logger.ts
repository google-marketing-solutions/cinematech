/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

/**
 * Log levels used by the Logger service.
 * This enum defines the severity levels for log messages.
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class LoggerService {
  private formatMessage(
    level: LogLevel,
    context: string,
    message: string
  ): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${context}] ${message}`;
  }

  debug(context: string, message: string, data?: unknown) {
    if (import.meta.env.DEV) {
      console.debug(
        this.formatMessage(LogLevel.DEBUG, context, message),
        data || ''
      );
    }
  }

  info(context: string, message: string, data?: unknown) {
    console.info(
      this.formatMessage(LogLevel.INFO, context, message),
      data || ''
    );
  }

  warn(context: string, message: string, data?: unknown) {
    console.warn(
      this.formatMessage(LogLevel.WARN, context, message),
      data || ''
    );
  }

  error(context: string, message: string, error?: unknown) {
    console.error(
      this.formatMessage(LogLevel.ERROR, context, message),
      error || ''
    );
  }
}

/**
 * Provides a singleton instance of the LoggerService.
 * This logger is used throughout the application to consistently log messages
 * with timestamps, log levels, and context.
 */
export const Logger = new LoggerService();
