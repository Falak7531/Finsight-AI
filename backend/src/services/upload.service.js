export const processUpload = async (payload) => {
  const { fileName, fileType, size } = payload || {};

  if (!fileName || !fileType || !size) {
    const error = new Error("fileName, fileType, and size are required");
    error.statusCode = 400;
    throw error;
  }

  return {
    fileName,
    fileType,
    size,
    status: "processed",
    uploadedAt: new Date().toISOString(),
  };
};
