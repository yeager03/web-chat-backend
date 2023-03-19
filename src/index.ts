import express, { Express } from "express";

// http
import http, { Server } from "http";

// socket
import { Server as SocketServer } from "socket.io";

// cors
import cors from "cors";

// cookie
import cookieParser from "cookie-parser";

// core
import database from "./core/database.js";
import socket from "./core/socket.js";

// dotenv
import { config } from "dotenv";

// routes
import userRoutes from "./routes/user.js";
import dialogueRoutes from "./routes/dialogue.js";
import messageRoutes from "./routes/message.js";

config();

const app: Express = express();
const server: Server = http.createServer(app);
const io: SocketServer = new SocketServer(server, {
	cors: {
		origin: process.env.CLIENT_URL,
	},
});

// port
const PORT = process.env.PORT || 3001;

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
	})
);

/* routes */
app.use("/user", userRoutes);
app.use("/dialogue", dialogueRoutes);
app.use("/message", messageRoutes);

const start = async () => {
	try {
		database();
		socket(io);

		app.set("io", io);

		server.listen(PORT, () => {
			console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
		});
	} catch (error) {
		console.log(error);
	}
};

start();
