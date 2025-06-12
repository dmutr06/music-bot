import { injectable } from "inversify";
import type { IParser } from "./parser.interface";

const PREFIX = "!";

@injectable()
export class CommandParser implements IParser {
    parse(raw: string): { cmd: string; args: string[]; } | null {
        if (!raw) return null;
        const [cmd, ...args] = raw.split(" ");

        if (!cmd.startsWith(PREFIX)) return null;

        return { cmd: cmd.slice(PREFIX.length), args };
    }
}

