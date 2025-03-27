import type { Readable } from "stream";
import type { Stream } from "./stream.interface";
import { type ChildProcess, spawn } from "child_process";


export class FfmpegStream implements Stream {
    private childProcess: ChildProcess;

    public constructor(private stream: Stream, args: Array<string>) {
        this.childProcess = spawn("ffmpeg", [
            "-i", "pipe:0",
            args.length > 0 ? "-af" : null,
            args.length > 0 ? args[0] : null,
            "-f", "opus",
            "pipe:1",
        ].filter(arg => arg != null));

        this.stream.getStdout().pipe(this.childProcess.stdin!);
    }

    public getStdout(): Readable {
        if (!this.childProcess.stdout)
            throw new Error("No stdout in child process");
        return this.childProcess.stdout;
    }

    public destroy(): void {
        this.childProcess.stdout?.unpipe();
        this.stream.destroy();
        this.childProcess.kill("SIGHUP");
    }
}
