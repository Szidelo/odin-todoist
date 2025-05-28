class Task {
	constructor(
		id,
		name,
		description = "",
		dueDate,
		priority = 4,
		projectId = null,
		isCompleted = false,
		createdAt,
		updatedAt,
		assignedTo,
		createdBy,
		taskSectionId = null,
		subTasksIds = [],
		parentTaskId = null
	) {
		this.id = id;
		this.name = name;
		this.description = description;
		this.dueDate = dueDate;
		this.priority = priority;
		this.projectId = projectId;
		this.isCompleted = isCompleted;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.assignedTo = assignedTo;
		this.createdBy = createdBy;
		this.taskSectionId - taskSectionId;
		this.subTasksIds = subTasksIds;
		this.parentTaskId = parentTaskId;
	}

	getTaskInfo() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			dueDate: this.dueDate,
			priority: this.priority,
			projectId: this.projectId,
			isCompleted: this.isCompleted,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
			assignedTo: this.assignedTo,
			createdBy: this.createdBy,
			taskSectionId: this.taskSectionId,
			subTasksIds: this.subTasksIds,
			parentTaskId: this.parentTaskId,
		};
	}

	updateTaskInfo(updates = {}) {
		const updatableFields = [
			"name",
			"description",
			"dueDate",
			"priority",
			"projectId",
			"isCompleted",
			"updatedAt",
			"assignedTo",
			"subTasksIds",
			"parentTaskId",
		];

		for (const key in updates) {
			if (updatableFields.includes(key)) {
				this[key] = updates[key];
			} else {
				console.warn(`Cannot update protected field: ${key}`);
			}
		}
	}
}

export default Task;
