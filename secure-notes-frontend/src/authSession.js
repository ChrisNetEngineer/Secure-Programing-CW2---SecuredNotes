const STORAGE_KEY = "secureNotesUser";

export function getLoggedInUser() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const user = JSON.parse(raw);
    if (!user?.id || !user?.username) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export function setLoggedInUser(user) {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      id: user.id,
      username: user.username,
    })
  );
}

export function clearLoggedInUser() {
  sessionStorage.removeItem(STORAGE_KEY);
}
