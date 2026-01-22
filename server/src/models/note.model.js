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

    isPinned: {
        type: Boolean,
        default: false
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    pinHash: {
        type: String,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
},
{ timestamps: true }
);


export default mongoose.model("Note", noteSchema);
