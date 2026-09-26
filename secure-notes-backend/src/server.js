import { app } from "./app.js";
import { config } from "./config.js";
import { encryptExistingNotes, initAuditTable, initNotesTable, initRbac } from "./db.js";

await initRbac();
await initNotesTable();
await initAuditTable();
await encryptExistingNotes();

app.listen(config.port, () => {
  console.log(`Secure Notes API listening on http://localhost:${config.port}`);
});
