import nodemailer, { Transporter } from "nodemailer";
import { config } from "dotenv";

// mail templates
import verify from "../templates/verify.js";

config();

class MailService {
	public transporter: Transporter;

	constructor() {
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT),
			secure: false,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASSWORD,
			},
		});
	}

	public async sendActivationMail(to: string, name: string, link: string) {
		await this.transporter.sendMail({
			from: process.env.SMTP_USER,
			to,
			subject: "Активация аккаунта на WebChat2023",
			text: "",
			html: verify(name, link),
		});
	}
}

export default new MailService();
