import type { Readable } from "stream";

export interface Stream {
    getStdout: () => Readable,
    destroy: () => void,
}
