const STORAGE_KEY = "insecureNotesUser";

export function getLoggedInUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const user = JSON.parse(raw);
    if (!user?.id || !user?.username) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role === "admin" ? "admin" : "user",
    };
  } catch {
    return null;
  }
}

export function setLoggedInUser(user) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role === "admin" ? "admin" : "user",
    })
  );
}

export function clearLoggedInUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export function homePath(user) {
  return user?.role === "admin" ? "/admin" : "/notes";
}
