import { Server as SocketServer, Socket } from "socket.io";

// model
import UserModel from "../models/UserModel.js";

// types
import { IMessage } from "../models/MessageModel.js";

type Typing = {
  flag: boolean;
  currentDialogueId: string;
  interlocutorId: string;
};

type MessageRead = {
  dialogueId: string;
  message: IMessage;
};

export default (io: SocketServer): void => {
  io.on("connection", async (socket: Socket) => {
    const user_id = socket.handshake.query["user_id"];

    if (!Boolean(user_id)) {
      throw new Error(`Не корректный id:${user_id}`);
    }

    console.log(
      `User with id:${user_id} connected. His socket_id:${socket.id}`
    );

    const emitEventToFriends = (
      friends: { _id: string; socket_id: string }[],
      ev_name: string
    ) => {
      for (let i = 0; i < friends.length; i++) {
        const { socket_id } = friends[i];

        if (socket_id) {
          io.to(socket_id).emit(ev_name, user_id);
        }
      }
    };

    const user = await UserModel.findById(user_id)
      .select("_id isOnline socket_id friends")
      .populate([
        {
          path: "friends",
          select: "_id socket_id",
        },
      ]);

    if (!user) {
      throw new Error(`User with id:${user_id} not found!`);
    }

    user.socket_id = socket.id;
    user.isOnline = true;

    await user.save();

    const friends = user.friends;
    emitEventToFriends(friends, "SERVER:FRIEND_ONLINE");

    socket.on("CLIENT:JOIN_ROOM", async (dialogueId: string) => {
      socket.join(dialogueId);
      console.log(`User with id:${socket.id} joined to room:${dialogueId}`);
    });

    socket.on("CLIENT:LEAVE_ROOM", async (dialogueId: string) => {
      socket.leave(dialogueId);
      console.log(`User with id:${socket.id} left from room:${dialogueId}`);
    });

    socket.on("CLIENT:MESSAGE_TYPING", async (data: Typing) => {
      socket.to(data.currentDialogueId).emit("SERVER:TYPING_RESPONSE", data);
    });

    socket.on("logout", async () => {
      user.isOnline = false;
      await user.save();

      emitEventToFriends(friends, "SERVER:FRIEND_OFFLINE");

      socket.disconnect();
      console.log(`User logged out ${socket.id}`);
    });

    socket.on("disconnect", async () => {
      user.isOnline = false;
      await user.save();

      emitEventToFriends(friends, "SERVER:FRIEND_OFFLINE");

      socket.disconnect();
      console.log(`User disconnected ${socket.id}`);
    });
  });
};
