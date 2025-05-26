// import authService from "../utils/service/AuthService";

// // mock function to simulate a home page rendering
// const renderHomePage = async () => {
// 	const user = await authService.getCurrentUser();
// 	const userAvatar = user?.photoURL || "https://via.placeholder.com/150";

// 	console.log("User:", user);
// 	const content = document.getElementById("content");
// 	if (!content) return console.error("Missing #content container");

// 	content.innerHTML = `
// 		<h2>Welcome Home</h2>
// 		<img src="${userAvatar}" alt="User Avatar" width="150" height="150" />
// 		<p>You are logged in as ${user?.displayName || user?.email || "Unknown"}!</p>
// 		<button id="signout">Sign Out</button>
// 	`;

// 	document.getElementById("signout")?.addEventListener("click", () => {
// 		console.log("Sign out clicked");
// 		authService.logout();
// 		location.reload();
// 	});
// };

// export default renderHomePage;

import authService from "../utils/service/AuthService";
import projectService from "../utils/service/ProjectService"; // adjust path if needed

// Home page rendering with project form and list
const renderHomePage = async () => {
	// Get current user
	const user = await authService.getCurrentUser();
	if (!user) {
		document.getElementById("content").innerHTML = `<p>Please sign in to view your projects.</p>`;
		return;
	}

	// Fetch projects for this user
	const { projects, error: listError } = await projectService.listProjectsForUser(user.uid);
	if (listError) {
		console.error("Error fetching projects:", listError);
	}

	// Render form and project list
	const content = document.getElementById("content");
	if (!content) return console.error("Missing #content container");

	content.innerHTML = `
    <h2>Welcome, ${user.displayName || user.email}!</h2>
    <img src="${user.photoURL || "https://via.placeholder.com/150"}" alt="User Avatar" width="150" height="150" />
    <button id="signout">Sign Out</button>

    <section id="project-section">
      <h3>Your Projects</h3>
      <ul id="project-list">
        ${
			projects && projects.length
				? projects.map((p) => `<li data-id="${p.id}" style="color:${p.color}">${p.name}</li>`).join("")
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
		li.textContent = project.name;
		li.dataset.id = project.id;
		li.style.color = project.color;
		list.appendChild(li);

		// Clear form
		nameInput.value = "";
	});
};

export default renderHomePage;
