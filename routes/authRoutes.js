const express = require("express");

const {
  signup,
  userSignupMailVerify,
  userLogin,
  userPasswordResetMailCheck,
  userPasswordReset,
} = require("../controller/controller");
const jwtAuthUser = require("../middleware/jwtAuthUser");
const userDataModel = require("../database-models/userData");

const router = express.Router();

router.post("/register-user-srps", signup);

router.post("/verify-user-email-srps", userSignupMailVerify);

router.post("/login-user-srps", userLogin);

router.post("/user-password-mail-check-reset", userPasswordResetMailCheck);

router.put("/user-password-reset", userPasswordReset);

router.get("/user-profile", jwtAuthUser, async (request, response) => {
  try {
    const { userId } = request.params;
    let userInfo = await userDataModel.findOne({ _id: userId });

    return response.status(200).json({ userInfo });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ message: error.message });
  }
});

module.exports = router;
