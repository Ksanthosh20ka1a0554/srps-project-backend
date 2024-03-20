const jwt = require("jsonwebtoken");

const jwtAuthUser = (request, response, next) => {
  let jwtToken;

  const authHeaders = request.headers["authorization"];

  if (authHeaders !== undefined) {
    jwtToken = authHeaders.split(" ")[1];
  }

  if (authHeaders === undefined) {
    return response.status(401).json({ message: "No JWT token provided" });
  } else {
    jwt.verify(
      jwtToken,
      process.env.LOGIN_USER_TOKEN,
      async (error, payload) => {
        if (error) {
          return response.status(401).json({ message: "Invalid JWT token" });
        } else {
          request.userId = payload.userId;
          next();
        }
      }
    );
  }
};

module.exports = jwtAuthUser;
