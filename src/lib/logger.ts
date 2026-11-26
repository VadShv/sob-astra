export const logger = {
  error(...args: unknown[]) {
    if (process.env.NODE_ENV === "development") console.error(...args);
  },
  warn(...args: unknown[]) {
    if (process.env.NODE_ENV === "development") console.warn(...args);
  },
};
