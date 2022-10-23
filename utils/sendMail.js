var nodemailer = require("nodemailer");
var dotenv = require("dotenv");
dotenv.config();

exports.sendMail = async (config) => {
	try {
		const transporter = nodemailer.createTransport({
			host: "smtp.ethereal.email",
			port: 465,
			secure: true,
			auth: {
				user: process.env.userEmail,
				pass: process.env.userPassword,
			},
			tls: {
			  rejectUnauthorized: false,
			},
		});
		const info = await transporter.sendMail({
			...config,
		});
		transporter.verify(function(error, success) {
			if (error) {
				  console.log(error);
			} else {
				  console.log('Server is ready to take our messages');
			}
		  });

		console.log(`Preview URL: %s`, nodemailer.getTestMessageUrl(info));
	} catch (error) {
		console.log(error.message);
	}
};

