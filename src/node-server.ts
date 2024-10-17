import { serve } from "@hono/node-server";
import api from "./app";

serve({
  port: 8080,
  fetch: api.fetch,
});
