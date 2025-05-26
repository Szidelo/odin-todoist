import authService from "../utils/service/AuthService";
import projectService from "../utils/service/ProjectService";
import userService from "../utils/service/UserService"; // new service to fetch user profiles

// Home page rendering with project form and list
const renderHomePage = async () => {
	// Get current user
	const currentUser = await authService.getCurrentUser();
	if (!currentUser) {
		document.getElementById("content").innerHTML = `<p>Please sign in to view your projects.</p>`;
		return;
	}

	// Fetch projects for this user
	const { projects, error: listError } = await projectService.listProjectsForUser(currentUser.uid);
	if (listError) {
		console.error("Error fetching projects:", listError);
	}

	// Gather all unique user IDs across projects (including current user)
	const allUserIds = Array.from(new Set(projects.flatMap((p) => p.userIds).concat(currentUser.uid)));

	// Fetch user profiles
	const userProfiles = {};
	await Promise.all(
		allUserIds.map(async (uid) => {
			const { user, error } = await userService.getUserById(uid);
			if (user) userProfiles[uid] = user;
			else console.warn(`User profile not found for UID: ${uid}`, error);
		})
	);

	// Render form and project list
	const content = document.getElementById("content");
	if (!content) return console.error("Missing #content container");

	content.innerHTML = `
    <style>
      #project-section { margin-top: 20px; }
      #project-list { list-style: none; padding: 0; }
      .project-item { display: flex; align-items: center; justify-content: space-between; padding: 8px; border: 1px solid #e0e0e0; margin-bottom: 8px; border-radius: 4px; }
      .project-details { display: flex; align-items: center; gap: 8px; }
      .project-color { width: 12px; height: 12px; border-radius: 50%; }
      .user-list { display: flex; align-items: center; gap: 4px; margin-left: 16px; }
      .user-list img { width: 24px; height: 24px; border-radius: 50%; }
      .btn { padding: 4px 8px; margin-left: 4px; cursor: pointer; border: none; border-radius: 4px; }
      .btn-delete { background: #e74c3c; color: #fff; }
      .btn-add-user { background: #3498db; color: #fff; }
    </style>
    <h2>Welcome, ${currentUser.displayName || currentUser.email}!</h2>
    <img src="${currentUser.photoURL || "https://via.placeholder.com/150"}" alt="User Avatar" width="150" height="150" />
    <button id="signout">Sign Out</button>

    <section id="project-section">
      <h3>Your Projects</h3>
      <ul id="project-list">
        ${
			projects && projects.length
				? projects
						.map((p) => {
							const usersHtml = (p.userIds || [])
								.map((uid) => {
									const u = userProfiles[uid];
									return `<img src='${u?.photoURL || "https://via.placeholder.com/24"}' title='${
										u?.displayName || uid
									}' alt='User'/>`;
								})
								.join("");
							return `
                <li class='project-item' data-id='${p.id}'>
                  <div class='project-details'>
                    <span class='project-color' style='background:${p.color}'></span>
                    <span>${p.name}</span>
                    <div class='user-list'>${usersHtml}</div>
                  </div>
                  <div>
                    <button class='btn btn-add-user' data-action='add-user'>+ User</button>
                    <button class='btn btn-delete' data-action='delete'>Delete</button>
                  </div>
                </li>`;
						})
						.join("")
				: "<li>No projects yet.</li>"
		}
      </ul>

      <h3>Create New Project</h3>
      <form id="project-form">
        <input type="text" id="project-name" placeholder="Project Name" required />
        <input type="color" id="project-color" value="#db4c3f" />
        <button type="submit">Add Project</button>
      </form>
    </section>
  `;

	// Sign out handler
	document.getElementById("signout").addEventListener("click", async () => {
		await authService.logout();
		location.reload();
	});

	// Handle project form submission
	document.getElementById("project-form").addEventListener("submit", async (e) => {
		e.preventDefault();
		const nameInput = document.getElementById("project-name");
		const colorInput = document.getElementById("project-color");
		const name = nameInput.value.trim();
		const color = colorInput.value;
		if (!name) return;

		const { project, error } = await projectService.createNewProject({ name, color });
		if (error) {
			console.error("Error creating project:", error);
			return;
		}

		// Append new project to list
		const list = document.getElementById("project-list");
		const li = document.createElement("li");
		li.className = "project-item";
		li.dataset.id = project.id;
		const usersHtml = project.userIds
			.map((uid) => {
				const u = userProfiles[uid];
				return `<img src='${u?.photoURL || "https://via.placeholder.com/24"}' title='${u?.displayName || uid}' alt='User'/>`;
			})
			.join("");
		li.innerHTML = `
      <div class='project-details'>
        <span class='project-color' style='background:${project.color}'></span>
        <span>${project.name}</span>
        <div class='user-list'>${usersHtml}</div>
      </div>
      <div>
        <button class='btn btn-add-user' data-action='add-user'>+ User</button>
        <button class='btn btn-delete' data-action='delete'>Delete</button>
      </div>
    `;
		list.appendChild(li);

		// Clear form
		nameInput.value = "";
	});

	// Handle delete and add-user actions
	document.getElementById("project-list").addEventListener("click", async (e) => {
		const btn = e.target.closest("button");
		if (!btn) return;
		const action = btn.dataset.action;
		const li = btn.closest(".project-item");
		const projectId = li.dataset.id;

		if (action === "delete") {
			const { success, error } = await projectService.deleteProject(projectId);
			if (success) {
				li.remove();
			} else {
				console.error("Error deleting project:", error);
			}
		} else if (action === "add-user") {
			const newUserId = prompt("Enter user UID to add:");
			if (!newUserId) return;

			// Fetch current project data
			const { project, error: getError } = await projectService.getProjectById(projectId);
			if (getError || !project) {
				console.error("Error fetching project:", getError);
				return;
			}

			// Check if user already associated
			if (project.userIds.includes(newUserId)) {
				alert("User already in project");
				return;
			}

			// Update userIds array
			const updatedUserIds = [...project.userIds, newUserId];
			const { project: updatedProject, error: updateError } = await projectService.updateProject(projectId, {
				userIds: updatedUserIds,
			});
			if (updateError) {
				console.error("Error adding user to project:", updateError);
				return;
			}

			// Update UI: append new user avatar to list
			const userListDiv = li.querySelector(".user-list");
			const u = userProfiles[newUserId];
			const img = document.createElement("img");
			img.src = u?.photoURL || "https://via.placeholder.com/24";
			img.alt = u?.displayName || newUserId;
			img.title = u?.displayName || newUserId;
			userListDiv.appendChild(img);
		}
	});
};

export default renderHomePage;
