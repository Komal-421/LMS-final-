const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    employeeId: {
        unique: true, required: true,
        type: String, trim: true
        // type: mongoose.Schema.Types.ObjectId,
        // ref: 'student'                             // student must know there teacher id 
    },
    password: { select: false, required: true, type: String },
    department: { type: String, required: true, trim: true },
    experience: {
        type: Number, required: true, default: 0,
        validate: {
            validator: function (value) {
                return value >= 0
            },
            message: 'Enter valid experience years'
        }
    },
    role: {
        type: String, required: true,
        enum: ['faculty', 'admin'],
        default: 'faculty'
    },
    // Admin access is an additional permission; the user's faculty role is retained.
    adminAccess: { type: Boolean, default: false },
    // Legacy compatibility with earlier dual-role builds.
    facultyAccess: { type: Boolean, default: false }
}
)

facultySchema.index({ role: 1, name: 1 });
facultySchema.index({ department: 1, name: 1 });

module.exports = mongoose.model('faculty', facultySchema)