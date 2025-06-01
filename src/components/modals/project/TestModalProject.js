// src/components/ProjectEditModal.js
import projectService from "../../../utils/service/ProjectService";
import "./testModalProject.css";

/**
 * Factory function to create a reusable <dialog>-based project-edit modal.
 * Usage:
 *   import { createProjectEditModal } from "./ProjectEditModal.js";
 *   const projectModal = createProjectEditModal();
 *   // Later, to edit a project:
 *   projectModal.open(projectId);
 */
export function createProjectEditModal() {
	// 1. Create the <dialog> element
	const dialog = document.createElement("dialog");
	dialog.className = "project-edit-modal";
	dialog.addEventListener("cancel", (e) => {
		e.preventDefault();
		dialog.close();
	});

	// 2. Build the form inside the dialog
	const form = document.createElement("form");
	form.className = "project-edit-form";
	form.method = "dialog"; // allows Esc to close

	// Title
	const titleEl = document.createElement("h3");
	titleEl.className = "modal-title";
	titleEl.textContent = "Edit Project";
	form.appendChild(titleEl);

	// Hidden input for projectId
	const idInput = document.createElement("input");
	idInput.type = "hidden";
	idInput.name = "id";
	form.appendChild(idInput);

	// Project Name
	const nameLabel = document.createElement("label");
	nameLabel.textContent = "Name:";
	nameLabel.htmlFor = "edit-project-name";
	nameLabel.className = "form-label";
	form.appendChild(nameLabel);

	const nameInput = document.createElement("input");
	nameInput.type = "text";
	nameInput.id = "edit-project-name";
	nameInput.name = "name";
	nameInput.required = true;
	nameInput.className = "form-input";
	form.appendChild(nameInput);

	// Description
	const descLabel = document.createElement("label");
	descLabel.textContent = "Description:";
	descLabel.htmlFor = "edit-project-desc";
	descLabel.className = "form-label";
	form.appendChild(descLabel);

	const descInput = document.createElement("textarea");
	descInput.id = "edit-project-desc";
	descInput.name = "description";
	descInput.rows = 3;
	descInput.className = "form-textarea";
	form.appendChild(descInput);

	// Color
	const colorLabel = document.createElement("label");
	colorLabel.textContent = "Color:";
	colorLabel.htmlFor = "edit-project-color";
	colorLabel.className = "form-label";
	form.appendChild(colorLabel);

	const colorInput = document.createElement("input");
	colorInput.type = "color";
	colorInput.id = "edit-project-color";
	colorInput.name = "color";
	colorInput.className = "form-color";
	form.appendChild(colorInput);

	// Submit button
	const submitButton = document.createElement("button");
	submitButton.type = "submit";
	submitButton.textContent = "Save Changes";
	submitButton.className = "btn btn-primary";
	form.appendChild(submitButton);

	// Close button inside dialog header
	const closeButton = document.createElement("button");
	closeButton.type = "button";
	closeButton.textContent = "✖";
	closeButton.className = "modal-close-btn";
	dialog.appendChild(closeButton);

	dialog.appendChild(form);
	document.body.appendChild(dialog);

	// Close helper
	const closeModal = () => {
		form.reset();
		dialog.close();
	};

	// Close on click “✖”
	closeButton.onclick = closeModal;

	// Handle form submission to update Firestore
	form.onsubmit = async (e) => {
		e.preventDefault();
		const projectId = idInput.value;
		const updatedName = nameInput.value.trim();
		const updatedDesc = descInput.value.trim();
		const updatedColor = colorInput.value;

		const updates = {
			name: updatedName,
			description: updatedDesc,
			color: updatedColor,
		};

		const result = await projectService.updateProject(projectId, updates);
		if (result.error) {
			console.error("Error updating project:", result.error);
		} else {
			closeModal();
		}
	};

	/**
	 * Fetches a project by ID, populates the form, and opens the dialog.
	 * @param {string} projectId
	 */
	async function open(projectId) {
		try {
			const { project, error } = await projectService.getProjectById(projectId);
			if (error || !project) {
				console.error("Failed to fetch project for editing:", error);
				return;
			}
			// Populate form fields
			idInput.value = project.id;
			nameInput.value = project.name || "";
			descInput.value = project.description || "";
			colorInput.value = project.color || "#db4c3f";

			dialog.showModal();
		} catch (err) {
			console.error("Error opening project-edit modal:", err);
		}
	}

	return { open, close: closeModal, dialog };
}
