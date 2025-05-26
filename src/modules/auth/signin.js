import authService from "../../utils/service/AuthService";
import userService from "../../utils/service/UserService";

const signin = () => {
	const signinWithEmailAndPassword = (email, password) => {
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
					const user = res.user;
					userService.saveUserToDB(user);
					window.location.hash = "#/"; //redirect to home page
				}
			})
			.catch((err) => {
				console.error("Error signing in with Google:", err);
			});
	};

	return {
		signinWithEmailAndPassword,
		signinWithGoogle,
	};
};

export default signin;
