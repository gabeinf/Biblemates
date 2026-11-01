import { HELLO } from "@biblemates/shared";
import { Server } from "socket.io"

const io = new Server(3000, { cors: { origin: "*" } }); // initializing the server istelf

const rooms = new Map<string, { hostId: string; members: Set<string> }>(); // initializing the rooms structure

io.on("connection", (socket) => {

  console.log("a phone connected:", socket.id);

  socket.emit("rooms:update", [...rooms.keys()])
  socket.on("room:create", (ack) => {

    const roomId = crypto.randomUUID().slice(0, 6).toUpperCase();
    rooms.set(roomId, { hostId: socket.id, members: new Set([socket.id]) });
    io.emit("rooms:update", [...rooms.keys()])
    socket.join(roomId);
    console.log("room created:", roomId);
    ack({ ok: true, roomId });

  });

  socket.on("disconnect", () => {
    console.log("a phone left:", socket.id);
  });
});

 
console.log("Server is listening on port 3000");