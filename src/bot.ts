import { GatewayIntentBits, Client, Events } from "discord.js";
import type { CommandParser } from "./command/parser/parser.interface";
import type { CommandExecutor } from "./command/executor/executor";


export class Bot {
    private client: Client;

    constructor(private parser: CommandParser, private executor: CommandExecutor) {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildVoiceStates,
            ],
        });

        this.client.once(Events.ClientReady, (ctx) => {
            console.log(`${ctx.user.tag} is connected`);
        });

        this.client.on(Events.MessageCreate, async (ctx) => {
            if (ctx.member?.user.bot) return;
            const cmd = this.parser.parse(ctx.content);
            if (!cmd) return;
            this.executor.execute(ctx, cmd);
        });
    }

    async login(token: string): Promise<void> {
        await this.client.login(token);
    } 
}
