import { config } from "dotenv";
config();

import { App } from "./app";
import { CommandParser } from "./parser/commandParser";
import { CommandsHandler } from "./commands/commandsHandler";
import { Logger } from "./logger/logger";
import { Player } from "./player/player";

async function bootstrap() {
    const logger = new Logger();
    const cmdParser = new CommandParser();
    const player = new Player(logger);
    const commandsHandler = new CommandsHandler(cmdParser, player);

    const app = new App(logger, commandsHandler);

    app.run(process.env.DISCORD_TOKEN!);
}

bootstrap();
