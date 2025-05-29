class Section {
	constructor(id, name, order = 0) {
		this.id = id;
		this.name = name;
		this.order = order;
	}

	getInfo() {
		return { id: this.id, name: this.name, order: this.order };
	}
}

export default Section;
