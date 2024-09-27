import { Agenda } from "@hokify/agenda";
import { config } from "../utils/utils.js";

const { mongodb } = config;

let db: {
    address: string;
    collection: string;
    options?: { dbName: string; auth?: { username: string; password: string } };
};

if (process.env.NODE_ENV === "production") {
    db = {
        address: mongodb.atlasConnectionString,
        collection: "scheduled_jobs",
        options: {
            dbName: mongodb.db,
            auth: {
                username: mongodb.atlasUsername,
                password: mongodb.atlasPassword,
            },
        },
    };
} else {
    db = {
        address: mongodb.connectionString,
        collection: "scheduled_jobs",
        options: {
            dbName: mongodb.db,
        },
    };
}

export const agenda = new Agenda({ db });
