import * as transactionService from "../services/transaction.service.js";

export const getTransactions = async (req, res, next) => {
  try {
    const transactions = await transactionService.getTransactions();
    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.createTransaction(req.body);
    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};
