import helpers from "../utils/helpers/helpers";

class User {
	constructor(uid, accessToken, displayName, email, photoURL, preferences = {}) {
		this.uid = uid;
		this.accessToken = accessToken;
		this.displayName = displayName;
		this.email = email;
		this.photoURL = photoURL || helpers.createUserAvatarFallback(displayName || email);
		this.preferences = preferences;
	}

	getUserInfo() {
		return {
			uid: this.uid,
			displayName: this.displayName,
			email: this.email,
			photoURL: this.photoURL,
		};
	}

	getUserToken() {
		return this.accessToken;
	}

	updateUserInfo(updates = {}) {
		for (const key in updates) {
			if (Object.prototype.hasOwnProperty.call(this, key)) {
				this[key] = updates[key];
			}
		}
	}
}

export default User;
