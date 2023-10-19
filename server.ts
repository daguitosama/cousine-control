import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import { createRequestHandler } from "@remix-run/express";
import { broadcastDevReady, installGlobals } from "@remix-run/node";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import sourceMapSupport from "source-map-support";
import new_db_connection from "./db";
import postgres from "postgres";
import { session_storage } from "~/util/auth.server";
import env from "~/util/env.server";

sourceMapSupport.install();
installGlobals();

/** @typedef {import('@remix-run/node').ServerBuild} ServerBuild */

const BUILD_PATH = path.resolve("build/index.js");
const VERSION_PATH = path.resolve("build/version.txt");

const sql = new_db_connection(env().DB_URL);

declare module "@remix-run/server-runtime" {
    interface AppLoadContext {
        sql: postgres.Sql;
        session_storage: typeof session_storage;
    }
}

//

const initialBuild = await reimportServer();
const remixHandler =
    process.env.NODE_ENV === "development"
        ? await createDevRequestHandler(initialBuild)
        : createRequestHandler({
              build: initialBuild,
              mode: initialBuild.mode,
              getLoadContext() {
                  return {
                      sql,
                      session_storage,
                  };
              },
          });

const app = express();

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// Remix fingerprints its assets so we can cache forever.
app.use("/build", express.static("public/build", { immutable: true, maxAge: "1y" }));

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("public", { maxAge: "1h" }));

app.use(morgan("tiny"));

app.all("*", remixHandler);

const port = process.env.PORT || 3000;
app.listen(port, async () => {
    console.log(`Express server listening on port ${port}`);

    if (process.env.NODE_ENV === "development") {
        broadcastDevReady(initialBuild);
    }
});

/**
 * @returns {Promise<ServerBuild>}
 */
async function reimportServer() {
    const stat = fs.statSync(BUILD_PATH);

    // convert build path to URL for Windows compatibility with dynamic `import`
    const BUILD_URL = url.pathToFileURL(BUILD_PATH).href;

    // use a timestamp query parameter to bust the import cache
    return import(BUILD_URL + "?t=" + stat.mtimeMs);
}

/**
 * @param {ServerBuild} initialBuild
 * @returns {Promise<import('@remix-run/express').RequestHandler>}
 */
async function createDevRequestHandler(initialBuild: any) {
    let build = initialBuild;
    async function handleServerUpdate() {
        // 1. re-import the server build
        build = await reimportServer();
        // 2. tell Remix that this app server is now up-to-date and ready
        broadcastDevReady(build);
    }
    const chokidar = await import("chokidar");
    chokidar
        .watch(VERSION_PATH, { ignoreInitial: true })
        .on("add", handleServerUpdate)
        .on("change", handleServerUpdate);

    // wrap request handler to make sure its recreated with the latest build for every request
    return async (
        req: express.Request,
        res: express.Response<any, Record<string, any>>,
        next: (arg0: unknown) => void
    ): Promise<void> => {
        try {
            return createRequestHandler({
                build,
                mode: "development",
                getLoadContext() {
                    return {
                        sql,
                        session_storage,
                    };
                },
            })(req, res, next);
        } catch (error) {
            next(error);
        }
    };
}
