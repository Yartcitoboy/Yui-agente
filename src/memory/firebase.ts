import admin from "firebase-admin";
import { envInfo } from "../config.js";

interface MessageRow {
    userId: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
}

// Ensure GOOGLE_APPLICATION_CREDENTIALS points to the service account JSON
// Admin SDK automatically uses this environment variable for initialization
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: "yui-agent" // Match the project ID from the service account
});

const db = admin.firestore();

/**
 * Saves a message to Firestore
 */
export async function saveMessage(userId: string, role: "user" | "assistant" | "system", content: string): Promise<void> {
    const messageDoc = db.collection("users").doc(userId).collection("messages").doc();
    await messageDoc.set({
        userId,
        role,
        content,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
}

/**
 * Retrieves the message history for a given user, ordered by timestamp
 * @param userId - Real user id
 * @param limit - Maximum number of messages to retrieve, defaults to 20
 */
export async function getHistory(userId: string, limit: number = 20): Promise<MessageRow[]> {
    const snapshot = await db.collection("users").doc(userId).collection("messages")
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get();

    const messages: MessageRow[] = [];
    snapshot.forEach((doc: any) => {
        const data = doc.data();
        messages.push({
            userId: data.userId,
            role: data.role as "user" | "assistant" | "system",
            content: data.content,
            // Convert Firestore timestamp to JS milliseconds, fallback to Date.now() if pending
            timestamp: data.timestamp ? data.timestamp.toMillis() : Date.now()
        });
    });

    // Reverse the results to get chronological order for the LLM
    return messages.reverse();
}

/**
 * Clears the history for a given user
 */
export async function clearHistory(userId: string): Promise<void> {
    const messagesRef = db.collection("users").doc(userId).collection("messages");
    const snapshot = await messagesRef.get();
    
    // Batch delete for efficiency
    const batch = db.batch();
    snapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
    });
    
    if (snapshot.docs.length > 0) {
        await batch.commit();
    }
}
