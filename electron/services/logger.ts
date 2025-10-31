import log from "electron-log";
import chalk from "chalk";

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