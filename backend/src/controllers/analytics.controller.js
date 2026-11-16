import * as analyticsService from "../services/analytics.service.js";

export const getAnalyticsReport = async (req, res, next) => {
  try {
    const report = await analyticsService.getAnalyticsReport();
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};
