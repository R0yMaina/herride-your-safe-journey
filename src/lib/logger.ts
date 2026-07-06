import { env } from "@/config/env";

type LogLevel = "debug" | "info" | "warn" | "error";
interface LogPayload { readonly [key: string]: unknown }

class Logger {
  private readonly enabled = env.mode !== "test";
  debug(m: string, p?: LogPayload) { this.emit("debug", m, p); }
  info(m: string, p?: LogPayload) { this.emit("info", m, p); }
  warn(m: string, p?: LogPayload) { this.emit("warn", m, p); }
  error(m: string, p?: LogPayload) { this.emit("error", m, p); }
  private emit(level: LogLevel, message: string, payload?: LogPayload): void {
    if (!this.enabled) return;
    const entry = { level, message, ts: new Date().toISOString(), ...payload };
    // eslint-disable-next-line no-console
    console[level === "debug" ? "log" : level](entry);
  }
}

export const logger = new Logger();