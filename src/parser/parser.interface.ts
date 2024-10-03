

export interface IParser {
    parse(raw: string): { cmd: string, args: string[] } | null;
}
