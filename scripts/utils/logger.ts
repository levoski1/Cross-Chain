const RESET = "\x1b[0m";
const BRIGHT = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";

export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
  SUCCESS = "SUCCESS",
}

const LOG_PREFIX = "[CrossChain]";

export function info(message: string, data?: Record<string, unknown>): void {
  console.log(`${BLUE}${LOG_PREFIX}${RESET} ${BRIGHT}[INFO]${RESET} ${message}`);
  if (data) console.log(`${DIM}${JSON.stringify(data, null, 2)}${RESET}`);
}

export function success(message: string, data?: Record<string, unknown>): void {
  console.log(`${GREEN}${LOG_PREFIX}${RESET} ${BRIGHT}[OK]${RESET} ${message}`);
  if (data) console.log(`${DIM}${JSON.stringify(data, null, 2)}${RESET}`);
}

export function warn(message: string, data?: Record<string, unknown>): void {
  console.warn(`${YELLOW}${LOG_PREFIX}${RESET} ${BRIGHT}[WARN]${RESET} ${message}`);
  if (data) console.warn(`${DIM}${JSON.stringify(data, null, 2)}${RESET}`);
}

export function error(message: string, err?: unknown): void {
  console.error(`${RED}${LOG_PREFIX}${RESET} ${BRIGHT}[ERROR]${RESET} ${message}`);
  if (err) {
    if (err instanceof Error) {
      console.error(`${DIM}${err.message}${RESET}`);
      if (err.stack) console.error(`${DIM}${err.stack}${RESET}`);
    } else {
      console.error(`${DIM}${JSON.stringify(err, null, 2)}${RESET}`);
    }
  }
}

export function debug(message: string, data?: Record<string, unknown>): void {
  if (process.env.DEBUG === "true") {
    console.log(`${CYAN}${LOG_PREFIX}${RESET} ${DIM}[DEBUG]${RESET} ${message}`);
    if (data) console.log(`${DIM}${JSON.stringify(data, null, 2)}${RESET}`);
  }
}

export function divider(): void {
  console.log(`${DIM}${"─".repeat(60)}${RESET}`);
}

export function header(text: string): void {
  const line = "═".repeat(Math.max(0, 60 - text.length - 2));
  console.log(`\n${BRIGHT}${CYAN}${line} ${text} ${line}${RESET}\n`);
}
