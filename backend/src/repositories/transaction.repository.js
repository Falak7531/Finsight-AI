import crypto from "node:crypto";

const transactions = [];

export const getAll = async () => transactions;

export const create = async (data) => {
  const transaction = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
  };

  transactions.push(transaction);
  return transaction;
};
