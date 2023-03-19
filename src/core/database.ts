// mongoose
import mongoose from "mongoose";

export default async (): Promise<void> => {
	await mongoose.set("strictQuery", false);
	await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/web-chat", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	} as Record<string, boolean>);
};
