// multer
import fileMulter from "multer";

// path
import path from "path";

// fs
import fs from "fs";

const multer = (fileDirName: string) => {
	const storage = fileMulter.diskStorage({
		destination: (req, file, cb) => {
			const dirName = path.join(path.resolve(), `uploads/${fileDirName}`);

			if (!fs.existsSync(dirName)) {
				fs.mkdir(dirName, (err) => console.log("err", err));
			}

			cb(null, dirName);
		},
		filename: (req, file, cb) => {
			const fileName = file.originalname.split(".").slice(0, -1).join(".");
			const ext = file.mimetype.split("/")[1];
			cb(null, `${fileName}-${Date.now()}.${ext}`);
		},
	});

	return fileMulter({
		storage,
		limits: { fileSize: 5000000 },
		fileFilter(req, file, cb) {
			if (!file.originalname.match(/\.(jpe?g|png|gif|bmp|svg|web)$/i)) {
				return cb(new Error("Пожалуйста, загрузите действительный файл изображения"));
			}
			cb(null, true);
		},
	});
};

export default multer;
