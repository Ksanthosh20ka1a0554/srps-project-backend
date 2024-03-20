const userDataModel = require("../database-models/userData");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const validator = require("validator");
const nodemailer = require("nodemailer");
const { isValidPhoneNumber } = require("libphonenumber-js");

const validatePassword = (password) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[A-Za-z\d@.#$!%*?&]{6,12}$/;

  if (passwordRegex.test(password)) {
    return true;
  }

  return false;
};

const validatePhoneNumber = (number) => {
  const splitedNum = number.split("-");
  const joinedNum = splitedNum.join("");
  return isValidPhoneNumber(joinedNum);
};

const sendEmailToVerify = (mailContent, email, name, mailSubject) => {
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

const generateVerificationToken = (user) => {
  const emailVerificationToken = jwt.sign(
    { userId: user._id },
    process.env.EMAIL_VERIFICATION_TOKEN,
    { expiresIn: "1hr" }
  );

  return emailVerificationToken;
};

const generatePasswordResetToken = (user) => {
  const passwordResetToken = jwt.sign(
    { userId: user._id },
    process.env.PASSWORD_RESET_TOKEN,
    { expiresIn: "10min" }
  );

  return passwordResetToken;
};

exports.signup = async (request, response) => {
  const { email, password, name, phoneNumber } = request.body;
  if (!email) {
    return response.status(422).json({ message: "Email is Empty" });
  }

  try {
    const isMailExists = await userDataModel.findOne({ email: email }).exec();
    const isPhoneNumberExists = await userDataModel.findOne({
      phoneNumber: phoneNumber,
    });

    if (isMailExists) {
      return response.status(400).json({ message: "Email Already Exists" });
    } else if (isPhoneNumberExists) {
      return response
        .status(400)
        .json({ message: "Phone Number Already Exists" });
    } else {
      if (validator.isEmail(email) && validatePhoneNumber(phoneNumber)) {
        const isPasswordValid = validatePassword(password);
        if (isPasswordValid) {
          const hashedPassword = await bcrypt.hash(password, 10);
          const userDetails = new userDataModel({
            name: name,
            email: email,
            phoneNumber: phoneNumber,
            password: hashedPassword,
          });

          const isSaved = await userDetails.save();

          const verificationToken = generateVerificationToken(isSaved);
          const mailContentFormat = `<p>Hi ${name}, Please Verify Your Mail. The token expires in 24 hours.</p><a href=${`http://localhost:3000/user-mail-verify-srps/${verificationToken}`}>Click Here</a>`;
          const mailSubject = "Regarding Your Mail Verification";
          sendEmailToVerify(mailContentFormat, email, name, mailSubject);
          return response
            .status(200)
            .json({ message: `Mail sent to ${email}, Please Verify` });
        } else {
          return response.status(400).json({
            message:
              "Password must contain at least one lowercase alphabet, uppercase alphabet, Numeric digit and special character, Length between 6 and 12",
          });
        }
      } else {
        return response.status(400).json({
          message: "Invalid Email or Phone Number",
        });
      }
    }
  } catch (error) {
    console.log(error.message);
    return response.status(500).json({ message: error.message });
  }
};

exports.userSignupMailVerify = async (request, response) => {
  try {
    let jwtToken;

    const authHeaders = request.headers["authorization"];

    if (authHeaders !== undefined) {
      jwtToken = authHeaders.split(" ")[1];
    }

    if (authHeaders === undefined) {
      return response
        .status(401)
        .json({ message: "UnAuthorized Request, No Token Provided" });
    } else {
      jwt.verify(
        jwtToken,
        process.env.EMAIL_VERIFICATION_TOKEN,
        async (error, payload) => {
          if (error) {
            return response
              .status(401)
              .json({ message: "UnAuthorized Request, Token Invalid" });
          } else {
            const userResponse = await userDataModel.findOne({
              _id: payload.userId,
            });

            if (userResponse) {
              await userDataModel.updateOne(
                { _id: userResponse._id },
                { $set: { isEmailVerified: true } }
              );
              const mailContentFormat = `<p>Hi ${userResponse.name}, Your Mail Verification Success.</p>`;
              const mailSubject = "Regarding Your Mail Verification";
              sendEmailToVerify(
                mailContentFormat,
                userResponse.email,
                userResponse.name,
                mailSubject
              );
              return response
                .status(200)
                .json({ message: "User Mail Verification Success" });
            } else {
              return response
                .status(400)
                .json({ message: "Something Went wrong, Mail not Verified" });
            }
          }
        }
      );
    }
  } catch (error) {
    console.log(error.message);
    return response.status(500).json({ message: error.message });
  }
};

exports.userLogin = async (request, response) => {
  try {
    const { email, password } = request.body;

    let checkUser = await userDataModel.findOne({
      email: email,
    });

    if (checkUser !== null) {
      if (checkUser.isEmailVerified) {
        const comparePassword = await bcrypt.compare(
          password,
          checkUser.password
        );
        if (comparePassword) {
          const payload = {
            userId: checkUser._id,
          };

          const jwtToken = jwt.sign(payload, process.env.LOGIN_USER_TOKEN, {
            expiresIn: "6h",
          });

          return response
            .status(200)
            .json({ token: jwtToken, message: "Successfully Logged in" });
        } else {
          return response
            .status(400)
            .json({ message: "Please Enter Correct Password" });
        }
      } else {
        const token = generateVerificationToken(checkUser);
        const mailContentFormat = `<p>Hi ${
          checkUser.name
        }, Please Verify Your Mail. The token expires in 24 hours.</p><a href=${`http://localhost:3000/user-mail-verify-srps/${token}`}>Click Here</a>`;
        const mailSubject = "Regarding Your Mail Verification";
        sendEmailToVerify(
          mailContentFormat,
          email,
          checkUser.name,
          mailSubject
        );
        return response.status(400).json({
          message:
            "Your Email is not Verified, Please Verify it by clicking on the link we sent to your email.",
        });
      }
    } else {
      return response.status(400).json({ message: "Invalid Email" });
    }
  } catch (error) {
    console.log(error.message);
    return response.status(500).json({ message: error.message });
  }
};

exports.userPasswordResetMailCheck = async (request, response) => {
  try {
    const { email } = request.body;
    const isUserExists = await userDataModel.findOne({ email: email });
    if (isUserExists) {
      const token = generatePasswordResetToken(isUserExists);
      const mailContentFormat = `<p>Hi ${
        isUserExists.name
      }, Please Reset Your Password. The token expires in 10 minutes.</p><a href=${`http://localhost:3000/user-password-reset-srps/${token}`}>Click Here</a>`;
      const mailSubject = "Regarding Your Password Reset";
      sendEmailToVerify(
        mailContentFormat,
        email,
        isUserExists.name,
        mailSubject
      );
      return response
        .status(200)
        .json({ message: "Mail Sent To Reset Password" });
    } else {
      return response.status(400).json({ message: "Email Not Found" });
    }
  } catch (error) {
    console.log(error.message);
    return response.status(500).json({ message: error.message });
  }
};

exports.userPasswordReset = async (request, response) => {
  try {
    const { password } = request.body;

    let jwtToken;

    const authHeaders = request.headers["authorization"];

    if (authHeaders !== undefined) {
      jwtToken = authHeaders.split(" ")[1];
    }

    if (authHeaders === undefined) {
      return response
        .status(401)
        .json({ message: "UnAuthorized Request, No Token Provided" });
    } else {
      jwt.verify(
        jwtToken,
        process.env.PASSWORD_RESET_TOKEN,
        async (error, payload) => {
          if (error) {
            return response
              .status(401)
              .json({ message: "UnAuthorized Request, Token Invalid" });
          } else {
            if (validatePassword(password)) {
              const userResponse = await userDataModel.findOne({
                _id: payload.userId,
              });
              if (userResponse) {
                const comparePassword = await bcrypt.compare(
                  password,
                  userResponse.password
                );
                if (!comparePassword) {
                  const hashedPassword = await bcrypt.hash(password, 10);
                  await userDataModel.updateOne(
                    { _id: userResponse._id },
                    { $set: { password: hashedPassword } }
                  );
                  const mailContentFormat = `<p>Hi ${userResponse.name}, Password updated successfully. `;
                  const mailSubject = "Regarding Your Password Reset";
                  sendEmailToVerify(
                    mailContentFormat,
                    userResponse.email,
                    userResponse.name,
                    mailSubject
                  );
                  return response
                    .status(200)
                    .json({ message: "Password Updated Successfully" });
                } else {
                  return response.status(400).json({
                    message: "Password must be different compared to old one",
                  });
                }
              } else {
                return response
                  .status(400)
                  .json({ message: "Invalid Password" });
              }
            } else {
              const mailContentFormat = `<p>Hi ${userResponse.name}, Something went wrong password not updated. `;
              const mailSubject = "Regarding Your Password Reset";
              sendEmailToVerify(
                mailContentFormat,
                userResponse.email,
                userResponse.name,
                mailSubject
              );
              return response.status(400).json({
                message: "Something Went wrong, Password Not Updated",
              });
            }
          }
        }
      );
    }
  } catch (error) {
    console.log(error.message);
    return response.status(500).json({ message: "Internal server error" });
  }
};
