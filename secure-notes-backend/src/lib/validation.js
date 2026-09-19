const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,32}$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export function normalizeUsername(username) {
  return typeof username === "string" ? username.trim() : "";
}

export function validateLoginBody(body) {
  const username = normalizeUsername(body?.username);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  if (!USERNAME_PATTERN.test(username) || password.length > MAX_PASSWORD_LENGTH) {
    return { error: "Invalid username or password." };
  }

  return { username, password };
}

export function validateSignupBody(body) {
  const username = normalizeUsername(body?.username);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return { error: "Username must be 3-32 letters, numbers, or underscores." };
  }

  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return {
      error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
    };
  }

  return { username, password };
}
