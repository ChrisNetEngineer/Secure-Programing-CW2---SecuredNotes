import bcrypt from "bcrypt";
import { config } from "../config.js";

const dummyHash = bcrypt.hashSync("timing-dummy", config.bcryptRounds);

export function hashPassword(password) {
  return bcrypt.hash(password, config.bcryptRounds);
}

export async function passwordsMatch(password, passwordHash) {
  const hashToCompare = passwordHash || dummyHash;
  const matches = await bcrypt.compare(password, hashToCompare);
  return Boolean(passwordHash) && matches;
}
