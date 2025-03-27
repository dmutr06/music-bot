import type { Command } from "../command.interface";
import type { CommandParser } from "./parser.interface";


export class PrefixCommandParser implements CommandParser {
    public readonly prefix: string;

    public constructor(prefix: string) {
        this.prefix = prefix;
    }

    public parse(input: string): Command | null  {
        if (!input.startsWith(this.prefix)) return null;
        const rawCmd = input.slice(this.prefix.length);
        const [cmd, ...args] = rawCmd.trim().split(" ");
        return { cmd, args };
    }
}
