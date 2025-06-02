// src/components/TestModal.js
import authService from "../../../utils/service/AuthService.js";
import projectService from "../../../utils/service/ProjectService.js";
import taskService from "../../../utils/service/TaskService.js";
import "./testModal.css";

/**
 * Factory to create a reusable <dialog>-based task-edit modal.
 * Usage:
 *   import { createTaskEditModal } from "./TestModal.js";
 *   const taskModal = createTaskEditModal();
 *   // Later, to edit a task:
 *   taskModal.open(taskId);
 */
export function createTaskEditModal() {
	// 1) Create the <dialog> element
	const dialog = document.createElement("dialog");
	dialog.className = "task-edit-modal";
	dialog.addEventListener("cancel", (e) => {
		e.preventDefault();
		dialog.close();
	});

	// 2) Build the form
	const form = document.createElement("form");
	form.className = "task-edit-form";
	form.method = "dialog";

	// — Title
	const titleEl = document.createElement("h3");
	titleEl.className = "modal-title";
	titleEl.textContent = "Edit Task";
	form.appendChild(titleEl);

	// — Hidden taskId
	const idInput = document.createElement("input");
	idInput.type = "hidden";
	idInput.name = "id";
	form.appendChild(idInput);

	// — Task name
	const nameLabel = document.createElement("label");
	nameLabel.textContent = "Name:";
	nameLabel.htmlFor = "edit-task-name";
	nameLabel.className = "form-label";
	form.appendChild(nameLabel);

	const nameInput = document.createElement("input");
	nameInput.type = "text";
	nameInput.id = "edit-task-name";
	nameInput.name = "name";
	nameInput.required = true;
	nameInput.className = "form-input";
	form.appendChild(nameInput);

	// — Description
	const descLabel = document.createElement("label");
	descLabel.textContent = "Description:";
	descLabel.htmlFor = "edit-task-desc";
	descLabel.className = "form-label";
	form.appendChild(descLabel);

	const descInput = document.createElement("textarea");
	descInput.id = "edit-task-desc";
	descInput.name = "description";
	descInput.rows = 3;
	descInput.className = "form-textarea";
	form.appendChild(descInput);

	// — Due Date
	const dueDateLabel = document.createElement("label");
	dueDateLabel.textContent = "Due Date:";
	dueDateLabel.htmlFor = "edit-task-dueDate";
	dueDateLabel.className = "form-label";
	form.appendChild(dueDateLabel);

	const dueDateInput = document.createElement("input");
	dueDateInput.type = "date";
	dueDateInput.id = "edit-task-dueDate";
	dueDateInput.name = "dueDate";
	dueDateInput.className = "form-input";
	form.appendChild(dueDateInput);

	// — Move To (project select)
	const moveToLabel = document.createElement("label");
	moveToLabel.textContent = "Move To:";
	moveToLabel.htmlFor = "edit-task-move-to";
	moveToLabel.className = "form-label";
	form.appendChild(moveToLabel);

	const moveToSelect = document.createElement("select");
	moveToSelect.id = "edit-task-move-to";
	moveToSelect.name = "moveTo";
	moveToSelect.className = "form-select";
	form.appendChild(moveToSelect);
	// We will populate this <select> when `open()` is called.

	// — Priority
	const priorityLabel = document.createElement("label");
	priorityLabel.textContent = "Priority:";
	priorityLabel.htmlFor = "edit-task-priority";
	priorityLabel.className = "form-label";
	form.appendChild(priorityLabel);

	const prioritySelect = document.createElement("select");
	prioritySelect.id = "edit-task-priority";
	prioritySelect.name = "priority";
	prioritySelect.className = "form-select";
	["1", "2", "3", "4"].forEach((level) => {
		const opt = document.createElement("option");
		opt.value = level;
		opt.textContent = level;
		prioritySelect.appendChild(opt);
	});
	form.appendChild(prioritySelect);

	// — Is Completed
	const completeContainer = document.createElement("div");
	completeContainer.className = "form-checkbox-container";

	const completeCheckbox = document.createElement("input");
	completeCheckbox.type = "checkbox";
	completeCheckbox.id = "edit-task-completed";
	completeCheckbox.name = "isCompleted";
	completeCheckbox.className = "form-checkbox";

	const completeLabel = document.createElement("label");
	completeLabel.htmlFor = "edit-task-completed";
	completeLabel.textContent = "Completed";
	completeLabel.className = "form-checkbox-label";

	completeContainer.appendChild(completeCheckbox);
	completeContainer.appendChild(completeLabel);
	form.appendChild(completeContainer);

	// — Submit button
	const submitButton = document.createElement("button");
	submitButton.type = "submit";
	submitButton.textContent = "Save Changes";
	submitButton.className = "btn btn-primary";
	form.appendChild(submitButton);

	// Close button
	const closeButton = document.createElement("button");
	closeButton.type = "button";
	closeButton.textContent = "✖";
	closeButton.className = "modal-close-btn";
	dialog.appendChild(closeButton);

	dialog.appendChild(form);
	document.body.appendChild(dialog);

	// Helper to close and remove from DOM
	const closeModal = () => {
		form.reset();
		dialog.close();
		document.body.removeChild(dialog);
	};
	closeButton.onclick = closeModal;

	// Handle form submit
	form.onsubmit = async (e) => {
		e.preventDefault();
		const taskId = idInput.value;
		const updatedName = nameInput.value.trim();
		const updatedDesc = descInput.value.trim();
		const updatedDueDate = dueDateInput.value ? new Date(dueDateInput.value) : null;
		const updatedPriority = parseInt(prioritySelect.value, 10);
		const updatedCompleted = completeCheckbox.checked;

		// Determine which project we moved to
		const selectedOption = moveToSelect.selectedOptions[0];
		const newProjectId = selectedOption ? selectedOption.value : null;

		const updates = {
			name: updatedName,
			description: updatedDesc,
			priority: updatedPriority,
			isCompleted: updatedCompleted,
			updatedAt: null, // serverTimestamp will be set inside updateTask
		};
		if (updatedDueDate) {
			updates.dueDate = updatedDueDate;
		} else {
			updates.dueDate = null;
		}

		// 1) If user changed the project, update the projectId in Firestore
		if (newProjectId && newProjectId !== form.dataset.currentProject) {
			updates.projectId = newProjectId;
		}

		const result = await taskService.updateTask(taskId, updates);
		if (result.error) {
			console.error("Error updating task:", result.error);
		} else {
			closeModal();
		}
	};

	/**
	 * Fetches a task by ID, populates the form, and opens the dialog.
	 * @param {string} taskId
	 */
	async function open(taskId) {
		try {
			// 1) Fetch current user
			const currentUser = await authService.getCurrentUser();
			if (!currentUser) {
				console.error("No user logged in");
				return;
			}

			// 2) Fetch task details
			const { task, error: taskError } = await taskService.getTaskById(taskId);
			if (taskError || !task) {
				console.error("Failed to fetch task for editing:", taskError);
				return;
			}

			// 3) Populate basic fields
			idInput.value = task.id;
			nameInput.value = task.name || "";
			descInput.value = task.description || "";
			if (task.dueDate) {
				const dt = task.dueDate.toDate();
				const mm = String(dt.getMonth() + 1).padStart(2, "0");
				const dd = String(dt.getDate()).padStart(2, "0");
				const yyyy = dt.getFullYear();
				dueDateInput.value = `${yyyy}-${mm}-${dd}`;
			} else {
				dueDateInput.value = "";
			}
			prioritySelect.value = String(task.priority || 4);
			completeCheckbox.checked = Boolean(task.isCompleted);

			// 4) Populate the “Move To” <select> with this user’s projects
			//    First clear existing options
			moveToSelect.innerHTML = "";
			const { projects, error: projError } = await projectService.listProjectsForUser(currentUser.uid);
			if (projError) {
				console.error("Error fetching projects for Move To:", projError);
			} else {
				projects.forEach((proj) => {
					const opt = document.createElement("option");
					opt.value = proj.id; // store projectId in value
					opt.textContent = proj.name;
					if (proj.id === task.projectId) {
						opt.selected = true;
					}
					moveToSelect.appendChild(opt);
				});
			}

			// Store the current projectId in form.dataset so we can detect changes on submit
			form.dataset.currentProject = task.projectId;

			// Finally, show the dialog
			dialog.showModal();
		} catch (err) {
			console.error("Error opening task-edit modal:", err);
		}
	}

	return { open, close: closeModal, dialog };
}
