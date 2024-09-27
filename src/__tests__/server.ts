import supertest from "supertest";
import { buildServer } from "../app/app.ts";

const server = supertest(buildServer().server);

test("Should register new user", async () => {
    const response = await server.get("/api/v1/sentry-debug").expect(500);

    expect(response.body).toMatchObject({ statusCode: 500 });
});
