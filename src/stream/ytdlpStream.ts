import { Stream } from "./stream.interface";
import { Writable, Readable,  } from "stream";
import { ChildProcessWithoutNullStreams } from "child_process";
import { YoutubeService } from "../services/youtube";

export class YtdlpStream implements Stream {
    private childProcess: ChildProcessWithoutNullStreams;
    public stdout: Readable;
    public stdin: Writable;

    constructor(url: string) {
        this.childProcess = YoutubeService.spawnYtdlp(url);

        this.stdin = this.childProcess.stdin;
        this.stdout = this.childProcess.stdout;

        this.childProcess.stderr.on("data", err => {
            console.log(String(err));
        });

        this.childProcess.on("exit", (code) => {
            console.log(code);
        });
    }
    
    public destroy(): void {}
}
