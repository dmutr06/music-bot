import { Readable, Writable } from "stream";

export interface Stream {
    stdout?: Readable,
    stdin?: Writable,
    destroy: () => void,
}
