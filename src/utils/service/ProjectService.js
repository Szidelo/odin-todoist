import { collection, doc, getDoc, getDocs, query, where, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import Project from "../../classes/Project";
import authService from "./AuthService";

class ProjectService {
	constructor() {
		this.collectionRef = collection(db, "projects");
	}

	_createProjectInstance(docSnap) {
		if (!docSnap.exists()) {
			console.warn("No project");
			return null;
		}
		const data = docSnap.data();
		const projectId = docSnap.id;
		const { name, color, userIds, isFavoriteBy, parentProjectId, childProjectIds, createdAt, updatedAt } = data;
		const project = new Project(projectId, name, color, userIds, isFavoriteBy, parentProjectId, childProjectIds, createdAt, updatedAt);
		console.log("Project instance created:", project);
		return project;
	}

	async createNewProject({ name, color, isFavoriteBy = [], parentProjectId = null }) {
		try {
			const currentUser = await authService.getCurrentUser();
			const newDoc = doc(this.collectionRef);
			const projectData = {
				name,
				color,
				userIds: [currentUser.uid],
				isFavoriteBy,
				parentProjectId,
				childProjectIds: [],
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			};
			console.log("Project document created:", projectData);
			await setDoc(newDoc, projectData);
			return this.getProjectById(newDoc.id);
		} catch (error) {
			console.error("Failed to create project:", error);
			return { error };
		}
	}

	async getProjectById(id) {
		try {
			const docSnap = await getDoc(doc(this.collectionRef, id));
			const project = this._createProjectInstance(docSnap);
			console.log("Project found by id:", docSnap.data());
			return { project };
		} catch (error) {
			console.error(`Failed to get project by id ${id}, error: ${error}`);
			return { error };
		}
	}

	async listProjectsForUser(userId) {
		try {
			const q = query(this.collectionRef, where("userIds", "array-contains", userId));
			const snap = await getDocs(q);
			const projects = snap.docs.map((docSnap) => this._createProjectInstance(docSnap));
			return { projects };
		} catch (error) {
			console.error("Error listing projects for user:", error);
			return { error };
		}
	}

	async deleteProject(id) {
		try {
			await deleteDoc(doc(this.colRef, id));
			console.log("Project deleted succes");
			return { success: true };
		} catch (error) {
			console.error("Error deleting project:", error);
			return { error };
		}
	}
}

const projectService = new ProjectService();
export default projectService;
