import * as uploadService from "../services/upload.service.js";

export const uploadFile = async (req, res, next) => {
  try {
    const result = await uploadService.processUpload(req.body);
    res.status(200).json({
      success: true,
      message: "Upload processed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
