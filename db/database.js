import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const Database = async () => {
  try {
    const connectionsInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
    );
    console.log(
      `\n Mongodb connected !! DB host : ${connectionsInstance.connection.host}`,
    );
  } catch (e) {
    console.error(e);
    await mongoose.disconnect();
  }
};

export default Database;
