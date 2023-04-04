interface IUserDto {
	_id: string;
	email: string;
	fullName: string;
	avatar: string | null;
	avatarColors: {
		color: string;
		lighten: string;
	};
	lastVisit: Date;
	isOnline: boolean;
}

export default class UserDto {
	public _id: string;
	public email: string;
	public fullName: string;
	public avatar: string | null;
	public avatarColors: {
		color: string;
		lighten: string;
	};
	public lastVisit: Date;
	public isOnline: boolean;

	constructor(model: IUserDto) {
		this._id = model._id;
		this.email = model.email;
		this.fullName = model.fullName;
		this.avatar = model.avatar;
		this.avatarColors = model.avatarColors;
		this.lastVisit = model.lastVisit;
		this.isOnline = model.isOnline;
	}
}
