import { auth, provider } from "../../config/firebase";
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import User from "../../classes/User";

class AuthService {
	_createUserInstance(firebaseUser) {
		if (!firebaseUser) return null;

		const { uid, accessToken, displayName, email, photoURL } = firebaseUser;
		return new User(uid, accessToken, displayName, email, photoURL);
	}

	async loginWithEmail(email, password) {
		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			console.log("-----------user credential:", userCredential);
			const user = this._createUserInstance(userCredential.user);
			console.log("++++++++++++User logged in AuthService:", user.getUserInfo());
			return { user };
		} catch (error) {
			return { error };
		}
	}

	async loginWithGoogle() {
		try {
			const userCredential = await signInWithPopup(auth, provider);
			console.log("-----------user credential:", userCredential);

			const user = this._createUserInstance(userCredential.user);
			console.log("++++++++++++User logged in AuthService:", user.getUserInfo());

			return { user };
		} catch (error) {
			return { error };
		}
	}

	async signupWithEmail(email, password) {
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = this._createUserInstance(userCredential.user);
			return { user };
		} catch (error) {
			return { error };
		}
	}

	async signupWithGoogle() {
		try {
			const userCredential = await signInWithPopup(auth, provider);
			const user = this._createUserInstance(userCredential.user);
			return { user };
		} catch (error) {
			return { error };
		}
	}

	onAuthChange(callback) {
		return onAuthStateChanged(auth, (firebaseUser) => {
			const user = this._createUserInstance(firebaseUser);
			callback(user);
		});
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
