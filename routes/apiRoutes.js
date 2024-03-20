const express = require("express");
const jwtAuthUser = require("../middleware/jwtAuthUser");
const {
  getCitiesList,
  bookSlot,
  getAreas,
  getSlots,
} = require("../controller/apiController");

const router = express.Router();

router.get("/get-cities", jwtAuthUser, getCitiesList);

router.get("/get-areas/:cityId", jwtAuthUser, getAreas);

router.get("/get-slots/:cityId/:areaId", jwtAuthUser, getSlots);

router.put("/book-slot", jwtAuthUser, bookSlot);

module.exports = router;
