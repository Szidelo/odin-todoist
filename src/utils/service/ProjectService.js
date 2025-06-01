import {
	collection,
	doc,
	getDoc,
	getDocs,
	query,
	where,
	setDoc,
	updateDoc,
	deleteDoc,
	serverTimestamp,
	arrayUnion,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import Project from "../../classes/Project";
import authService from "./AuthService";
import helpers from "../helpers/helpers";

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
		const { name, color, userIds, isFavoriteBy, parentProjectId, childProjectIds, sections, createdAt, updatedAt } =
			data;
		const project = new Project(
			projectId,
			name,
			color,
			userIds,
			isFavoriteBy,
			parentProjectId,
			childProjectIds,
			sections || [],
			createdAt,
			updatedAt
		);
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
				sections: [],
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

	async updateProject(id, updates) {
		try {
			const projectRef = doc(this.collectionRef, id);

			const toUpdate = {
				...updates,
				updatedAt: serverTimestamp(),
			};

			await updateDoc(projectRef, toUpdate);

			const { project, error } = await this.getProjectById(id);
			if (error) throw error;
			return { project };
		} catch (error) {
			console.error("Error updating project:", error);
			return { error };
		}
	}

	async addSection(projectiId, name) {
		const sectionId = helpers.generateUniqueId();
		const sectionData = {
			id: sectionId,
			name,
			order: Date.now(),
		};
		try {
			const docRef = doc(this.collectionRef, projectiId);
			await updateDoc(docRef, {
				sections: arrayUnion(sectionData),
			});
			console.log("Section created:", sectionData);
			return sectionData.id;
		} catch (error) {
			console.error("Error adding section:", error);
			return { error };
		}
	}

	async deleteSection(projectId, sectionId) {
		try {
			const { project } = await this.getProjectById(projectId);
			if (!project || !project.sections) {
				console.warn("Project or sections not found");
				throw new Error("Project not found");
			}
			const otherSections = project.sections.filter((section) => section.id !== sectionId);
			await updateDoc(doc(this.collectionRef, projectId), {
				sections: otherSections,
			});
			console.log("Section removed from project:", project, sectionId);

			return { success: true };
		} catch (error) {
			console.error("Failed to delete section:", error);
			return { error };
		}
	}

	async deleteProject(id) {
		try {
			await deleteDoc(doc(this.collectionRef, id));
			console.log("Project deleted success");
			return { success: true };
		} catch (error) {
			console.error("Error deleting project:", error);
			return { error };
		}
	}
}

const projectService = new ProjectService();
export default projectService;
