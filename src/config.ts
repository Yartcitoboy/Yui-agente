import { config } from "dotenv";

// Load environment variables from .env file
config();

function getEnvVar(key: string, required: boolean = true): string {
    const value = process.env[key];
    if (required && !value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || "";
}

export const envInfo = {
    TELEGRAM_BOT_TOKEN: getEnvVar("TELEGRAM_BOT_TOKEN"),
    TELEGRAM_ALLOWED_USER_IDS: getEnvVar("TELEGRAM_ALLOWED_USER_IDS").split(",").map(id => id.trim()),
    GROQ_API_KEY: getEnvVar("GROQ_API_KEY"),
    OPENROUTER_API_KEY: getEnvVar("OPENROUTER_API_KEY", false),
    OPENROUTER_MODEL: getEnvVar("OPENROUTER_MODEL", false) || "openrouter/free",
    DB_PATH: getEnvVar("DB_PATH", false) || "./memory.db",
    ELEVENLABS_API_KEY: getEnvVar("ELEVENLABS_API_KEY", false),
    ELEVENLABS_VOICE_ID: getEnvVar("ELEVENLABS_VOICE_ID", false) || "EXAVITQu4vr4xnSDxMaL", // Bella by default
};
