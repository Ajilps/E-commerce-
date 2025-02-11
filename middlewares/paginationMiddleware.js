// middleware/pagination.js
const paginateResults = (model) => {
  return async (req, res, next) => {
    // Pagination parameters (defaults: page=1, limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || '-createdAt';

    // Extract filters from query params (exclude pagination/sort fields)
    const { page: _, limit: __, sort: ___, ...rawFilters } = req.query;
    const query = {};

    // Convert query params to MongoDB query syntax
    for (const [key, value] of Object.entries(rawFilters)) {
      // Handle operator syntax (e.g., price[gte]=100 → { price: { $gte: 100 } })
      if (key.match(/\[(.*)\]/)) {
        const [field, operator] = key.split(/\[|\]/);
        if (!query[field]) query[field] = {};
        query[field][`$${operator}`] = isNaN(value) ? value : Number(value);
      } else {
        // Handle regular equality
        query[key] = isNaN(value) ? value : Number(value);
      }
    }

    // Calculate skip value
    const skip = (page - 1) * limit;

    try {
      // Fetch data and total count in parallel
      const [results, total] = await Promise.all([
        model.find(query).sort(sort).skip(skip).limit(limit).exec(),
        model.countDocuments(query)
      ]);

      // Pagination metadata
      const totalPages = Math.ceil(total / limit);

      // Attach to response
      res.paginatedResults = {
        data: results,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default paginateResults;