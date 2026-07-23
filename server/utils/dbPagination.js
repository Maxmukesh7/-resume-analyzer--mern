import { getPaginationParams, getPaginationMetadata } from './paginationHelper.js';
import { formatMongoDocs } from './dbFormatter.js';

/**
 * Executes a paginated Mongoose query.
 * @param {mongoose.Model} Model - The Mongoose model to target.
 * @param {Object} filter - The filter criteria.
 * @param {Object} reqQuery - The request query object (req.query).
 * @param {Object|String} projection - Fields to select or exclude.
 * @param {Object} options - Custom sorting, populates, defaultLimits.
 * @returns {Promise<Object>} - Contains items and pagination metadata.
 */
export const paginateQuery = async (Model, filter = {}, reqQuery = {}, projection = null, options = {}) => {
  const { page, limit, skip } = getPaginationParams(reqQuery, options.defaultLimit || 10);

  // Count total records matching filter
  const totalItems = await Model.countDocuments(filter);

  let query = Model.find(filter, projection)
    .skip(skip)
    .limit(limit);

  if (options.populate) {
    query = query.populate(options.populate);
  }

  if (options.sort) {
    query = query.sort(options.sort);
  } else {
    query = query.sort({ createdAt: -1 }); // Sort by newest by default
  }

  const items = await query;
  const metadata = getPaginationMetadata(totalItems, page, limit);

  return {
    items: formatMongoDocs(items),
    pagination: metadata
  };
};
