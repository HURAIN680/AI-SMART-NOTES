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

    files: [
      {
        url: String,
        publicId: String,
        originalName: String,
        // vital: If naming a field "type", use this syntax to avoid Mongoose errors
        type: { 
            type: String 
        }, 
      },
    ],

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

files: [
  {
    url: String,
    publicId: String,
    originalName: String,
    type: String
  }
]


export default mongoose.model("Note", noteSchema);
