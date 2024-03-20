const mongoose = require("mongoose");
const {
  cityModel,
  areaModel,
  slotsModel,
} = require("../database-models/cityAreaData");
const bookingDataModel = require("../database-models/bookingData");
const userDataModel = require("../database-models/userData");
const nodemailer = require("nodemailer");

const sendEmailToNotify = (mailContent, email, name, mailSubject) => {
  const transporter = nodemailer.createTransport({
    service: "outlook",
    secure: false,
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASSWORD,
    },
  });

  const message = {
    from: `${process.env.USER_EMAIL}`,
    to: `${email}`,
    subject: mailSubject,
    text: email,
    html: mailContent,
  };

  const messageRes = transporter
    .sendMail(message)
    .then((res) => {
      return;
    })
    .catch((error) => {
      console.log(error.message);
    });
};

exports.getCitiesList = async (request, response) => {
  try {
    const cities = await cityModel.find();

    return response.status(200).json({ citiesList: cities });
  } catch (error) {
    console.log(error.message);
    return response.status(500).json({ message: error.message });
  }
};

exports.getAreas = async (request, response) => {
  try {
    const { cityId } = request.params;
    const areas = await areaModel.find({ cityId: cityId });

    return response.status(200).json({ areasList: areas });
  } catch (error) {
    console.log(error.message);
    return response.status(500).json({ message: error.message });
  }
};

exports.getSlots = async (request, response) => {
  try {
    const { cityId, areaId } = request.params;
    const slots = await slotsModel.find({ cityId: cityId, areaId: areaId });

    return response.status(200).json({ slotsList: slots });
  } catch (error) {
    console.log(error.message);
    return response.status(500).json({ message: error.message });
  }
};

exports.bookSlot = async (request, response) => {
  try {
    const { cityId, areaId, slotId, bookingStatus, timeSlot } = request.body;

    const updateRes = await slotsModel
      .updateOne(
        { cityId: cityId, areaId: areaId, _id: slotId },
        { $set: { bookingStatus: bookingStatus } }
      )
      .then(async () => {
        const bookingSch = new bookingDataModel({
          userId: request.userId,
          dateBooked: new Date(),
          slotId: slotId,
          areaId: areaId,
          cityId: cityId,
          bookedTimeSlot: timeSlot,
          isServiceCompleted: false,
        });

        const saveBooking = bookingSch
          .save()
          .then(async (data) => {
            const userDetail = await userDataModel.findOne({
              _id: request.userId,
            });
            const mailContentFormat = `Your Booking is Confirmed with Id ${data._id}`;
            const mailSubject = "Regarding Your Slot Booking";
            sendEmailToNotify(
              mailContentFormat,
              userDetail.email,
              userDetail.name,
              mailSubject
            );
            return response.status(200).json({
              message: `Your Booking is Confirmed with Id ${data._id}`,
            });
          })
          .catch((error) => {
            console.log(error.message);
            return response.status(400).json({ message: error.message });
          });
      })
      .catch((error) => {
        console.log(error.message);
        return response.status(400).json({ message: error.message });
      });
  } catch (error) {
    console.log(error.message);
    return response.status(500).json({ message: error.message });
  }
};
