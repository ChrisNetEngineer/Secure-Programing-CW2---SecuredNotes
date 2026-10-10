import { app } from "./app.js";
import { config } from "./config.js";
import { ensureDatabase, initNotesTable, initUsersTable } from "./db.js";

await ensureDatabase();
await initUsersTable();
await initNotesTable();

app.listen(config.port, () => {
  console.log(`Insecure Notes API listening on http://localhost:${config.port}`);
});
