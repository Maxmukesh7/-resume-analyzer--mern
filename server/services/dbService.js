/**
 * Reusable Mongoose CRUD service layer to decouple controllers from database models.
 */

/**
 * Creates a new document in the collection.
 * @param {mongoose.Model} Model - The Mongoose model to target.
 * @param {Object} data - The payload body data.
 * @returns {Promise<mongoose.Document>} - The created document.
 */
export const create = async (Model, data) => {
  return await Model.create(data);
};

/**
 * Finds documents matching query filters.
 * @param {mongoose.Model} Model - The Mongoose model to target.
 * @param {Object} filter - The query criteria.
 * @param {Object|String} projection - The fields to return or exclude.
 * @param {Object} options - Pagination, sorting, populates.
 * @returns {Promise<Array<mongoose.Document>>} - Array of documents.
 */
export const find = async (Model, filter = {}, projection = null, options = {}) => {
  let query = Model.find(filter, projection, options);
  
  if (options.populate) {
    query = query.populate(options.populate);
  }
  if (options.sort) {
    query = query.sort(options.sort);
  }
  
  return await query;
};

/**
 * Retrieves a single document by ID.
 * @param {mongoose.Model} Model - The Mongoose model to target.
 * @param {String|mongoose.Types.ObjectId} id - The document ID.
 * @param {String|Object} populate - Populate configurations.
 * @returns {Promise<mongoose.Document|null>} - The document or null.
 */
export const findById = async (Model, id, populate = '') => {
  let query = Model.findById(id);
  if (populate) {
    query = query.populate(populate);
  }
  return await query;
};

/**
 * Updates a document by ID.
 * @param {mongoose.Model} Model - The Mongoose model to target.
 * @param {String|mongoose.Types.ObjectId} id - The document ID.
 * @param {Object} data - The updated data properties.
 * @param {Object} options - Update options (new, runValidators).
 * @returns {Promise<mongoose.Document|null>} - The updated document or null.
 */
export const update = async (Model, id, data, options = { new: true, runValidators: true }) => {
  return await Model.findByIdAndUpdate(id, data, options);
};

/**
 * Deletes a document by ID.
 * @param {mongoose.Model} Model - The Mongoose model to target.
 * @param {String|mongoose.Types.ObjectId} id - The document ID.
 * @returns {Promise<mongoose.Document|null>} - The deleted document or null.
 */
export const deleteById = async (Model, id) => {
  return await Model.findByIdAndDelete(id);
};
