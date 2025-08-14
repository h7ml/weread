import { runInDenoDeploy } from "./index.ts";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private name: string;
  private level: LogLevel;
  private logDir = "./logs";

  constructor(name: string, level: LogLevel = LogLevel.INFO) {
    this.name = name;
    this.level = level;

    // 在非 Deploy 环境创建日志目录
    if (!runInDenoDeploy()) {
      this.ensureLogDir();
    }
  }

  private ensureLogDir() {
    try {
      Deno.mkdirSync(this.logDir, { recursive: true });
    } catch {
      // 目录已存在
    }
  }

  private getLogFileName(): string {
    const date = new Date().toISOString().split("T")[0];
    return `${this.logDir}/app-${date}.log`;
  }

  private formatMessage(
    level: string,
    message: string,
    ...args: unknown[]
  ): string {
    const timestamp = new Date().toISOString();
    const extra = args.length > 0 ? " " + JSON.stringify(args) : "";
    return `[${timestamp}] [${level}] [${this.name}] ${message}${extra}`;
  }

  private async writeToFile(message: string) {
    if (runInDenoDeploy()) return;

    try {
      const fileName = this.getLogFileName();
      await Deno.writeTextFile(fileName, message + "\n", { append: true });
    } catch (error) {
      console.error("Failed to write log:", error);
    }
  }

  debug(message: string, ...args: unknown[]) {
    if (this.level > LogLevel.DEBUG) return;
    const formatted = this.formatMessage("DEBUG", message, ...args);
    console.debug(formatted);
    this.writeToFile(formatted);
  }

  info(message: string, ...args: unknown[]) {
    if (this.level > LogLevel.INFO) return;
    const formatted = this.formatMessage("INFO", message, ...args);
    console.info(formatted);
    this.writeToFile(formatted);
  }

  warn(message: string, ...args: unknown[]) {
    if (this.level > LogLevel.WARN) return;
    const formatted = this.formatMessage("WARN", message, ...args);
    console.warn(formatted);
    this.writeToFile(formatted);
  }

  error(message: string, ...args: unknown[]) {
    if (this.level > LogLevel.ERROR) return;
    const formatted = this.formatMessage("ERROR", message, ...args);
    console.error(formatted);
    this.writeToFile(formatted);
  }
}

// 创建默认logger实例
export const logger = new Logger("app");

// 创建专用logger的工厂函数
export function createLogger(name: string, level?: LogLevel): Logger {
  return new Logger(name, level);
}
