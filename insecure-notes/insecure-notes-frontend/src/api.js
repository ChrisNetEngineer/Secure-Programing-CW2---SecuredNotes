export function api(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  return fetch(path, {
    ...options,
    headers,
    credentials: "include",
  });
}
