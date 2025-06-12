import { Container } from "inversify";
import { TYPES } from "./types";

import { App } from "./app";

import type { ILogger } from "./logger/logger.interface";
import { Logger } from "./logger/logger";

import type { IParser } from "./parser/parser.interface";
import { CommandParser } from "./parser/commandParser";

import type { ICommandsHandler } from "./commands/commandsHandler.interface";
import { CommandsHandler } from "./commands/commandsHandler";
import type { IPlayer } from "./player/player.interface";
import { Player } from "./player/player";

const container = new Container();

container.bind<App>(TYPES.App).to(App).inSingletonScope();
container.bind<ILogger>(TYPES.Logger).to(Logger).inSingletonScope();
container.bind<IParser>(TYPES.CommandParser).to(CommandParser).inSingletonScope();
container.bind<ICommandsHandler>(TYPES.CommandsHandler).to(CommandsHandler).inSingletonScope();
container.bind<IPlayer>(TYPES.Player).to(Player).inSingletonScope();

export { container };
