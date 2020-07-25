import { firebase } from "@/firebase.js";

const adminEmail = "rebecca@experimentalstation.org";
const staffEmail = "staff@blackstonebikes.com";

export const isAdmin = async () => {
  const currentUser = await firebase.auth().currentUser;
  if (currentUser) {
    return currentUser.email === adminEmail;
  } else {
    return false;
  }
};

export const isStaff = async () => {
  const currentUser = await firebase.auth().currentUser;
  if (currentUser) {
    return currentUser.email === adminEmail || currentUser.email === staffEmail;
  } else {
    return false;
  }
};

export const isLoggedIn = async () => {
  const currentUser = await firebase.auth().currentUser;
  return currentUser != null;
};
