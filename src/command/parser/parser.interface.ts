import type { Command } from "../command.interface";


export interface CommandParser {
    parse: (input: string) => Command | null,
}
