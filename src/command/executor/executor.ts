import type { Context } from "../../context.type";
import type { Player } from "../../player/player";
import type { Command } from "../command.interface";


export class CommandExecutor {
    public constructor(private player: Player) {}

    public async execute(ctx: Context, cmd: Command): Promise<void> {
        switch (cmd.cmd) {
            case "play": return this.play(ctx, cmd.args);
            case "pause": return this.pause(ctx);
            case "resume": return this.resume(ctx);
            case "skip": return this.skip(ctx);
            case "stop": return this.stop(ctx);
            default: return;
        }
    }

    private async play(ctx: Context, args: Array<string>): Promise<void> {
        return this.player.play(ctx, args); 
    }

    private async stop(ctx: Context): Promise<void> {
        if (!ctx.member?.voice.channel) return;
        return this.player.stop(ctx.member.voice.channel);
    }

    private async skip(ctx: Context): Promise<void> {
        if (!ctx.member?.voice.channel) return;
        return this.player.skip(ctx.member.voice.channel);
    }

    private async pause(ctx: Context): Promise<void> {
        if (!ctx.member?.voice.channel) return;
        return this.player.pause(ctx.member.voice.channel);
    }

    private async resume(ctx: Context): Promise<void> {
        if (!ctx.member?.voice.channel) return;
        return this.player.resume(ctx.member.voice.channel);
    }
}
