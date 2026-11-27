const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseName: { type: String, required: true, trim: true },
    courseCode: {
        required: true, unique: true, trim: true,
        type: String,
        // ref: ['student', 'faculty']
    },     //student must know course code and teacher also, who will teach the course 
    description: { type: String, required: true, trim: true },
    department: {
        //  type: mongoose.Schema.Types.ObjectId,
        type: String,
        required: true,
        trim: true,
        //  ref: 'faculty' 
    }, //every faculty must know what department he is in
    semester: { type: Number, required: true, min: 1, max: 12 },
    assignedFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'faculty', required: true, index: true }
})

courseSchema.index({ courseName: 1 });
courseSchema.index({ department: 1, semester: 1 });

module.exports = mongoose.model('course', courseSchema);