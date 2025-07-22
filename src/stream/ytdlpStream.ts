import { Stream } from "./stream.interface";
import { Writable, Readable,  } from "stream";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

export class YtdlpStream implements Stream {
    private childProcess: ChildProcessWithoutNullStreams;
    public stdout: Readable;
    public stdin: Writable;

    constructor(url: string) {
        const args = [
            "-o", '-', 
            "-x",
            "-q",
            "--audio-format", "opus", 
            "--buffer-size", "32K",
            "--restrict-filenames",
            "-f", "bestaudio",
            "--cookies", "cookies.txt",
            "--no-sponsorblock",
        ];

        args.push(url);
        this.childProcess = spawn("yt-dlp", args);

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
