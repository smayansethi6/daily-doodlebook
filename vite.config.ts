import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Serves the Vercel functions in /api during `npm run dev`, so Ink and the
 * answer screen work locally with the server-only GEMINI_API_KEY from .env.
 */
function vercelApiInDev(): Plugin {
  return {
    name: "vercel-api-in-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const name = req.url?.match(/^\/api\/([\w-]+)(?:[?#]|$)/)?.[1];
        const file = name && path.resolve(__dirname, "api", `${name}.ts`);
        if (!file || !fs.existsSync(file)) return next();

        try {
          const handler = (await server.ssrLoadModule(file))[req.method ?? "GET"];
          if (typeof handler !== "function") {
            res.statusCode = 405;
            return res.end();
          }

          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const response: Response = await handler(
            new Request(`http://localhost${req.url}`, {
              method: req.method,
              headers: { "Content-Type": String(req.headers["content-type"] ?? "") },
              body: chunks.length ? Buffer.concat(chunks) : undefined,
            })
          );

          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Server-only variables (no VITE_ prefix) for the /api functions in dev.
  const env = loadEnv(mode, process.cwd(), "");
  process.env.GEMINI_API_KEY ??= env.GEMINI_API_KEY;
  process.env.GEMINI_MODEL ??= env.GEMINI_MODEL;
  for (const name of ["VITE_SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "EMAIL_FROM", "SITE_URL", "CRON_SECRET"] as const) {
    process.env[name] ??= env[name];
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), vercelApiInDev(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
