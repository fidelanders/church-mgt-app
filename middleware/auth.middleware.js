var Jwt = require("jsonwebtoken");
var Joi = require("joi");
var dotenv = require("dotenv");
dotenv.config();

// const authToken = async (req, res, next) => {
// 	try {
// 	  const authHeader = req.headers['authorization'];
// 	  const token = authHeader && authHeader.split(' ')[1];
  
// 	  if (token == null) {
// 		return res.status(401).json({
// 		  status: false,
// 		  message: 'Invalid token.'
// 		});
// 	  }
exports.authenticate = async (req, res, next) => {
	try {
		const authorization = req.headers.authorization;
		if (!authorization) {
			return res.status(401).json({ message: "Unauthorised! Access Denied" });
		}
		const authenticationArr = authorization.split(" ");
		if (authenticationArr[0] !== "Bearer") {
			return res.status(401).json({ message: "Unauthorised! Access Denied" });
		}
		const token = authenticationArr[1];
		if (!token) {
			return res.status(401).json({ message: "Unauthorised! Access Denied" });
		}
		Jwt.verify(token, process.env.SECRET, (err, payload) => {
			if (err) {
				return res.status(400).json({message: "Bad Request"});
			} else {
				req.userId = payload.id;
			}
		});

		next();
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
};

exports.validateSignUP = Joi.object({
	first_name: Joi.string().required(),
	last_name: Joi.string().required(),
	phone_number: Joi.string().min(10).max(15).required(),
	email: Joi.string().email({
	  minDomainSegments: 2,
	  tlds: { allow: ["com", "net"] },
	}),
	password: Joi.string().min(8).required(),
  });
  
  exports.validateSignIn = Joi.object({
	email: Joi.string().email(),
	password: Joi.string().min(8).required(),
  });
  
