import { Bot } from "grammy";
import { envInfo } from "../config.js";
import { processUserMessage } from "../agent/agent.js";
import { clearHistory } from "../memory/firebase.js";
import { hydrateFiles, FileFlavor } from "@grammyjs/files";
import { transcribeAudio, generateAudio } from "../llm/client.js";
import * as fs from "fs";
import { InputFile } from "grammy";
import * as path from "path";
import * as os from "os";

// Initialize the Telegram Bot
export const bot = new Bot<FileFlavor<any>>(envInfo.TELEGRAM_BOT_TOKEN);
// Use the files plugin to easily download files
bot.api.config.use(hydrateFiles(bot.token));

// Whitelist Middleware
bot.use(async (ctx, next) => {
    if (!ctx.from) return;
    
    const userId = ctx.from.id.toString();
    if (!envInfo.TELEGRAM_ALLOWED_USER_IDS.includes(userId)) {
        console.warn(`[Security] Unauthorized access attempt from user ID: ${userId}`);
        await ctx.reply("Lo siento, no estás autorizado para interactuar conmigo.");
        return;
    }
    
    // Proceed if authorized
    await next();
});

// Commands
bot.command("start", async (ctx) => {
    await ctx.reply("¡Hola! Soy Yui. ¡Estoy lista para ayudarte en lo que necesites! 😊");
});

bot.command("clear", async (ctx) => {
    const userId = ctx.from!.id.toString();
    await clearHistory(userId);
    await ctx.reply("He borrado nuestro historial de conversación con Firebase. ¡Memoria reiniciada! ✨");
});

// Message handler for text
bot.on("message:text", async (ctx) => {
    const userId = ctx.from!.id.toString();
    const text = ctx.message.text;

    await handleMessageProcessing(ctx, userId, text);
});

// Message handler for voice/audio
bot.on(["message:voice", "message:audio"], async (ctx) => {
    const userId = ctx.from!.id.toString();
    
    // Send a typing action to indicate Yui is thinking/hearing
    await ctx.replyWithChatAction("typing");
    
    try {
        const file = await ctx.getFile();
        if (!file.file_path) {
            throw new Error("No file path found");
        }
        
        // Define temporary path
        const tempFilePath = path.join(os.tmpdir(), `yui_audio_${Date.now()}.ogg`);
        
        // Download file
        await file.download(tempFilePath);
        
        // Let the user know we are transcribing
        // await ctx.reply("He recibido tu audio, estoy escuchándolo... 🎧");
        
        // Transcribe
        const transcribedText = await transcribeAudio(tempFilePath);
        
        // Cleanup temp file
        try { fs.unlinkSync(tempFilePath); } catch (e) { /* ignore */ }
        
        if (!transcribedText || transcribedText.trim() === "") {
            await ctx.reply("Lo siento, no pude entender lo que dijiste en el audio. ¿Podrías repetirlo?");
            return;
        }
        
        // Process as text
        const responseText = await processUserMessage(userId, transcribedText);
        
        // Generate audio response
        await ctx.replyWithChatAction("record_voice");
        
        const responseAudioPath = path.join(os.tmpdir(), `yui_response_${Date.now()}.mp3`);
        await generateAudio(responseText, responseAudioPath);
        
        // Send the voice and the text
        await ctx.replyWithVoice(new InputFile(responseAudioPath), { caption: responseText });
        
        // Cleanup response audio
        try { fs.unlinkSync(responseAudioPath); } catch (e) { /* ignore */ }
        
    } catch (error) {
        console.error(`[Bot Audio Error]`, error);
        await ctx.reply("Ups, tuve un problema intentando escuchar o responder tu mensaje de voz. 😔");
    }
});

// Common processor
async function handleMessageProcessing(ctx: any, userId: string, text: string) {
    // Send a typing action to indicate Yui is thinking
    await ctx.replyWithChatAction("typing");

    try {
        const response = await processUserMessage(userId, text);
        await ctx.reply(response);
    } catch (error) {
        console.error(`[Bot Error]`, error);
        await ctx.reply("Uups... Ocurrió un error mientras intentaba procesar tu mensaje. 😔");
    }
}

// Error handling
bot.catch((err) => {
    console.error("[Bot Error Handler] Grammy error:", err);
});
