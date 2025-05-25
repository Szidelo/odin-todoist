import { auth, provider } from "../../config/firebase";
import {
	signInWithEmailAndPassword,
	signInWithPopup,
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	signOut,
} from "firebase/auth";
import User from "../../classes/User";

class AuthService {
	_createUserInstance(firebaseUser) {
		if (!firebaseUser) {
			console.warn("No user is currently logged in.");
			return null;
		}

		const { uid, accessToken, displayName, email, photoURL } = firebaseUser;
		console.log("Creating user instance:", { uid, accessToken, displayName, email, photoURL });
		return new User(uid, accessToken, displayName, email, photoURL);
	}

	async loginWithEmail(email, password) {
		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			const user = this._createUserInstance(userCredential.user);
			console.log("User logged in with email and password:", user);
			return { user };
		} catch (error) {
			console.error("Error logging in with email:", error);
			return { error };
		}
	}

	async loginWithGoogle() {
		try {
			const userCredential = await signInWithPopup(auth, provider);
			const user = this._createUserInstance(userCredential.user);
			console.log("User logged in with Google:", user);
			return { user };
		} catch (error) {
			console.error("Error logging in with Google:", error);
			return { error };
		}
	}

	async signupWithEmail(email, password) {
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = this._createUserInstance(userCredential.user);
			console.log("User signed up with email:", user);
			return { user };
		} catch (error) {
			console.error("Error signing up with email:", error);
			return { error };
		}
	}

	async signupWithGoogle() {
		try {
			const userCredential = await signInWithPopup(auth, provider);
			const user = this._createUserInstance(userCredential.user);
			console.log("User signed up with Google:", user); // firebase automatically creates a user account if it doesn't exist when signing in with Google
			return { user };
		} catch (error) {
			return { error };
		}
	}

	onAuthChange(callback) {
		return onAuthStateChanged(auth, (firebaseUser) => {
			const user = this._createUserInstance(firebaseUser);
			if (!user) {
				console.warn("No user is currently logged in.");
				return callback(null);
			}
			console.log("Auth state changed, user:", user);
			callback(user);
		});
	}

	async logout() {
		try {
			await signOut(auth);
			console.log("User logged out successfully.");
			return { success: true };
		} catch (error) {
			console.error("Error logging out:", error);
			return { error };
		}
	}

	async getCurrentUser() {
		if (!auth.currentUser) {
			console.warn("No user is currently logged in.");
			return null;
		}
		return new Promise((resolve) => {
			const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
				unsubscribe();
				const user = this._createUserInstance(firebaseUser);
				resolve(user.getUserInfo());
			});
		});
	}

	async isLoggedIn() {
		const user = await this.getCurrentUser();
		return !!user;
	}
}

const authService = new AuthService();

export default authService;
