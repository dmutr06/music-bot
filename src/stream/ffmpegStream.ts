import { Stream } from "./stream.interface";
import { Writable, Readable,  } from "stream";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

export class FfmpegStream implements Stream {
    private childProcess: ChildProcessWithoutNullStreams;
    public stdout: Readable;
    public stdin: Writable;

    constructor(args: string | null, private stream: Stream) {
        this.childProcess = spawn("ffmpeg", [
            "-analyzeduration", "0",
            "-probesize", "32k",
            "-i", "pipe:0",
            args ? "-af" : null,
            args ? args : null,
            "-fflags", "+nobuffer",
            "-vn",
            "-threads", "1",
            "-b:a", "96k",
            "-f", "opus",
            "pipe:1"
        ].filter(el => el != null));

        this.stdin = this.childProcess.stdin;
        this.stdout = this.childProcess.stdout;

        this.childProcess.stderr.on("data", (chunk) => {
            const msg = String(chunk);
            if (msg.includes("Conversion failed!")) {
                this.destroy();
            }
        });

        this.stream.stdout?.pipe(this.stdin);
    }
    
    public destroy(): void {
        this.stdout.unpipe();
        this.stdin.destroy();
        this.childProcess.kill();
        this.stream.destroy();
    }
}
