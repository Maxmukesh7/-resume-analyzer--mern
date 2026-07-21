/**
 * Parses and returns pagination details.
 * @param {Object} query - The req.query object.
 * @param {number} defaultLimit - The fallback limit count.
 * @returns {Object} - Object containing page, limit, skip parameters.
 */
export const getPaginationParams = (query, defaultLimit = 10) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, parseInt(query.limit, 10) || defaultLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Returns formatted pagination metadata.
 * @param {number} totalItems - Total count of records.
 * @param {number} currentPage - The current active page index.
 * @param {number} limit - The page item limit count.
 * @returns {Object} - Pagination metadata summary.
 */
export const getPaginationMetadata = (totalItems, currentPage, limit) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    totalItems,
    totalPages,
    currentPage,
    limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? currentPage + 1 : null,
    prevPage: hasPrevPage ? currentPage - 1 : null
  };
};
