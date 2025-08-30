import WebSocket, { WebSocketServer } from "ws";
import prisma from "../utils/prisma";
import jwt from "jsonwebtoken";
import config from "../config"; // your JWT secret/config

interface IncomingMessage {
    event: string;
    payload: any;
}

// Map to track which WebSocket belongs to which group
const socketGroups = new Map<WebSocket, string>();

// Map to store user ID for each socket
const socketUsers = new Map<WebSocket, string>();

// Set to track connected admin sockets
export const adminSockets = new Set<WebSocket>();

// Check if a user is admin
const isAdminUser = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user?.role === "SUPER_ADMIN";
};

export default function initWebSocket(server: any) {
    const wss = new WebSocketServer({ server });

    wss.on("connection", async (ws: WebSocket, req) => {
        console.log("🔌 User connected");

        // --- Authenticate socket using token from query params ---
        const token = new URL(req.url!, `http://${req.headers.host}`).searchParams.get("token");

        if (!token) {
            ws.close(1008, "Authentication token required");
            return;
        }

        let userId: string;
        try {
            const decoded = jwt.verify(token, config.jwt.access.secret as string) as { id: string };
            userId = decoded.id;
            socketUsers.set(ws, userId);

            // Check if user is admin
            if (await isAdminUser(userId)) {
                adminSockets.add(ws);
            }

        } catch (err) {
            ws.close(1008, "Invalid token");
            return;
        }

        ws.on("message", async (rawMessage: string) => {
            try {
                const data: IncomingMessage = JSON.parse(rawMessage);
                const { event, payload } = data;

                switch (event) {
                    case "joinGroup": {
                        const { groupId } = payload;
                        if (!groupId) return;

                        const isUserExists = await prisma.user.findUnique({ where: { id: userId } });

                        if (!isUserExists) {
                            ws.send(JSON.stringify({ event: "error", payload: "User does not exist" }));
                            return;
                        }

                        const group = await prisma.group.findUnique({ where: { id: groupId } });

                        if (!group) {
                            ws.send(JSON.stringify({ event: "error", payload: "Group does not exist" }));
                            return;
                        }

                        const membership = await prisma.groupMembership.findUnique({
                            where: { userId_groupId: { userId, groupId } },
                        });

                        if (!membership) {
                            await prisma.groupMembership.create({ data: { userId, groupId } });
                            console.log(`✅ User ${userId} joined group ${groupId} for the first time`);
                            ws.send(JSON.stringify({ event: "joinedGroup", payload: { groupId } }));
                        } else {
                            ws.send(JSON.stringify({ event: "alreadyMember", payload: { groupId } }));
                            console.log(`ℹ️ User ${userId} is already a member of group ${groupId}`);
                        }

                        // Attach socket to the group for messaging
                        socketGroups.set(ws, groupId);
                        break;
                    }

                    // ---------------- ENTER CHAT ----------------
                    case "enterGroupChat": {
                        const { groupId } = payload;
                        if (!groupId) return;

                        socketGroups.set(ws, groupId);
                        console.log(`💬 User ${userId} connected to chat in group ${groupId}`);
                        ws.send(JSON.stringify({ event: "enteredChat", payload: { groupId } }));
                        break;
                    }

                    case "sendMessage": {
                        const { body } = payload;
                        const groupId = socketGroups.get(ws);
                        if (!groupId || !body) return;

                        const membership = await prisma.groupMembership.findUnique({
                            where: { userId_groupId: { userId, groupId } },
                        });

                        if (!membership) {
                            ws.send(JSON.stringify({ event: "error", payload: "You are not a member of this group" }));
                            return;
                        }

                        await prisma.message.create({
                            data: { groupId, senderId: userId, body },
                        });

                        const messages = await prisma.message.findMany({
                            where: { groupId },
                            orderBy: { createdAt: "asc" },
                            include: { sender: { select: { id: true, fullName: true, profilePic: true } } },
                        });

                        for (const [socket, gId] of socketGroups.entries()) {
                            if (gId === groupId && socket.readyState === WebSocket.OPEN) {
                                socket.send(JSON.stringify({ event: "allMessages", payload: messages }));
                            }
                        }
                        break;
                    }

                    case "getAllMessages": {
                        const { groupId } = payload;
                        if (!groupId) {
                            ws.send(JSON.stringify({ event: "error", payload: "GroupId is required" }));
                            return;
                        }

                        const messages = await prisma.message.findMany({
                            where: { groupId },
                            orderBy: { createdAt: "asc" },
                            include: { sender: { select: { id: true, fullName: true, profilePic: true } } },
                        });

                        ws.send(JSON.stringify({ event: "allMessages", payload: messages }));
                        break;
                    }
                }
            } catch (err: unknown) {
                console.error("WebSocket error:", err);
                const message = err instanceof Error ? err.message : String(err);
                ws.send(JSON.stringify({ event: "error", payload: message }));
            }
        });

        ws.on("close", () => {
            socketGroups.delete(ws);
            socketUsers.delete(ws);
            adminSockets.delete(ws);
            console.log("❌ User disconnected");
        });
    });
}
