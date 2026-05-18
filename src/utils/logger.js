/**
 * Tiny logger factory – returns a `log(msg, type, level)` function that
 * appends a timestamped entry to the React log state via the provided setter.
 */
export function createLogger(setLogs) {
  return function log(msg, type = "default", level = "INFO") {
    const now = new Date();
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");
    setLogs((prev) => [...prev, { time, level, msg, type }]);
  };
}
