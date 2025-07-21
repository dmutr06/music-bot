

export interface IParser {
    parse(raw: string): { cmd: string, rest: string; } | null;
}
