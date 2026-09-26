const WINDOW_MS = 60 * 1000;
const FAILURE_LIMIT = 5;

const failuresByUsername = new Map();

export function recordFailedLogin(username) {
  const key = username.toLowerCase();
  const now = Date.now();
  const recent = (failuresByUsername.get(key) || []).filter(
    (attemptedAt) => now - attemptedAt < WINDOW_MS
  );
  recent.push(now);
  failuresByUsername.set(key, recent);
  return recent.length;
}

export function shouldLockAfterFailures(failureCount) {
  return failureCount >= FAILURE_LIMIT;
}

export function clearFailedLogins(username) {
  failuresByUsername.delete(username.toLowerCase());
}
