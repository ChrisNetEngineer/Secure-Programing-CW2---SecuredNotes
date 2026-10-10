import fs from "node:fs";
import https from "node:https";
import { app } from "./app.js";
import { config } from "./config.js";
import { encryptExistingNotes, initAuditTable, initNotesTable, initRbac } from "./db.js";

await initRbac();
await initNotesTable();
await initAuditTable();
await encryptExistingNotes();

if (config.tlsCertFile && config.tlsKeyFile) {
  https
    .createServer(
      {
        cert: fs.readFileSync(config.tlsCertFile),
        key: fs.readFileSync(config.tlsKeyFile),
      },
      app
    )
    .listen(config.port, () => {
      console.log(`Secure Notes API listening on https://0.0.0.0:${config.port}`);
    });
} else {
  app.listen(config.port, () => {
    console.log(`Secure Notes API listening on http://localhost:${config.port}`);
  });
}
