import Navigo from "navigo";
import renderHomePage from "./pages/home";
import renderSignup from "./pages/signupPage";
import renderSignin from "./pages/signinPage";
import renderNotFoundPage from "./pages/notFound";
import helpers from "./utils/helpers/helpers";

export function setupRouter() {
	const router = new Navigo("/", { hash: true });

	router
		.on({
			"/": () => helpers.requireAuth(renderHomePage, router),
			"/signup": () => renderSignup(),
			"/signin": () => renderSignin(),
		})
		.resolve();

	router.notFound(() => {
		renderNotFoundPage();
	});
}
