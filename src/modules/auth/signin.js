import authService from "./authService";

const signin = () => {
	const signinWithEmalAndPassword = (email, password) => {
		authService
			.loginWithEmail(email, password)
			.then((res) => {
				if (res.err) {
					console.error("Error signing in:", res.err);
				} else {
					console.log("User signed in successfully:", res.user);
					window.location.hash = "#/"; //redirect to home page
				}
			})
			.catch((err) => {
				console.error("Error signing in:", err);
			});
	};

	const signinWithGoogle = () => {
		authService
			.loginWithGoogle()
			.then((res) => {
				if (res.err) {
					console.error("Error signing in with Google:", res.err);
				} else {
					console.log("User signed in with Google successfully:", res.user);
					window.location.hash = "#/"; //redirect to home page
				}
			})
			.catch((err) => {
				console.error("Error signing in with Google:", err);
			});
	};

	return {
		signinWithEmalAndPassword,
		signinWithGoogle,
	};
};

export default signin;
