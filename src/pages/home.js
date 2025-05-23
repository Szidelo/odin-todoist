import authService from "../modules/auth/authService";

// mock function to simulate a home page rendering
const renderHomePage = async () => {
	const getUser = () => {
		const user = authService.getCurrentUser();
		return user;
	};

	const user = await getUser();
	console.log("User:", user);
	document.getElementById("content").innerHTML = `
		<h2>Welcome Home</h2>
		<p>You are logged in as ${user?.displayName || "Unknown"}!</p>
		<button id="signout">Sign Out</button>
	`;
	const signoutButton = document.getElementById("signout");
	signoutButton.addEventListener("click", () => {
		console.log("Sign out clicked");

		authService.logout();
		location.reload();
	});
};

export default renderHomePage;
