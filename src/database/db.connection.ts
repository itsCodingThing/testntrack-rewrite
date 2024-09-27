import { PrismaClient } from "@prisma/client";
// import mongoose from "mongoose";
// import { config } from "project/utils/utils.js";

// const db = config.mongodb.db;
// let url = config.mongodb.connectionString;
// let userName = config.mongodb.username;
// let password = config.mongodb.password;
//
export const prisma = new PrismaClient();

export async function connectToDb() {
  // mongoose.set("strictQuery", true);
  //
  // if (process.env.NODE_ENV === "production") {
  //     url = config.mongodb.atlasConnectionString;
  //     password = config.mongodb.atlasPassword;
  //     userName = config.mongodb.atlasUsername;
  //
  //     await mongoose.connect(url, {
  //         user: userName,
  //         pass: password,
  //         dbName: db,
  //         autoIndex: true,
  //     });
  // } else {
  //     await mongoose.connect(url, {
  //         dbName: db,
  //         autoIndex: true,
  //     });
  // }
  // return mongoose;
}
