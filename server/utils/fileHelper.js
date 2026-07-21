import fs from 'fs';
import path from 'path';

/**
 * Deletes a file at the specified absolute or relative path.
 * @param {string} filePath - Path to the file.
 * @returns {Promise<boolean>} - Resolves true if deleted, false if failed or not found.
 */
export const deleteFile = async (filePath) => {
  if (!filePath) return false;
  try {
    const resolvedPath = path.resolve(filePath);
    if (fs.existsSync(resolvedPath)) {
      await fs.promises.unlink(resolvedPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting file at ${filePath}:`, error.message);
    return false;
  }
};

/**
 * Validates if the file extension is supported.
 * @param {string} fileName - File name to test.
 * @param {Array<string>} supportedExtensions - Array of supported extensions.
 * @returns {boolean} - True if valid, false if not.
 */
export const validateExtension = (fileName, supportedExtensions = ['.pdf', '.docx']) => {
  if (!fileName) return false;
  const ext = path.extname(fileName).toLowerCase();
  return supportedExtensions.includes(ext);
};
