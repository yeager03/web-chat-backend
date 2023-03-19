type Data = {
	[field: string]: any;
};

export default (data: Data, fields: string[], trim: boolean = false): Data => {
	return fields.reduce((result, field) => {
		if (data[field]) {
			result[field] = trim ? data[field].trim() : data[field];
		}
		return result;
	}, {} as Data);
};
