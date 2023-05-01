import { Server as SocketServer, Socket } from "socket.io";

// model
import UserModel from "../models/UserModel.js";

type Typing = {
  flag: boolean;
  currentDialogueId: string;
  interlocutorId: string;
};

export default (io: SocketServer): void => {
  io.on("connection", async (socket: Socket) => {
    const user_id = socket.handshake.query["user_id"];

    console.log(`User connected ${socket.id}`);

    if (Boolean(user_id)) {
      await UserModel.findByIdAndUpdate(user_id, {
        socket_id: socket.id,
        isOnline: true,
      });
    }

    socket.on("CLIENT:JOIN_ROOM", async (dialogueId: string) => {
      socket.join(dialogueId);
      console.log(`User with id:${socket.id} joined to room`);
    });

    socket.on("CLIENT:LEAVE_ROOM", async (dialogueId: string) => {
      socket.leave(dialogueId);
      console.log(`User with id:${socket.id} left from room`);
    });

    socket.on("CLIENT:MESSAGE_TYPING", async (data: Typing) => {
      socket
        .to(data.currentDialogueId)
        .timeout(5000)
        .emit("SERVER:TYPING_RESPONSE", data);
    });

    socket.on("logout", async () => {
      await UserModel.findByIdAndUpdate(user_id, {
        isOnline: false,
      });

      socket.disconnect();
      console.log(`User logged out ${socket.id}`);
    });

    socket.on("disconnect", async () => {
      await UserModel.findByIdAndUpdate(user_id, {
        isOnline: false,
      });

      socket.disconnect();
      console.log(`User disconnected ${socket.id}`);
    });
  });
};
