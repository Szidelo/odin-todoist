import { onSnapshot, query, where, collection } from "firebase/firestore";
import { db } from "../config/firebase";
import authService from "../utils/service/AuthService";
import projectService from "../utils/service/ProjectService";
import taskService from "../utils/service/TaskService.js";
import userService from "../utils/service/UserService";
import { createTaskEditModal } from "../components/modals/task/TestModal.js";
import { createProjectEditModal } from "../components/modals/project/TestModalProject.js";

const renderHomePage = async () => {
	const currentUser = await authService.getCurrentUser();
	if (!currentUser) {
		document.getElementById("content").innerHTML = "<p>Please sign in.</p>";
		return;
	}

	const content = document.getElementById("content");
	content.innerHTML = `
    <div class="user-header">
      <img
        class="avatar-img"
        src="${currentUser.photoURL || "https://via.placeholder.com/100"}"
        alt="User Avatar"
      />
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
		projectsContainer.innerHTML = ""; // clear existing

		const projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

		// Gather all user profiles
		const allUserIds = [...new Set(projects.flatMap((p) => p.userIds))];
		const profiles = {};
		await Promise.all(
			allUserIds.map(async (uid) => {
				const { user } = await userService.getUserById(uid);
				profiles[uid] = user || { displayName: uid, photoURL: "" };
			})
		);

		// Render each project card
		projects.forEach((project) => {
			const card = document.createElement("div");
			card.className = "project-card";
			card.dataset.id = project.id;

			// Build the fixed parts via innerHTML
			card.innerHTML = `
        <div class="project-header" style="border-left:4px solid ${project.color}">
          <h4>${project.name}</h4>
		  <button class="edit-project">Edit Project</button>
          <button class="delete-project">🗑️</button>
        </div>

        <div class="user-list">
          ${project.userIds
				.map(
					(uid) =>
						`<img src="${profiles[uid].photoURL || "https://via.placeholder.com/24"}" title="${
							profiles[uid].displayName
						}" />`
				)
				.join("")}
        </div>

        <!-- Section list container -->
        <div class="sections-container" id="sections-${project.id}"></div>

        <!-- Add Section Form -->
        <form class="section-form" data-project="${project.id}">
          <input name="section-name" placeholder="New Section" required />
          <button type="submit">Add Section</button>
        </form>
      `;
			projectsContainer.appendChild(card);

			// Delete project button
			card.querySelector(".delete-project").onclick = async () => {
				await projectService.deleteProject(project.id);
			};

			card.querySelector(".edit-project").onclick = () => {
				const projectModal = createProjectEditModal();
				projectModal.open(project.id);
			};

			// Add Section form handler
			card.querySelector(".section-form").onsubmit = async (e) => {
				e.preventDefault();
				const projectId = e.target.dataset.project;
				const sectionName = e.target.elements["section-name"].value.trim();
				if (!sectionName) return;
				await projectService.addSection(projectId, sectionName);
				e.target.reset();
			};

			// Real-time listener for tasks in this project
			const tasksQuery = query(collection(db, "tasks"), where("projectId", "==", project.id));
			onSnapshot(tasksQuery, (taskSnap) => {
				// Group tasks by sectionId (including null)
				const tasksBySection = {};
				taskSnap.docs.forEach((tDoc) => {
					const data = tDoc.data();
					const secId = data.sectionId || "_noSection";
					if (!tasksBySection[secId]) tasksBySection[secId] = [];
					tasksBySection[secId].push({ id: tDoc.id, ...data });
				});

				// Get project sections (embedded array)
				const sections = project.sections || [];

				// Render “No Section” bucket first
				const sectionsContainer = document.getElementById(`sections-${project.id}`);
				sectionsContainer.innerHTML = ""; // clear previous

				// Helper: create a UL of tasks + inline add‐task form
				const renderTaskList = (container, taskList, projectId, sectionId) => {
					// Create UL
					const ul = document.createElement("ul");
					ul.className = "task-list";
					taskList.forEach((t) => {
						const li = document.createElement("li");
						li.className = "task-item";
						li.dataset.id = t.id;
						li.innerHTML = `
              <span>${t.name}</span>
			  <button class="edit-task">Edit</button>
              <button class="delete-task">🗑️</button>
            `;
						// Delete task button
						li.querySelector(".delete-task").onclick = async () => {
							await taskService.deleteTask(t.id);
						};

						ul.appendChild(li);
						//Edit task btn
						li.querySelector(".edit-task").onclick = () => {
							const taskModal = createTaskEditModal();
							console.log("++++++++++++Edit");
							taskModal.open(t.id);
						};
						ul.appendChild(li);
					});
					container.appendChild(ul);

					// Inline add‐task form
					const addTaskForm = document.createElement("form");
					addTaskForm.className = "task-form-inline";
					addTaskForm.innerHTML = `
            <input name="task-name" placeholder="New Task" required />
            <button type="submit">Add</button>
          `;
					addTaskForm.onsubmit = async (e) => {
						e.preventDefault();
						const taskName = e.target.elements["task-name"].value.trim();
						if (!taskName) return;
						await taskService.createNewTask({
							name: taskName,
							description: "",
							dueDate: null,
							priority: 4,
							projectId,
							sectionId,
						});
						e.target.reset();
					};
					container.appendChild(addTaskForm);
				};

				// 1) “Unsectioned” tasks
				const noSectionDiv = document.createElement("div");
				noSectionDiv.className = "section-block";
				noSectionDiv.innerHTML = `<h5>No Section</h5>`;

				if (tasksBySection["_noSection"]?.length > 0) {
					renderTaskList(noSectionDiv, tasksBySection["_noSection"], project.id, null);
				} else {
					// No tasks, but still add an inline form
					const p = document.createElement("p");
					p.className = "no-tasks";
					p.textContent = "No tasks";
					noSectionDiv.appendChild(p);

					const addTaskForm = document.createElement("form");
					addTaskForm.className = "task-form-inline";
					addTaskForm.innerHTML = `
            <input name="task-name" placeholder="New Task" required />
            <button type="submit">Add</button>
          `;
					addTaskForm.onsubmit = async (e) => {
						e.preventDefault();
						const taskName = e.target.elements["task-name"].value.trim();
						if (!taskName) return;
						await taskService.createNewTask({
							name: taskName,
							description: "",
							dueDate: null,
							priority: 4,
							projectId: project.id,
							sectionId: null,
						});
						e.target.reset();
					};
					noSectionDiv.appendChild(addTaskForm);
				}
				sectionsContainer.appendChild(noSectionDiv);

				// 2) Each section
				sections
					.sort((a, b) => a.order - b.order)
					.forEach((sec) => {
						const secDiv = document.createElement("div");
						secDiv.className = "section-block";
						secDiv.dataset.section = sec.id;

						// Build header with delete button
						const headerDiv = document.createElement("div");
						headerDiv.className = "section-header";
						headerDiv.innerHTML = `
              <h5>${sec.name}</h5>
			  <button class="rename-section">Rename</button>
              <button class="delete-section" data-section="${sec.id}">🗑️</button>
            `;
						secDiv.appendChild(headerDiv);

						// Attach delete-section handler
						const deleteBtn = headerDiv.querySelector(".delete-section");
						deleteBtn.onclick = async () => {
							console.log("Deleting section:", project.id, sec.id);
							await projectService.deleteSection(project.id, sec.id);
						};

						const renameBtn = headerDiv.querySelector(".rename-section");
						renameBtn.onclick = async () => {
							await projectService.renameSection(project.id, sec.id, "Testing");
						};

						// If tasks exist in this section, render them + inline form
						if (tasksBySection[sec.id]?.length > 0) {
							renderTaskList(secDiv, tasksBySection[sec.id], project.id, sec.id);
						} else {
							// “No tasks” placeholder
							const p = document.createElement("p");
							p.className = "no-tasks";
							p.textContent = "No tasks";
							secDiv.appendChild(p);

							// Inline add‐task form for this empty section
							const addTaskForm = document.createElement("form");
							addTaskForm.className = "task-form-inline";
							addTaskForm.innerHTML = `
                <input name="task-name" placeholder="New Task" required />
                <button type="submit">Add</button>
              `;
							addTaskForm.onsubmit = async (e) => {
								e.preventDefault();
								const taskName = e.target.elements["task-name"].value.trim();
								if (!taskName) return;
								await taskService.createNewTask({
									name: taskName,
									description: "",
									dueDate: null,
									priority: 4,
									projectId: project.id,
									sectionId: sec.id,
								});
								e.target.reset();
							};
							secDiv.appendChild(addTaskForm);
						}

						sectionsContainer.appendChild(secDiv);
					});
			});
		});
	});
};

export default renderHomePage;
