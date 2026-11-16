import crypto from "node:crypto";

const users = [];

export const create = async (data) => {
  const user = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  return user;
};

export const findByEmail = async (email) => {
  return users.find((user) => user.email === email) || null;
};
