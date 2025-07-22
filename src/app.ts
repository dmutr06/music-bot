import { Client, Events, GatewayIntentBits } from "discord.js";

import type { ILogger } from "./logger/logger.interface";
import type { ICommandsHandler } from "./commands/commandsHandler.interface";

export class App {
    client: Client;

    public constructor(
        private logger: ILogger,
        private handler: ICommandsHandler,
    ) {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds, 
                GatewayIntentBits.MessageContent, 
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
            ], 
        });

        this.client.once(Events.ClientReady, ctx => {
            this.logger.info(`${ctx.user.username} is ready`);
        });

        this.client.on(Events.MessageCreate, this.handler.handleCommand.bind(this.handler));
    }

    public async run(token: string) {
        await this.client.login(token);
    }
}

