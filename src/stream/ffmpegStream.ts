import { Stream } from "./stream.interface";
import { Writable, Readable,  } from "stream";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

export class FfmpegStream implements Stream {
    private childProcess: ChildProcessWithoutNullStreams;
    public stdout: Readable;
    public stdin: Writable;

    constructor(args: string | null, private stream: Stream) {
        this.childProcess = spawn("ffmpeg", [
            "-i", "pipe:0",
            args ? "-af" : null,
            args ? args : null,
            "-f", "opus",
            "pipe:1"
        ].filter(el => el != null));

        this.stdin = this.childProcess.stdin;
        this.stdout = this.childProcess.stdout;

        stream.stdout?.pipe(this.stdin);
    }
    
    public destroy(): void {
        this.stdin.destroy();
        this.stream.destroy();
        this.childProcess.kill();
    }
}
