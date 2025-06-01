import { collection, deleteDoc, getDoc, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import Task from "../../classes/Task";
import authService from "./AuthService";

class TaskService {
	constructor() {
		this.taskRef = collection(db, "tasks");
	}

	_createTaskInstance(docSnap) {
		if (!docSnap.exists()) {
			console.warn("No Task!");
			return null;
		}

		const data = docSnap.data();
		const id = docSnap.id;

		return new Task(
			id,
			data.name,
			data.description,
			data.dueDate,
			data.priority,
			data.projectId,
			data.isCompleted,
			data.createdAt,
			data.updatedAt,
			data.assignedTo,
			data.createdBy,
			data.sectionId,
			data.subTasksIds,
			data.parentTaskId
		);
	}

	async createNewTask({ name, description, dueDate, priority, projectId, parentTaskId = null, sectionId = null }) {
		try {
			const currentUser = await authService.getCurrentUser();
			if (!currentUser) {
				throw new Error("User not authenticated or missing display name");
			}
			const newDoc = doc(this.taskRef);
			const taskData = {
				name,
				description,
				dueDate,
				priority,
				projectId,
				isCompleted: false,
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
				assignedTo: null,
				createdBy: currentUser.displayName || currentUser.email,
				sectionId,
				subTasksIds: [],
				parentTaskId,
			};
			await setDoc(newDoc, taskData);
			console.log("Task document created:", taskData);
			return this.getTaskById(newDoc.id);
		} catch (error) {
			console.error("Failed to create a new task:", error);
			return { error };
		}
	}

	async getTaskById(id) {
		try {
			const docSnap = await getDoc(doc(this.taskRef, id));
			const task = this._createTaskInstance(docSnap);
			console.log("Task found by id:", docSnap.data());
			return { task };
		} catch (error) {
			console.error("Failed to get task by id:", id, error);
			return { error };
		}
	}

	async updateTask(id, updates) {
		try {
			const docRef = doc(this.taskRef, id);
			const toBeUpdated = {
				...updates,
				updatedAt: serverTimestamp(),
			};
			await updateDoc(docRef, toBeUpdated);
			console.log("Task updated succesfull:", toBeUpdated);
			return { success: true };
		} catch (error) {
			console.error("Failed to update task:", error);
			return { error };
		}
	}

	async setTaskComplete(id) {
		try {
			const docRef = doc(this.taskRef, id);
			const snap = await getDoc(docRef);
			const current = snap.data();
			const toBeUpdated = {
				isCompleted: !current.isCompleted,
				updatedAt: serverTimestamp(),
			};
			await updateDoc(docRef, toBeUpdated);
			console.log("Task isCompleted value changed");
			return { success: true };
		} catch (error) {
			console.error("Error setting the task completion:", error);
			return { error };
		}
	}

	async deleteTask(id) {
		try {
			await deleteDoc(doc(this.taskRef, id));
			console.log("Task deleted with success");
			return { success: true };
		} catch (error) {
			console.error("Failed to delete task:", error);
			return { error };
		}
	}
}

const taskService = new TaskService();
export default taskService;
