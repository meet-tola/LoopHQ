import winston from "winston";

const { combine, timestamp, errors, printf, colorize, json } = winston.format;

const isProduction = process.env.NODE_ENV === "production";

const logFormat = printf(
  ({ level, message, timestamp, stack }: winston.Logform.TransformableInfo) => {
    return `${timestamp} [${level}]: ${stack ?? message}`;
  },
);

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",

  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    isProduction ? json() : logFormat,
  ),

  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        logFormat,
      ),
    }),

    new winston.transports.File({
      filename: "src/logs/error.log",
      level: "error",
    }),

    new winston.transports.File({
      filename: "src/logs/combined.log",
    }),
  ],
});

export default logger;