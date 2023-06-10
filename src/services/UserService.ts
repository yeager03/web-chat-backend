// path
import path from "path";

// fs
import fs from "fs";

// model
import UserModel from "../models/UserModel.js";
import DialogueModel from "../models/DialogueModel.js";
import MessageModel from "../models/MessageModel.js";

// service
import mailService from "./MailService.js";
import tokenService from "./TokenService.js";
import fileService from "../services/FileService.js";

// bcrypt
import bcrypt from "bcrypt";

// uuid
import { v4 as uuidv4 } from "uuid";

// utils
import UserDto from "../utils/dtos/UserDto.js";
import getRandomColors from "../utils/generateRandomColors.js";

// types
import { Server as SocketServer } from "socket.io";
import {
  SignUp,
  SignIn,
  FriendRequest,
  FriendRemove,
  EditProfile,
} from "../controllers/UserController.js";

class UserService {
  public async signUp(data: SignUp) {
    const { email, fullName, password } = data;

    const candidate = await UserModel.findOne({ email }).lean();

    if (candidate) {
      throw new Error(`Пользователь с ${email} уже существует`);
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const activationId = uuidv4();
    const activationIdExpires = Date.now() + 10 * 60 * 1000;

    const avatarColors = getRandomColors();

    const user = new UserModel({
      email,
      fullName,
      password: hashPassword,
      activationId,
      activationIdExpires,
      avatarColors,
    });

    await user.save();
    await mailService.sendActivationMail(
      email,
      fullName.split(" ")[0],
      `${process.env.CLIENT_URL}/auth/activate/${activationId}`
    );
  }

  public async signIn(data: SignIn) {
    const { email, password } = data;

    const candidate = await UserModel.findOne({ email });

    if (!candidate) {
      throw new Error("Пользователь не найден");
    }

    const isPassEquals = await bcrypt.compare(password, candidate.password);

    if (!isPassEquals) {
      throw new Error("Неверный пароль, попробуйте снова");
    }

    if (!candidate["isActivated"]) {
      throw new Error("Пожалуйста, подтвердите свою почту");
    }

    if (candidate.avatar) {
      await candidate.populate("avatar", "_id fileName url size extension");
    }

    const userDto = new UserDto(candidate);
    const tokens = tokenService.generateTokens({ ...userDto });

    await tokenService.saveToken(userDto._id, tokens.refreshToken);

    return {
      ...tokens,
      user: userDto,
    };
  }

  public async logout(refreshToken: string) {
    const tokenFromDatabase = await tokenService.findToken(refreshToken);

    if (!tokenFromDatabase) {
      throw new Error("Токен не был найден");
    }

    return tokenService.removeToken(refreshToken);
  }

  public async refreshAccount(refreshToken: string) {
    if (!refreshToken) {
      throw new Error("Пользователь не авторизован");
    }

    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDatabase = await tokenService.findToken(refreshToken);

    if (!userData || !tokenFromDatabase) {
      await tokenService.removeToken(refreshToken);
      throw new Error("Пользователь не авторизован");
    }

    const user = await UserModel.findById(userData._id);

    if (!user) {
      await tokenService.removeToken(refreshToken);
      throw new Error("Пользователь не найден");
    }

    if (user.avatar) {
      await user.populate("avatar", "_id fileName url size extension");
    }

    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });

    await tokenService.saveToken(userDto._id, tokens.refreshToken);

    return {
      ...tokens,
      user: userDto,
    };
  }

  public async findUserByEmail(email: string) {
    const candidate = await UserModel.findOne({ email })
      .lean()
      .select("_id email fullName");

    if (!candidate) {
      throw new Error("Пользователь с таким email не найден");
    }

    return candidate;
  }

  public async activateAccount(activationId: string) {
    const user = await UserModel.findOne({ activationId });

    if (!user) {
      throw {
        status: "error",
        message: "Некорректная ссылка",
      };
    }

    if (user.activationIdExpires && +new Date() > user.activationIdExpires) {
      throw {
        status: "expired",
        message: "Это ссылка больше не действительна",
        email: user.email,
      };
    }

    user.isActivated = true;

    user.activationId = null;
    user.activationIdExpires = null;

    await user.save();
  }

  public async againSendActivateMail(email: string) {
    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new Error("Пользователь с таким email не найден");
    }

    const activationId = uuidv4();
    const activationIdExpires = Date.now() + 10 * 60 * 1000;

    user.activationId = activationId;
    user.activationIdExpires = activationIdExpires;

    await user.save();
    await mailService.sendActivationMail(
      email,
      user.fullName.split(" ")[0],
      `${process.env.CLIENT_URL}/auth/activate/${activationId}`
    );
  }

  public async resetPassword(email: string) {
    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new Error("Пользователь с таким email не найден");
    }

    const passwordResetId = uuidv4();
    const passwordResetIdExpires = Date.now() + 10 * 60 * 1000;

    user.passwordResetId = passwordResetId;
    user.passwordResetIdExpires = passwordResetIdExpires;

    await user.save();
    await mailService.resetPasswordMail(
      email,
      user.fullName.split(" ")[0],
      `${process.env.CLIENT_URL}/auth/password/new/${passwordResetId}`
    );
  }

  public async newPassword(
    method: string,
    passwordResetId: string,
    password: string = ""
  ) {
    const user = await UserModel.findOne({ passwordResetId });

    if (!user) {
      throw {
        status: "error",
        message: "Некорректная ссылка",
      };
    }

    if (
      user.passwordResetIdExpires &&
      +new Date() > user.passwordResetIdExpires
    ) {
      throw {
        status: "expired",
        message: "Это ссылка больше не действительна",
      };
    }

    if (method === "POST") {
      user.password = await bcrypt.hash(password, 10);

      user.passwordResetId = null;
      user.passwordResetIdExpires = null;

      await user.save();
    }
  }

  public async getFriends(userId: string) {
    const user = await UserModel.findById(userId).populate([
      {
        path: "friends",
        select: "_id email fullName avatar avatarColors lastVisit isOnline",
        populate: {
          path: "avatar",
          select: "_id fileName url size extension",
          model: "File",
        },
      },
    ]);

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    return user.friends;
  }

  public async getRequests(userId: string) {
    const user = await UserModel.findById(userId).populate([
      {
        path: "requests",
        select: "_id email fullName avatar avatarColors lastVisit isOnline",
        populate: {
          path: "avatar",
          select: "_id fileName url size extension",
          model: "File",
        },
      },
    ]);

    if (!user) {
      throw new Error("Пользователь не найден");
    }
    return user.requests;
  }

  public async friendRequest(data: FriendRequest, io: SocketServer) {
    const { senderId, recipientId } = data;

    if (senderId === recipientId) {
      throw new Error("Вы не можете отправить заявку самому себе");
    }

    const sender = await UserModel.findOne({ _id: senderId });
    const recipient = await UserModel.findOne({ _id: recipientId });

    if (!sender) {
      throw new Error("Отправитель не найден");
    }

    if (!recipient) {
      throw new Error("Получатель не найден");
    }

    if (recipient.requests.includes(senderId)) {
      throw new Error(
        "Вы уже отправляли заявку этому человеку, дождитесь ее принятия"
      );
    }

    if (recipient.friends.includes(senderId)) {
      throw new Error("Вы уже являетесь друзьями");
    }

    await recipient.updateOne({ $push: { requests: sender } });

    if (sender.avatar) {
      await sender.populate("avatar", "_id fileName url size extension");
    }

    if (recipient.socket_id) {
      io.to(recipient.socket_id).emit(
        "SERVER:NEW_FRIEND_REQUEST",
        recipientId,
        { ...new UserDto(sender) }
      );
    }
  }

  public async acceptRequest(data: FriendRequest, io: SocketServer) {
    const { senderId, recipientId } = data;

    if (senderId === recipientId) {
      throw new Error("Вы не можете добавить самого себя в друзья");
    }

    const recipient = await UserModel.findOne({ _id: recipientId });
    const sender = await UserModel.findOne({ _id: senderId });

    if (!sender) {
      throw new Error("Отправитель не найден");
    }

    if (!recipient) {
      throw new Error("Получатель не найден");
    }

    if (recipient.friends.includes(senderId)) {
      throw new Error("Вы уже являетесь друзьями");
    }

    await recipient
      .updateOne({ $pull: { requests: senderId } })
      .updateOne({ $push: { friends: senderId } });
    await sender.updateOne({ $push: { friends: recipientId } });

    if (recipient.avatar) {
      await recipient.populate("avatar", "_id fileName url size extension");
    }

    if (sender.socket_id) {
      io.to(sender.socket_id).emit("SERVER:NEW_FRIEND_ACCEPT", senderId, {
        ...new UserDto(recipient),
      });
    }
  }

  public async denyRequest(data: FriendRequest) {
    const { senderId, recipientId } = data;

    const recipient = await UserModel.findOne({ _id: recipientId });
    const sender = await UserModel.findOne({ _id: senderId });

    if (!sender) {
      throw new Error("Отправитель не найден");
    }

    if (!recipient) {
      throw new Error("Получатель не найден");
    }

    if (!recipient.requests.includes(senderId)) {
      throw new Error("Отправитель больше не подписан на вас");
    }

    await recipient.updateOne({ $pull: { requests: senderId } });

    return sender.fullName.split(" ")[0];
  }

  public async removeFriend(data: FriendRemove, io: SocketServer) {
    const { authorId, friendId } = data;

    const author = await UserModel.findOne({ _id: authorId });
    const friend = await UserModel.findOne({ _id: friendId });

    const dialogue = await DialogueModel.findOne({
      members: { $all: [authorId, friendId] },
    });

    if (!author) {
      throw new Error("Автор не найден");
    }

    if (!friend) {
      throw new Error("Друг не найден");
    }

    if (
      !author.friends.includes(friendId) &&
      !friend.friends.includes(authorId)
    ) {
      throw new Error("Вы не являетесь друзьями");
    }

    await author.updateOne({ $pull: { friends: friendId } });
    await friend.updateOne({ $pull: { friends: authorId } });

    if (dialogue) {
      await dialogue.deleteOne();
      const messages = await MessageModel.find({ dialogue: dialogue._id });

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];

        if (message.files.length) {
          await fileService.removeFile(authorId, message?._id);
          await fileService.removeFile(friendId, message?._id);
        }
      }

      const dirPath = path.join(
        path.resolve(),
        `uploads/messages/${dialogue._id}/`
      );

      if (fs.existsSync(dirPath)) {
        fs.rmdir(dirPath, (err) => {
          if (err) new Error(err.message);
          console.log("Папка успешно удалена");
        });
      }

      await MessageModel.deleteMany({ dialogue: dialogue._id });
    }

    if (author.socket_id && friend.socket_id) {
      io.to(author.socket_id).emit(
        "SERVER:FRIEND_REMOVE",
        [authorId, friendId],
        dialogue
      );
      io.to(friend.socket_id).emit(
        "SERVER:FRIEND_REMOVE",
        [authorId, friendId],
        dialogue
      );
    }

    return friend.fullName.split(" ")[0];
  }

  public async editProfile(data: EditProfile) {
    const { authorId, fullName, about_me, file } = data;

    const user = await UserModel.findById(authorId);

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    if (file && user.avatar) {
      await fileService.removeFile(authorId);
    }

    if (file && user.avatar) {
      user.avatar = await fileService.createFile([file], authorId, "profile");
    }

    user.fullName = fullName;
    user.about_me = about_me.trim() ? about_me : null;

    await user.save();
    await user.populate("avatar", "_id fileName url size extension");

    const userDto = new UserDto(user);
    return { ...userDto };
  }
}

export default new UserService();
