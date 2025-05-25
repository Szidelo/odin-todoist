import authService from "../utils/service/authService";

// mock function to simulate a home page rendering
const renderHomePage = async () => {
	const user = await authService.getCurrentUser();
	const userAvatar = user?.photoURL || "https://via.placeholder.com/150";

	console.log("User:", user);
	const content = document.getElementById("content");
	if (!content) return console.error("Missing #content container");

	content.innerHTML = `
		<h2>Welcome Home</h2>
		<img src="${userAvatar}" alt="User Avatar" width="150" height="150" />
		<p>You are logged in as ${user?.displayName || "Unknown"}!</p>
		<button id="signout">Sign Out</button>
	`;

	document.getElementById("signout")?.addEventListener("click", () => {
		console.log("Sign out clicked");
		authService.logout();
		location.reload();
	});
};

export default renderHomePage;
