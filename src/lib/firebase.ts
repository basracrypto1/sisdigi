// Firebase was declined by user. Reverting to local auth.
export const loginWithGoogle = async () => { throw new Error("Firebase declined"); };
export const logout = async () => {};
