const mongoose = require("mongoose");

const carouselSchema = new mongoose.Schema({
  image: {
    type: String, // URL
    required: true,
  },
  title: {
    type: String,
  },
  subtitle: {
    type: String,
  },
  link: {
    type: String,
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model("Carousel", carouselSchema);
