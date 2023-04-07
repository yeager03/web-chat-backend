import { Server as SocketServer, Socket } from "socket.io";

export default (io: SocketServer): void => {
	io.on("connection", (socket: Socket) => {
		console.log("User connected");

		socket.on("typing", (flag: boolean) => {
			socket.broadcast.emit("typingResponse", flag);
		});

		socket.on("disconnect", () => {
			console.log("User disconnected");

			socket.disconnect();
		});
	});
};
