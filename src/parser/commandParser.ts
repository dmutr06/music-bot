import { injectable } from "inversify";
import type { IParser } from "./parser.interface";

const PREFIX = "!";

@injectable()
export class CommandParser implements IParser {
    parse(raw: string): { cmd: string; rest: string; } | null {
        if (!raw || !raw.startsWith(PREFIX)) return null;

        raw = raw.slice(PREFIX.length);
        const sep = raw.indexOf(" ");

        let rest;
        let cmd;

        if (sep < 0) {
            cmd = raw;
            rest = "";
        } else {
            cmd = raw.slice(0, sep); 
            rest = raw.slice(sep + 1);
        }


        return { cmd, rest };
    }
}

