import { Stream } from "./stream.interface";
import { Writable, Readable,  } from "stream";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

export class FfmpegStream implements Stream {
    private childProcess: ChildProcessWithoutNullStreams;
    public stdout: Readable;
    public stdin: Writable;

    constructor(args: string[], private stream: Stream) {
        this.childProcess = spawn("ffmpeg", [
            "-i", "pipe:0",
            args.length > 0 ? "-af" : null,
            args.length > 0 ? args[0] : null,
            "-f", "opus",
            "pipe:1"
        ].filter(el => el != null));

        this.stdin = this.childProcess.stdin;
        this.stdout = this.childProcess.stdout;

        stream.stdout.pipe(this.stdin);
    }
    
    public destroy(): void {
        this.childProcess.kill();
        this.stream.destroy();
    }
}
