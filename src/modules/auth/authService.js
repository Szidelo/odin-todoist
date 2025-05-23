import { auth, provider } from "../../config/firebase";
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

class AuthService {
	async loginWithEmail(email, password) {
		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			return { user: userCredential.user };
		} catch (error) {
			return { error };
		}
	}

	async loginWithGoogle() {
		try {
			const userCredential = await signInWithPopup(auth, provider);
			return { user: userCredential.user };
		} catch (error) {
			return { error };
		}
	}

	async signupWithEmail(email, password) {
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			return { user: userCredential.user };
		} catch (error) {
			return { error };
		}
	}

	async signupWithGoogle() {
		try {
			const userCredential = await signInWithPopup(auth, provider);
			return { user: userCredential.user };
		} catch (error) {
			return { error };
		}
	}

	onAuthChange(callback) {
		return onAuthStateChanged(auth, callback);
	}

	async logout() {
		try {
			await signOut(auth);
			return { success: true };
		} catch (error) {
			return { error };
		}
	}

	async getCurrentUser() {
		return new Promise((resolve) => {
			const unsubscribe = onAuthStateChanged(auth, (user) => {
				unsubscribe();
				resolve(user);
			});
		});
	}
}

const authService = new AuthService();

export default authService;
