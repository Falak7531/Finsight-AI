import * as transactionRepository from "../repositories/transaction.repository.js";

export const getTransactions = async () => {
  return transactionRepository.getAll();
};

export const createTransaction = async (payload) => {
  if (!payload || !payload.amount || !payload.type || !payload.category) {
    const error = new Error("Transaction amount, type, and category are required");
    error.statusCode = 400;
    throw error;
  }

  return transactionRepository.create({
    amount: Number(payload.amount),
    type: payload.type,
    category: payload.category,
    description: payload.description || "No description",
    date: payload.date || new Date().toISOString(),
  });
};
