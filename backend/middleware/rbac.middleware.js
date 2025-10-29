// /middleware/rbac.middleware.js

// Middleware to check if the user has one of the required roles
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // CRITICAL FIX: Ensure req.user exists and has a role before proceeding.
        if (!req.user) {
            res.status(401); // Unauthorized if user isn't attached (should be caught by 'protect')
            throw new Error('Unauthorized: User not found or token invalid.');
        }

        const userRole = req.user.role;

        if (!userRole || !roles.includes(userRole)) {
            res.status(403);
            // Access req.user.role (now userRole) defensively for the error message
            throw new Error(`Forbidden: Role ${userRole || 'NONE'} is not authorized to access this resource.`);
        }
        next();
    };
};

// Middleware to check for ownership or admin status (for submissions/assignments)
const checkOwnershipOrAdmin = (Model, idParam = 'id') => {
    return async (req, res, next) => {
        
        // Authorization check must pass 'protect' first
        if (!req.user) {
             res.status(401);
             throw new Error('Unauthorized: User object missing.');
        }
        
        // 1. Admin check (Global Read/Management)
        if (req.user.role === 'admin') {
            return next();
        }

        const resourceId = req.params[idParam];
        // Use .lean() for faster read access if we only need the IDs
        const resource = await Model.findById(resourceId).lean(); 

        if (!resource) {
            res.status(404);
            throw new Error('Resource not found.');
        }

        // 2. Ownership check (Logic depends on the Model)
        let isOwner = false;
        
        // Example logic for Submission: studentId must match userId
        if (Model.modelName === 'Submission' && resource.studentId.toString() === req.user._id.toString()) {
            isOwner = true;
        } 
        // Example logic for Assignment: createdBy (teacherId) must match userId
        else if (Model.modelName === 'Assignment' && resource.createdBy.toString() === req.user._id.toString()) {
            isOwner = true;
        }
        // NOTE: For Classes, membership/teacherId checks will be more complex and usually handled in the Controller.

        if (!isOwner) {
            res.status(403);
            throw new Error('Forbidden: You do not own this resource.');
        }

        // Attach resource to request for controller use
        req.resource = resource; 
        next();
    };
};

module.exports = { restrictTo, checkOwnershipOrAdmin };