import { Stream } from "./stream.interface";
import { Writable, Readable,  } from "stream";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

export class YtdlpStream implements Stream {
    private childProcess: ChildProcessWithoutNullStreams;
    public stdout: Readable;
    public stdin: Writable;

    constructor(url: string) {
        this.childProcess = spawn("yt-dlp", [
            "-o", '-', 
            "-x",
            "-q",
            "--audio-format", "opus", 
            "-f", "bestaudio",
            url,
        ]);

        this.stdin = this.childProcess.stdin;
        this.stdout = this.childProcess.stdout;
    }
    
    public destroy(): void {
        this.childProcess.kill();
    }
}
