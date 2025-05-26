import authService from "../../utils/service/AuthService";
import userService from "../../utils/service/UserService";

const signup = () => {
	const signupWithEmail = async (email, password) => {
		authService
			.signupWithEmail(email, password)
			.then((response) => {
				if (response.error) {
					console.error("Error signing up:", response.error);
				} else {
					console.log("User signed up successfully:", response.user);
					window.location.hash = "#/"; //redirect to home page
				}
			})
			.catch((error) => {
				console.error("Error signing up:", error);
			});
	};

	const signupWithGoogle = async () => {
		authService
			.signupWithGoogle()
			.then((response) => {
				if (response.error) {
					console.error("Error signing up with Google:", response.error);
				} else {
					console.log("User signed up with Google successfully:", response.user);
					const user = response.user;
					userService.saveUserToDB(user);
					window.location.hash = "#/"; //redirect to home page
				}
			})
			.catch((error) => {
				console.error("Error signing up with Google:", error);
			});
	};

	// create a message to show the user if the signup was successful or not

	return {
		signupWithEmail,
		signupWithGoogle,
	};
};

export default signup;
