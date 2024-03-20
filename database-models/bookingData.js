const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const bookingSchema = new Schema({
  userId: {
    required: true,
    type: String,
  },
  dateBooked: {
    type: Date,
    required: true,
  },
  slotId: {
    type: String,
    required: true,
  },
  areaId: {
    type: String,
    required: true,
  },
  cityId: {
    type: String,
    required: true,
  },
  bookedTimeSlot: {
    type: String,
    required: true,
  },
  isServiceCompleted: {
    type: Boolean,
    required: true,
  },
});

const bookingDataModel = model("bookingData", bookingSchema);

module.exports = bookingDataModel;
