
import bcrypt from "bcryptjs";

import { createUser } from "../repositories/auth.repository.js";

export const signUpUser = async (userData) => {

  // Hash the original password
  const hashedPassword = await bcrypt.hash(
    userData.password,
    10
  );

  // Send user data to repository
  const user = await createUser({
    name: userData.name,
    email: userData.email,
    password: hashedPassword,
  });

  return user;
};
