import { webhookCallback } from "grammy";
import { bot } from "../src/bot/bot.js";

// Este archivo es el punto de entrada exclusivo para Vercel.
// Vercel requiere que exportes una función por defecto que maneje la petición HTTP.

export default webhookCallback(bot, "std/http");
