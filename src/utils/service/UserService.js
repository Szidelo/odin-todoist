import { serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";
import User from "../../classes/User";
import { db } from "../../config/firebase";

class UserService {
	constructor() {
		this.userRef = (uid) => doc(db, "users", uid);
	}

	_createUserInstance(data, uid) {
		if (!data) {
			console.error("No user data found");
			return null;
		}

		const { accessToken, displayName, email, photoURL, preferences } = data;
		const user = new User(uid, accessToken, displayName, email, photoURL, preferences || {});
		console.log("User instance created by UserService:", user);
		return user;
	}

	async getUserById(uid) {
		try {
			const docRef = this.userRef(uid);
			const snap = await getDoc(docRef);
			if (!snap.exists()) {
				console.error("User does not exist by id:", uid);
				return { user: null };
			}
			const data = snap.data();
			const user = this._createUserInstance(data, uid);
			console.log("User fetched by id:", user);
			return { user };
		} catch (error) {
			console.log("Error fetching user:", error);
			return { error };
		}
	}

	async saveUserToDB(user) {
		try {
			const { uid, displayName, email, photoURL, preferences } = user;
			const docRef = this.userRef(uid);
			setDoc(
				docRef,
				{
					displayName,
					email,
					photoURL,
					preferences,
					updatedAt: serverTimestamp(),
					createdAt: user.createdAt || serverTimestamp(),
				},
				{ merge: true }
			);
			console.log("User saved to firestore:", this.getUserById(uid));
			return { success: true };
		} catch (error) {
			console.error("Error saving user to firestore:", error);
			return { error };
		}
	}
	async getUserByEmail(email) {
		try {
			const q = query(collection(db, "users"), where("email", "==", email));
			const snap = await getDocs(q);
			if (snap.empty) {
				console.error("No user found with email:", email);
				return { user: null };
			}
			const docSnap = snap.docs[0];
			const data = docSnap.data();
			const user = this._createUserInstance(data, docSnap.id);
			console.log("User fetched by email:", user);
			return { user };
		} catch (error) {
			console.error("Error fetching user by email:", error);
			return { error };
		}
	}
}

const userService = new UserService();
export default userService;
