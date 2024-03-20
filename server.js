const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config({ path: "./.env" });
const port = 3030 || process.env.PORT;

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_CONNECTION_URL)
  .then(() => console.log("Db Connected"))
  .catch((error) => console.log(error.message));

// const citiesList = require("./cityAreaList");
// const {
//   cityModel,
//   areaModel,
//   slotsModel,
// } = require("./database-models/cityAreaData");

// const insertSlot = async (city, area, slot) => {
//   const slotSchema = {
//     bookingStatus: slot.bookingStatus,
//     timeSlot: slot.timeSlot,
//     slotExpiry: slot.slotExpiry,
//     areaId: area._id,
//     cityId: city._id,
//   };
//   const slotDetail = new slotsModel(slotSchema);
//   const saveSlot = await slotDetail.save();
//   return;
// };

// const insertArea = async (city, area) => {
//   const areaSchema = {
//     areaName: area.areaName,
//     locationLink: area.locationLink,
//     cityId: city._id,
//   };

//   const areaDetail = new areaModel(areaSchema);
//   const areaSave = await areaDetail.save();

//   for (let eachSlot of area.slots) {
//     insertSlot(city, areaSave, eachSlot);
//   }
//   return;
// };

// const insertData = async (data) => {
//   try {
//     const citySchema = { city: data.city };
//     const cityDetail = new cityModel(citySchema);
//     const saveCity = await cityDetail.save();

//     for (let eachArea of data.areas) {
//       insertArea(saveCity, eachArea);
//     }

//     // await mongoose.disconnect();
//   } catch (e) {
//     console.log(e.message);
//   }
// };

// for (let item of citiesList) {
//   insertData(item);
// }

app.use("/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/apiRoutes"));

app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});
