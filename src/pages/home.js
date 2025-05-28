// src/pages/home.js
import { onSnapshot, query, where, collection } from "firebase/firestore";
import { db } from "../config/firebase";
import authService from "../utils/service/AuthService";
import projectService from "../utils/service/ProjectService";
import taskService from "../utils/service/TaskService,js";
import userService from "../utils/service/UserService";

const renderHomePage = async () => {
	const currentUser = await authService.getCurrentUser();
	if (!currentUser) {
		document.getElementById("content").innerHTML = "<p>Please sign in.</p>";
		return;
	}

	const content = document.getElementById("content");
	content.innerHTML = `
<div class="user-header">
  <img class="avatar-img" src="${currentUser.photoURL}" alt="User Avatar" />
  <h2 class="welcome-text">Welcome, ${currentUser.displayName || currentUser.email}</h2>
  <button id="signout" class="btn-signout">Sign Out</button>
</div>
    <section id="project-section">
      <h3>Your Projects</h3>
      <div id="projects-container"></div>
      <h4>Create New Project</h4>
      <form id="project-form">
        <input id="project-name" placeholder="Project Name" required />
        <input type="color" id="project-color" value="#db4c3f" />
        <button type="submit">Add Project</button>
      </form>
    </section>
  `;

	// Sign out
	document.getElementById("signout").onclick = async () => {
		await authService.logout();
		location.reload();
	};

	// Create project
	document.getElementById("project-form").onsubmit = async (e) => {
		e.preventDefault();
		const name = document.getElementById("project-name").value.trim();
		const color = document.getElementById("project-color").value;
		if (!name) return;
		await projectService.createNewProject({ name, color });
		e.target.reset();
	};

	const projectsContainer = document.getElementById("projects-container");

	// Real-time listener for projects
	const projectsQuery = query(collection(db, "projects"), where("userIds", "array-contains", currentUser.uid));
	onSnapshot(projectsQuery, async (snapshot) => {
		projectsContainer.innerHTML = ""; // clear
		const projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

		// Gather all user profiles to avoid repeated calls
		const allUserIds = [...new Set(projects.flatMap((p) => p.userIds))];
		const profiles = {};
		await Promise.all(
			allUserIds.map(async (uid) => {
				const { user } = await userService.getUserById(uid);
				profiles[uid] = user || { displayName: uid, photoURL: "" };
			})
		);

		// For each project, render its card and set up task listener
		projects.forEach((project) => {
			const card = document.createElement("div");
			card.className = "project-card";
			card.dataset.id = project.id;
			card.innerHTML = `
        <div class="project-header" style="border-left:4px solid ${project.color}">
          <h4>${project.name}</h4>
          <button class="delete-project">🗑️</button>
        </div>
        <div class="user-list">
          ${project.userIds
				.map(
					(uid) =>
						`<img src="${profiles[uid].photoURL || "https://via.placeholder.com/24"}" title="${profiles[uid].displayName}" />`
				)
				.join("")}
        </div>
        <ul class="task-list" id="tasks-${project.id}"></ul>
        <form class="task-form" data-project="${project.id}">
          <input name="task-name" placeholder="New Task" required />
          <button type="submit">Add Task</button>
        </form>
      `;
			projectsContainer.appendChild(card);

			// Delete project
			card.querySelector(".delete-project").onclick = async () => {
				await projectService.deleteProject(project.id);
			};

			// Task form
			card.querySelector(".task-form").onsubmit = async (e) => {
				e.preventDefault();
				const projectId = e.target.dataset.project;
				const name = e.target.elements["task-name"].value.trim();
				if (!name) return;
				await taskService.createNewTask({ name, description: "", dueDate: null, priority: 4, projectId });
				e.target.reset();
			};

			// Real-time listener for tasks of this project
			const tasksQuery = query(collection(db, "tasks"), where("projectId", "==", project.id));
			onSnapshot(tasksQuery, (taskSnap) => {
				const ul = document.getElementById(`tasks-${project.id}`);
				ul.innerHTML = ""; // clear
				taskSnap.docs.forEach((tDoc) => {
					const t = tDoc.data();
					const li = document.createElement("li");
					li.className = "task-item";
					li.dataset.id = tDoc.id;
					li.innerHTML = `
            <span>${t.name}</span>
            <button class="delete-task">🗑️</button>
          `;
					// delete task
					li.querySelector(".delete-task").onclick = async () => {
						await taskService.deleteTask(tDoc.id);
					};
					ul.appendChild(li);
				});
			});
		});
	});
};

export default renderHomePage;
