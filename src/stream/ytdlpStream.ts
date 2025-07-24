import { Stream } from "./stream.interface";
import { Writable, Readable,  } from "stream";
import { ChildProcessWithoutNullStreams } from "child_process";
import { YoutubeService } from "../services/youtube";

export class YtdlpStream implements Stream {
    private childProcess: ChildProcessWithoutNullStreams;
    public stdout: Readable;
    public stdin: Writable;

    constructor(url: string, private isStream: boolean) {
        this.childProcess = YoutubeService.spawnYtdlp(url);

        this.stdin = this.childProcess.stdin;
        this.stdout = this.childProcess.stdout;

        // this.childProcess.stdout.on("data", (ch) => {
        //     console.log(String(ch));
        // })
    }
    
    public destroy(): void {
        if (this.isStream) {
            this.childProcess.kill("SIGINT");
        }
    }
}
