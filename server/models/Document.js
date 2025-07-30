const { Schema, model } = require("mongoose");

const DocumentSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    content: {
      type: Object,
      default: {},
      validate: {
        validator: function (v) {
          return typeof v === "object" && v !== null;
        },
        message: "Content must be a valid object",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = model("Document", DocumentSchema);
