// /utils/apiFeatures.js

class APIFeatures {
    constructor(query, queryString) {
        this.query = query; // Mongoose query object
        this.queryString = queryString; // req.query object
        this.filterQuery = {}; // Stores the current filter for counting
    }

    // 1. Filtering (e.g., filter by role for users)
    filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'q', 'mine']; // Add 'mine' to exclusion list
    excludedFields.forEach(el => delete queryObj[el]);

    const filter = {};
    const modelName = this.query.model.modelName;

    // Conditionally apply filters based on Model
    if (modelName === 'User' && queryObj.role) {
        // Only apply 'role' filter when querying the User model
        filter.role = queryObj.role; 
    }
    
    // (If you have other generic filters, add them here)

    this.query = this.query.find(filter);
    this.filterQuery = filter; 
    return this;
}

    // 2. Search (case-insensitive regex on specified fields)
    search() {
    if (this.queryString.q) {
        const q = this.queryString.q;
        const modelName = this.query.model.modelName; // Get the name of the model being queried
        
        // Base search fields: always available on all user-centric lists
        let searchFields = [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
        ];

        // Conditionally add fields only present in Class/Assignment/Submission models
        if (modelName !== 'User') {
            searchFields.push(
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            );
        }
        
        // If searching classes, you might also want to search by code
        if (modelName === 'Class') {
             searchFields.push({ code: { $regex: q, $options: 'i' } });
        }


        const searchQuery = { $or: searchFields };

        // Apply the dynamic search query
        this.query = this.query.find(searchQuery); 
    }
    return this;
}

    // 3. Pagination
    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 10;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

module.exports = APIFeatures;