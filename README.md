# music-bot

A simple Discord music bot written in Node.js using Discord.js and @discordjs/voice. Streams music from YouTube using yt-dlp and ffmpeg.

To install dependencies:
```bash
\# apt install -y ffmpeg libopus-dev
```

Also you need to install yt-dlp, for example, via pip

```bash
$ npm install
```

Create .env and add DISCORD_TOKEN var:

```bash
DISCORD_TOKEN = <YOUR_TOKEN>
```

To run in dev mode:

```bash
$ npm run dev
```

To build:

```bash
$ npm run build
```

To run in prod mode:

```bash
$ npm start
```
