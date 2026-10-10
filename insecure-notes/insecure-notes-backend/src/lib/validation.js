export function normalizeUsername(username) {
  return typeof username === "string" ? username.trim() : "";
}

export function validateLoginBody(body) {
  const username = normalizeUsername(body?.username);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  return { username, password };
}

export function validateSignupBody(body) {
  return validateLoginBody(body);
}

export function validateNoteBody(body) {
  const title = typeof body?.title === "string" ? body.title : "";
  const content = typeof body?.content === "string" ? body.content : "";

  if (!title) {
    return { error: "A title is required." };
  }

  return { title, content };
}

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
  if (role !== "user" && role !== "admin") {
    return { error: "Role must be user or admin." };
  }

  return { role };
}
