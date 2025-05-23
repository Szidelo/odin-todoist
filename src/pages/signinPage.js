import signin from "../modules/auth/signin";

const renderSignin = () => {
	const signinModule = signin();
	const { signinWithEmailAndPassword, signinWithGoogle } = signinModule;
	// Clear previous content
	const app = document.getElementById("content");
	app.innerHTML = "";

	// Create form
	const form = document.createElement("form");
	form.id = "signin-form";

	// Email input
	const emailInput = document.createElement("input");
	emailInput.type = "email";
	emailInput.placeholder = "Email";
	emailInput.name = "email";
	emailInput.required = true;

	// Password input
	const passwordInput = document.createElement("input");
	passwordInput.type = "password";
	passwordInput.placeholder = "Password";
	passwordInput.name = "password";
	passwordInput.required = true;

	// Submit button
	const submitBtn = document.createElement("button");
	submitBtn.type = "submit";
	submitBtn.textContent = "Sign in";

	// Google sign-up button
	const googleBtn = document.createElement("button");
	googleBtn.type = "button";
	googleBtn.textContent = "Sign in with Google";

	// Append elements to form
	form.appendChild(emailInput);
	form.appendChild(passwordInput);
	form.appendChild(submitBtn);

	// Append form and Google button to app
	app.appendChild(form);
	app.appendChild(googleBtn);

	// Example handlers (to be implemented)
	form.addEventListener("submit", (e) => {
		e.preventDefault();
		const email = emailInput.value;
		const password = passwordInput.value;
		console.log("Sign up with:", email, password);
		signinWithEmailAndPassword(email, password);
	});

	googleBtn.addEventListener("click", () => {
		console.log("Sign up with Google");
		signinWithGoogle();
	});
};

export default renderSignin;
