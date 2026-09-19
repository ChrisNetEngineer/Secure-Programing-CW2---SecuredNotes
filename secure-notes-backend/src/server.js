import { app } from "./app.js";
import { config } from "./config.js";

app.listen(config.port, () => {
  console.log(`Secure Notes API listening on http://localhost:${config.port}`);
});
