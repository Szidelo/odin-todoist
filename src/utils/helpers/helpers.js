import authService from "../service/authService";

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

export const createUserAvatarFallback = (userName) => {
	const initials = userName
		.split(" ")
		.map((name) => name.charAt(0).toUpperCase())
		.join("");

	const avatarUrl = `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff&size=128`;

	return avatarUrl;
};
