import { ChildProcess, spawn } from "child_process";
import type { Stream } from "./stream.interface";
import type { Readable } from "stream";

export class YtdlpStream implements Stream {
    private childProcess: ChildProcess;

    constructor(url: string) {
        this.childProcess = spawn("yt-dlp", [
            "-x",
            "-q",
            "--audio-format", "opus",
            "-f", "bestaudio",
            "-o", "-",
            url
        ]);
    }

    public getStdout(): Readable {
        if (!this.childProcess.stdout) 
            throw new Error("No stdout in child process");
        return this.childProcess.stdout;
    }

    public destroy(): void {
        this.childProcess.stdout?.unpipe();
        this.childProcess.kill();
    }
}
