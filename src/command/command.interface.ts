interface RawOption {
    type: "string" | "boolean";
    value: string | boolean,
}

export interface StringOption extends RawOption {
    type: "string",
    value: string,
}

export interface BooleanOption extends RawOption {
    type: "boolean",
    value: boolean,
}

export type Option = StringOption | BooleanOption; 

export interface Command {
    cmd: string,
    args: Array<string>,
}
