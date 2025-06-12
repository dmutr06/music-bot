import "reflect-metadata";

import { config } from "dotenv";
config();

import type { App } from "./app";
import { container } from "./inversify.config";
import { TYPES } from "./types";

async function bootstrap() {
    const app = container.get<App>(TYPES.App);

    app.run(process.env.DISCORD_TOKEN!);
}

bootstrap();
