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

export function validateNoteBody(body) {
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!title) {
    return { error: "A title is required." };
  }

  if (title.length > 120) {
    return { error: "Title must be 120 characters or fewer." };
  }

  if (content.length > 8000) {
    return { error: "Note content must be 8000 characters or fewer." };
  }

  return { title, content };
}

const ROLES = new Set(["user", "admin"]);

export function validateRoleBody(body) {
  return validateRole(body?.role);
}

export function validateDisabledBody(body) {
  if (typeof body?.disabled !== "boolean") {
    return { error: "disabled must be true or false." };
  }

  return { disabled: body.disabled };
}

export function validateAdminCreateBody(body) {
  const parsed = validateSignupBody(body);
  if (parsed.error) {
    return parsed;
  }

  const roleParsed = validateRole(body?.role ?? "user");
  if (roleParsed.error) {
    return roleParsed;
  }

  return {
    username: parsed.username,
    password: parsed.password,
    role: roleParsed.role,
  };
}

function validateRole(role) {
  if (typeof role !== "string" || !ROLES.has(role)) {
    return { error: "Role must be user or admin." };
  }

  return { role };
}
