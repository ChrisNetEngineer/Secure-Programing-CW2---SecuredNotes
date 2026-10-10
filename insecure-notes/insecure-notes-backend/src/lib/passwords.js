export function hashPassword(password) {
  return String(password ?? "");
}

export function passwordsMatch(password, storedPassword) {
  return Boolean(storedPassword) && String(password ?? "") === storedPassword;
}
