import Groq from "groq-sdk";
import { envInfo } from "../config.js";
import { availableTools } from "../tools/registry.js";

// Initialize Groq client
const groq = new Groq({
    apiKey: envInfo.GROQ_API_KEY
});

// Optionally setup OpenRouter as fallback
let openRouter: Groq | null = null;
console.log("=== ELEVENLABS DEBUG ===");
console.log("Key found:", !!envInfo.ELEVENLABS_API_KEY);
console.log("Key value:", envInfo.ELEVENLABS_API_KEY);
console.log("========================");

if (envInfo.OPENROUTER_API_KEY) {
    // OpenRouter uses the OpenAI SDK wire protocol, which is compatible with Groq SDK
    // But for simplicity, we can fetch directly or use a compatible client.
    // Using simple fetch for OpenRouter fallback since Groq client might be strict with endpoints
}

import * as fs from "fs";
import { ElevenLabsClient } from "elevenlabs";

// Initialize ElevenLabs if configured
let elevenlabs: ElevenLabsClient | null = null;
if (envInfo.ELEVENLABS_API_KEY) {
    elevenlabs = new ElevenLabsClient({ apiKey: envInfo.ELEVENLABS_API_KEY });
}

export async function transcribeAudio(filePath: string): Promise<string> {
    try {
        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-large-v3",
            prompt: "Please transcribe the audio into Spanish. Please ignore any silence.",
            response_format: "json",
            language: "es", // Specify Spanish explicitly
            temperature: 0.0
        });
        return transcription.text;
    } catch (error) {
        console.error("Groq Transcription error:", error);
        throw new Error("No pude transcribir el audio, lo siento.");
    }
}

export async function generateAudio(text: string, outputPath: string): Promise<void> {
    const apiKey = envInfo.ELEVENLABS_API_KEY;
    const voiceId = envInfo.ELEVENLABS_VOICE_ID;

    if (!apiKey) {
        throw new Error("ElevenLabs API key is not configured");
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
            output_format: "mp3_44100_128",
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("ElevenLabs HTTP error:", response.status, errorBody);
        throw new Error(`ElevenLabs error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
}

export type LLMMessage = {
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    name?: string;
    tool_calls?: any[];
    tool_call_id?: string;
};

export async function callLLM(messages: LLMMessage[]): Promise<any> {
    try {
        const response = await groq.chat.completions.create({
            messages: messages as any, // Cast to any to bypass strict SDK types when passing internal schema
            model: "llama-3.3-70b-versatile", // Free powerful model on Groq
            temperature: 0.7,
            tools: availableTools as any,
            tool_choice: "auto",
            max_tokens: 2000
        });

        return response.choices[0].message;
    } catch (error) {
        console.error("Groq API error:", error);

        // Basic OpenRouter fallback if configured
        if (envInfo.OPENROUTER_API_KEY) {
            console.log("Attempting OpenRouter fallback...");
            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${envInfo.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://localhost", // Required by OpenRouter ideally
                        "X-Title": "OpenGravity Yui" // Optional
                    },
                    body: JSON.stringify({
                        model: envInfo.OPENROUTER_MODEL,
                        messages: messages.map(m => {
                            // Strip non-standard fields for generic API
                            const { role, content, name, tool_calls, tool_call_id } = m;
                            return { role, content, name, tool_calls, tool_call_id };
                        }),
                        temperature: 0.7,
                        tools: availableTools,
                        tool_choice: "auto",
                    })
                });

                if (!response.ok) {
                    throw new Error(`OpenRouter error: ${response.statusText}`);
                }

                const data = await response.json();
                return data.choices[0].message;
            } catch (fallbackError) {
                console.error("OpenRouter fallback failed:", fallbackError);
                throw fallbackError;
            }
        }

        throw error;
    }
}

