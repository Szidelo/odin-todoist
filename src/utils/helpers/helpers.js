import authService from "../../modules/auth/authService";

export const requireAuth = (callback, router) => {
	const unsubscribe = authService.onAuthChange((user) => {
		console.log("User state changed:", user);
		unsubscribe(); // stop listening after first call
		if (user) {
			console.log("User is authenticated");
			callback();
		} else {
			console.log("User is not authenticated, redirecting to sign-in");
			router.navigate("/signin");
		}
	});
};
