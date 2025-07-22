import { Stream } from "./stream.interface";
import { Readable } from "stream";
import { createReadStream, PathLike } from "fs";

export class CachedStream implements Stream {
    public stdout: Readable;

    constructor(path: PathLike) {
        this.stdout = createReadStream(path);
    }
    
    public destroy(): void {
        this.stdout.destroy();
    }
}
