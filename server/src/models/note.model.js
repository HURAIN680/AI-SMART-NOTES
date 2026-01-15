import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
 {
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: String,
    content: String,
    summary: String,
    tags: [String],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true }
);


export default mongoose.model("Note", noteSchema);
