import * as reportRepository from "../repositories/report.repository.js";

export const getAnalyticsReport = async () => {
  return reportRepository.getSummary();
};
