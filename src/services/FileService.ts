// fs
import fs from "fs";

// path
import path from "path";

// model
import FileModel, { IFile } from "../models/FileModel.js";

class FileService {
  public async createFile(
    files: any,
    author: string,
    fileDirName: string,
    messageId: string | null = null,
    dialogueId: string | null = null
  ) {
    const uploadedFilesId: IFile[] = [];

    for (let key in files) {
      const file = files[key];

      const oldPath = file.path;

      const newPathDir = path.join(
        path.resolve(),
        `uploads/${fileDirName}/${dialogueId}/`
      );
      const newPath = `${newPathDir}/${file.filename}`;

      if (!fs.existsSync(newPathDir)) {
        fs.mkdir(newPathDir, { recursive: true }, (err) => {
          if (err) throw new Error(err.message);
        });
      }

      fs.rename(oldPath, newPath, async (err) => {
        if (err) throw new Error(err.message);
      });

      const fileName = file.originalname;
      const filePath = newPath;
      const size = file.size;
      const url = `${process.env.API_URL}/uploads/${fileDirName}/${dialogueId}/${file.filename}`;
      const type = file.mimetype.split("/")[0];
      const extension = file.mimetype.split("/")[1];

      const uploadedFile = new FileModel({
        fileName,
        filePath,
        size,
        url,
        type,
        extension,
        author,
        message: messageId,
      });

      await uploadedFile.save();
      uploadedFilesId.push(uploadedFile._id);
    }

    return uploadedFilesId;
  }

  public async removeFile(author: string, message: string | null = null) {
    const files = await FileModel.find({ author, message })
      .lean()
      .select("filePath");

    files.forEach((file) => {
      fs.unlink(path.resolve(file.filePath), (err) => console.log(err));
    });

    await FileModel.deleteMany({ message, author });
  }
}

export default new FileService();
