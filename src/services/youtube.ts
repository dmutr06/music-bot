import { spawn } from "child_process";
import { PlaylistInfo, TrackInfo } from "../types";

type Info = { type: "video", trackInfo: TrackInfo } | { type: "playlist", playlistInfo: PlaylistInfo };

export class YoutubeService {
    static spawnYtdlp(url: string) {
        const args = [
            "-o", '-', 
            "-x",
            "-q",
            "--buffer-size", "32K",
            "-f", "bestaudio",
            "--cookies", "cookies.txt",
            "--no-sponsorblock",
            "--hls-use-mpegts",
        ];

        args.push(url);
        const childProcess = spawn("yt-dlp", args);
        // childProcess.stderr.on("data", err => {
        //     console.log(String(err));
        // });
        
        return childProcess;
    }

    static fetchInfo(query: string): Promise<Info> {
        return new Promise<Info>((resolve, reject) => {
            const args = [
                    "--skip-download", 
            ];

            try {
                const url = new URL(query);

                if (url.searchParams.has("list")) {
                    args.push("-J", "--flat-playlist");
                } else {
                    args.push("-j");
                }
            } catch (e) {
                args.push("-j", "--default-search", "ytsearch");
            }

            args.push(query);
            const ytdlp = spawn(
                "yt-dlp",
                args,
            );

            let json = "";

            ytdlp.stdout.on("data", (chunk) => {
                json += String(chunk);
            });

            ytdlp.on("close", code => {
                if (code != 0) return reject(new Error("yt-dlp could not fetch info"));

                try {
                    const data = JSON.parse(json);

                    console.log(data._type);
                    switch (data._type) {
                        case "video": {
                            resolve({ type: "video", trackInfo: data });
                            break;
                        }

                        case "playlist": {
                            resolve({ type: "playlist", playlistInfo: {
                                title: data.title,
                                entries: data.entries.map((entry: any) => ({
                                    id: entry.id,
                                    title: entry.title,
                                    webpage_url: entry.url,
                                    uploader: entry.uploader,
                                    thumbnail: entry.thumbnails.at(-1)?.url,
                                }))
                            } });
                            break;
                        }

                        default: throw new Error("Unknown media type");
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
    }
}
