import { Server } from "socket.io";

const connections = {};
const messages = {};
const timeOnline = {};
const roomParticipants = {};
const socketRoomMap = {};

const getRoomParticipants = (roomId) => roomParticipants[roomId] || [];
const buildChatPayload = (payload, sender, socketId) => ({
    sender,
    socketId,
    type: payload?.type || "text",
    text: payload?.text || "",
    fileName: payload?.fileName || "",
    fileType: payload?.fileType || "",
    fileData: payload?.fileData || "",
    sentAt: new Date().toISOString()
});

const emitRoomState = (io, roomId) => {
    const participants = getRoomParticipants(roomId);
    const host = participants[0] || null;

    participants.forEach((participant) => {
        io.to(participant.socketId).emit("room-state", {
            hostId: host?.socketId || null,
            participants
        });
    });
};

const findMatchingRoom = (socketId) => socketRoomMap[socketId] || "";

export const connectToSocket = (server, allowedOrigins = ["http://localhost:3000"]) => {
    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("SOMETHING CONNECTED");

        socket.on("join-call", (path, username = "Guest") => {
            if (connections[path] === undefined) {
                connections[path] = [];
            }

            if (roomParticipants[path] === undefined) {
                roomParticipants[path] = [];
            }

            socket.join(path);
            connections[path].push(socket.id);
            roomParticipants[path].push({
                socketId: socket.id,
                username,
                handRaised: false
            });

            socketRoomMap[socket.id] = path;
            timeOnline[socket.id] = new Date();

            for (let index = 0; index < connections[path].length; index += 1) {
                io.to(connections[path][index]).emit("user-joined", socket.id, connections[path]);
            }

            emitRoomState(io, path);

            if (messages[path] !== undefined) {
                for (let index = 0; index < messages[path].length; index += 1) {
                    io.to(socket.id).emit("chat-message", messages[path][index]);
                }
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (payload, sender = "Guest") => {
            const matchingRoom = findMatchingRoom(socket.id);

            if (matchingRoom) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }

                const chatPayload = buildChatPayload(payload, sender, socket.id);
                messages[matchingRoom].push(chatPayload);
                console.log("message", matchingRoom, ":", sender, chatPayload.type);

                connections[matchingRoom].forEach((participantSocketId) => {
                    io.to(participantSocketId).emit("chat-message", chatPayload);
                });
            }
        });

        socket.on("toggle-hand-raise", ({ raised, username }) => {
            const matchingRoom = findMatchingRoom(socket.id);
            if (!matchingRoom || !roomParticipants[matchingRoom]) {
                return;
            }

            roomParticipants[matchingRoom] = roomParticipants[matchingRoom].map((participant) =>
                participant.socketId === socket.id
                    ? { ...participant, username: username || participant.username, handRaised: raised }
                    : participant
            );

            io.to(matchingRoom).emit("hand-raise-updated", {
                socketId: socket.id,
                username,
                raised
            });
            emitRoomState(io, matchingRoom);
        });

        socket.on("mute-all", () => {
            const matchingRoom = findMatchingRoom(socket.id);
            const participants = getRoomParticipants(matchingRoom);
            if (!matchingRoom || participants[0]?.socketId !== socket.id) {
                return;
            }

            participants.forEach((participant) => {
                io.to(participant.socketId).emit("mute-all");
            });
        });

        socket.on("kick-user", ({ targetSocketId }) => {
            const matchingRoom = findMatchingRoom(socket.id);
            const participants = getRoomParticipants(matchingRoom);
            if (!matchingRoom || participants[0]?.socketId !== socket.id) {
                return;
            }

            if (targetSocketId && targetSocketId !== socket.id) {
                io.to(targetSocketId).emit("kicked");
            }
        });

        socket.on("disconnect", () => {
            const roomId = findMatchingRoom(socket.id);

            if (roomId && connections[roomId]) {
                connections[roomId].forEach((participantSocketId) => {
                    io.to(participantSocketId).emit("user-left", socket.id);
                });

                connections[roomId] = connections[roomId].filter((participantSocketId) => participantSocketId !== socket.id);
                roomParticipants[roomId] = getRoomParticipants(roomId).filter((participant) => participant.socketId !== socket.id);

                if (connections[roomId].length === 0) {
                    delete connections[roomId];
                    delete roomParticipants[roomId];
                    delete messages[roomId];
                } else {
                    emitRoomState(io, roomId);
                }
            }

            delete socketRoomMap[socket.id];
            delete timeOnline[socket.id];
        });
    });

    return io;
};
