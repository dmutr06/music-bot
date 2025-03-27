import { Bot } from "./bot";
import { CommandExecutor } from "./command/executor/executor";
import { PrefixCommandParser } from "./command/parser/parser";
import { Player } from "./player/player";

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error("No token was provided");
    process.exit(1);
}

const bot = new Bot(
    new PrefixCommandParser("!"),
    new CommandExecutor(new Player()))
;

await bot.login(token);
