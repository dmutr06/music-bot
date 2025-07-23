import { spawn } from "child_process";
import { TrackInfo } from "../types";

export class YoutubeService {
    static spawnYtdlp(url: string) {
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
        const childProcess = spawn("yt-dlp", args);
        // childProcess.stderr.on("data", err => {
        //     console.log(String(err));
        // });
        
        return childProcess;
    }

    static fetchTrackInfo(query: string): Promise<TrackInfo> {
        return new Promise((resolve, reject) => {
            const ytdlp = spawn(
                "yt-dlp",
                [
                    "--skip-download", 
                    "-j", 
                    "--default-search", "ytsearch",
                    query,
                ],
            );

            let json = "";

            ytdlp.stdout.on("data", (chunk) => {
                json += String(chunk);
            });

            ytdlp.on("close", code => {
                if (code != 0) return reject(new Error("yt-dlp could not fetch info"));

                try {
                    const data = JSON.parse(json);

                    const info: TrackInfo = {
                        id: data.id,
                        title: data.title,
                        duration: data.duration,
                        uploader: data.uploader,
                        webpage_url: data.webpage_url,
                        thumbnail: data.thumbnail,
                    }

                    resolve(info);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
}
