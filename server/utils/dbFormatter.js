/**
 * Database document formatter to clean up Mongoose-specific fields
 * and prevent password/sensitive fields leakage in API responses.
 */

/**
 * Formats a single Mongoose document/object.
 * @param {Object|Mongoose.Document} doc - The document to format.
 * @returns {Object|null} - Formatted document object.
 */
export const formatMongoDoc = (doc) => {
  if (!doc) return null;

  // Convert to plain object if it is a Mongoose document
  let obj = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: true }) : { ...doc };

  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }

  delete obj.__v;

  // Security safety: prevent password leakage
  if (obj.password) {
    delete obj.password;
  }

  return obj;
};

/**
 * Formats an array of Mongoose documents/objects.
 * @param {Array} docs - Array of documents.
 * @returns {Array} - Array of formatted objects.
 */
export const formatMongoDocs = (docs) => {
  if (!Array.isArray(docs)) return [];
  return docs.map(formatMongoDoc);
};
