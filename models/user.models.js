import mongoose from "mongoose";
import { type } from "./../node_modules/raw-body/index.d";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("Users", userSchema);
