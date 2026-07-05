/**
 * Simple logger utility with timestamp and level formatting.
 * Can be swapped for winston/pino in production.
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info: (message, ...args) => {
    console.log(
      `${colors.cyan}[${timestamp()}]${colors.reset} ${colors.green}INFO${colors.reset}  ${message}`,
      ...args
    );
  },
  warn: (message, ...args) => {
    console.warn(
      `${colors.cyan}[${timestamp()}]${colors.reset} ${colors.yellow}WARN${colors.reset}  ${message}`,
      ...args
    );
  },
  error: (message, ...args) => {
    console.error(
      `${colors.cyan}[${timestamp()}]${colors.reset} ${colors.red}ERROR${colors.reset} ${message}`,
      ...args
    );
  },
  debug: (message, ...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${colors.cyan}[${timestamp()}]${colors.reset} ${colors.magenta}DEBUG${colors.reset} ${message}`,
        ...args
      );
    }
  },
};

module.exports = { logger };
