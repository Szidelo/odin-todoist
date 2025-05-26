class Project {
	constructor(id, name, color, userIds = [], isFavoriteBy = [], parentProjectId = null, childProjectIds = [], createAt, updatedAt) {
		this.id = id;
		this.name = name;
		this.color = color;
		this.userIds = userIds; // array of user IDs associated with the project
		this.isFavoriteBy = isFavoriteBy; // array of user IDs who have favorited the project
		this.parentProjectId = parentProjectId; // ID of the parent project, if any
		this.childProjectIds = childProjectIds; // array of IDs of child projects, if any
		this.createAt = createAt; // timestamp of when the project was created, use firestore server timestamp
		this.updatedAt = updatedAt; // timestamp of when the project was last updated, use firestore server timestamp
	}

	getProjectInfo() {
		return {
			id: this.id,
			name: this.name,
			color: this.color,
			userIds: this.userIds,
			isFavoriteBy: this.isFavoriteBy,
			parentProjectId: this.parentProjectId,
			childProjectIds: this.childProjectIds,
			createAt: this.createAt,
			updatedAt: this.updatedAt,
		};
	}

	updateProjectInfo(updates = {}) {
		for (const key in updates) {
			if (Object.prototype.hasOwnProperty.call(this, key)) {
				this[key] = updates[key];
			}
		}
	}
}

export default Project;
