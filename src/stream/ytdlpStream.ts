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
            "--buffer-size", "32K",
            "--restrict-filenames",
            "-f", "bestaudio",
            url
        ]);

        this.stdin = this.childProcess.stdin;
        this.stdout = this.childProcess.stdout;

        this.childProcess.stderr.on("data", err => {
            console.log(String(err));
        });
    }
    
    public destroy(): void {
        this.childProcess.stdout.unpipe();
        this.childProcess.kill();
    }
}
