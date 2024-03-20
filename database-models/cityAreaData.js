const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const slotsSchema = new Schema({
  bookingStatus: { type: Boolean, required: true, default: false },
  timeSlot: { type: String, required: true },
  slotExpiry: { type: String, required: true },
  areaId: { type: String, required: true },
  cityId: { type: String, required: true },
});

const areasSchema = new Schema({
  areaName: {
    type: String,
    required: true,
  },
  locationLink: {
    type: String,
    required: true,
  },
  cityId: { type: String, required: true },
});

const citiesSchema = new Schema({
  city: {
    type: String,
    required: true,
  },
});

const cityModel = model("cityData", citiesSchema);
const areaModel = model("areasData", areasSchema);
const slotsModel = model("slotsData", slotsSchema);

module.exports = { cityModel, areaModel, slotsModel };
