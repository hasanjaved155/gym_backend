import dotenv from "dotenv";
dotenv.config();
import Database from "./db/database.js";
import { app } from "./app.js";

(async () => {
  try {
    await Database();
    console.log("DB Connection Open");

    app.listen(process.env.PORT || 8080, () => {
      console.log("server running at port :: 8080");
    });
  } catch (e) {
    console.log("could not start the server", e);
  }
})();
