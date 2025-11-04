import log from "electron-log";
import chalk from "chalk";

// Set console encoding to UTF-8 on Windows to prevent garbled text
if (process.platform === 'win32') {
  try {
    // Set code page to UTF-8 (65001)
    if (process.stdout && typeof process.stdout.setEncoding === 'function') {
      process.stdout.setEncoding('utf8');
    }
    if (process.stderr && typeof process.stderr.setEncoding === 'function') {
      process.stderr.setEncoding('utf8');
    }
  } catch (error) {
    console.error('Failed to set console encoding:', error);
  }
}

log.transports.file.level = "info";
log.transports.file.maxSize = 1024 * 1024 * 5;
log.transports.console.level = "debug";
log.transports.console.useStyles = true;

class Logger {
  private _write(level: string, message: string, data?: any) {
    const msg = `${new Date().toISOString()} [${level}] ${message}`;
    console.log(msg);
  }
  info(message: string, data?: any) {
    this._write(chalk.blue("INFO"), message, data);
  }
  warn(message: string, data?: any) {
    this._write(chalk.yellow("WARN"), message, data);
  }
  error(message: string, data?: any) {
    this._write(chalk.red("ERROR"), message, data);
  }
  debug(message: string, data?: any) {
    this._write(chalk.gray("DEBUG"), message, data);
  }
}

export const logger = new Logger();

export function setupErrorHandlers() {
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error)
    })
    process.on('unhandledRejection', (reason) => {
        logger.error('Unhandled Rejection:', reason)
    })
}