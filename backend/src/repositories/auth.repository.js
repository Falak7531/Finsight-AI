
import prisma from "../config/prisma.js";

export const createUser = async (userData) => {
  return await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: userData.password,
    },

    // Don't return the password to the API
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};
