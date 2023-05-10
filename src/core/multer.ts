// multer
import fileMulter from "multer";

// path
import path from "path";

// fs
import fs from "fs";

const validationRegExps = {
  image: /image\/(png|jpg|jpeg|svg|web|gif|jfif)/gm,
  audio:
    /audio\/(mp3|mpeg|wav|wma|aac|flac|ogg|m4a|aiff|alac|amr|ape|au|mpc|tta|wv|opus|webm)/gm,
};

const multer = (fileDirName: string) => {
  const storage = fileMulter.diskStorage({
    destination: (req, file, cb) => {
      const dirName = path.join(path.resolve(), `uploads/${fileDirName}`);

      if (!fs.existsSync(dirName)) {
        fs.mkdir(dirName, { recursive: true }, (err) => {
          if (err) throw new Error(err.message);
          cb(null, dirName);
        });
      } else {
        cb(null, dirName);
      }
    },
    filename: (req, file, cb) => {
      const fileName = file.originalname.split(".").slice(0, -1).join(".");
      const ext = file.mimetype.split("/")[1];
      cb(null, `${fileName}-${Date.now()}.${ext}`);
    },
  });

  return fileMulter({
    storage,
    limits: { fileSize: 10000000 },
    fileFilter(req, file, cb) {
      const fileType = file.mimetype.split("/")[0];

      switch (fileType) {
        case "image":
          if (!file.mimetype.match(validationRegExps.image)) {
            return cb(
              new Error(
                "Пожалуйста, загрузите действительный файл с изображением!"
              )
            );
          }
          cb(null, true);
          break;
        case "audio":
          if (!file.mimetype.match(validationRegExps.audio)) {
            return cb(
              new Error("Пожалуйста, загрузите действительный файл с аудио!")
            );
          }
          cb(null, true);
          break;
      }
    },
  });
};

export default multer;
