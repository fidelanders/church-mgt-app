var { v4 } = require("uuid");
var db = require("../database/db");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var validate = require("../middleware/auth.middleware");
var smtp = require("../utils/sendMail");
var {
  allUsers,
  checkEmail,
  findUser,
  getUser,
  loginUser,
  newUser,
  removeUser,
  updateVerified,
  verifyMail,
} = require("../utils/queries");


// Add a new User
const createUser = async (req, res) => {
  try{
  const { first_name, last_name, email, phone_number, password } = req.body;
  const hashPassword = await bcrypt.hash(password, 10);

  // validating reg.body with joi
  await validate.validateSignUP.validateAsync(req.body);

  // checking if a user already has an account
  db.query(checkEmail, [req.body.email], (err, rows) => {
    if (err) {
      return res.status(401).json({
        status: "401",
        message: "An error occurred, please contact the system Admin",
      });
    }

    if (rows.length) {
      return res.status(400).json({
        message: "User already exist",
      });
    }

    // creating a new user
    const users = {
      id: v4(),
      first_name: first_name,
      last_name: last_name,
      email: email,
      phone_number: phone_number,
      password: hashPassword,
    };
    db.query(
      newUser,
      [
        users.id,
        users.first_name,
        users.last_name,
        users.email,
        users.phone_number,
        users.password,
      ],
      (err, _) => {
        if (err) {
          console.log(err);
          return res.status(401).json({
            message: "An error occurred, please contact the system Admin",
          });
        }
        // creating a payload
        const payload = {
          id: users.id,
          email: users.email,
        };

        const token = jwt.sign(payload, process.env.SECRET, {
          expiresIn: "2h",
        });
        
        let mailOptions = {
          from: process.env.user,
          to: users.email,
          subject: "Verify Email",
          text: `Hi ${first_name}, Please verify your email.
		   ${token}`,
        };
        smtp.sendMail(mailOptions);
        return res.status(201).json({ 
          status: true,
          message: "User created",
          data:{
            first_name: first_name,
            last_name:last_name,
            email: email,
          },
          token: token });
      }
    );
  });
} catch (error) {
  return res.status(500)
    .json({
      status: false,
      message: 'Internal server error',
      errors: error
    });
  }
};

// verifying Email
const verifyEmail = async (req, res) => {
try{
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

  jwt.verify(token, process.env.SECRET, (err, payload) => {
    if (err) { 
      return res.status(500).json({ 
        auth: false, 
        message: 'Failed to authenticate token.' 
      });
    }
    
    req.email = payload.email;
  });
  db.query(verifyMail, [req.email], (err, rows) => {
    if (err) {
      return res.status(401).json({
        message: "An error occurred, please contact the system Admin",
      });
    }

    if (rows[0].is_verified) {
      return res.status(200).json({
        message: "user verified already",
      });
    }
    db.query(updateVerified, [req.email]);
    return res.status(200).json({ message: "User verified successfully" });
  });
} catch (error) {
  return res.status(500)
    .json({
      status: false,
      message: 'Internal server error',
      errors: error
    });
  }
};

// logging in a user
const login = async (req, res) => {
  try{
  const { email, password } = req.body;

  // validate with joi
  await validate.validateSignIn.validateAsync(req.body);

  //  checking email and password match
  if (email && password) {
    db.query(loginUser, [email], (err, rows) => {
      if (err) {
        return res.status(401).json({
          message: "An error occurred, please contact the system Admin",
        });
      }
      if (!rows.length) {
        return res.status(400).json({
          message: "email address not found.",
        });
      }
      const passMatch = bcrypt.compare(password, rows[0].password);
      if (!passMatch) {
        return res.status(400).json({ message: "incorrect details" });
      }
      if (!rows[0].is_verified) {
        return res.status(400).json({
          message: "Unverified account.",
        });
      }

      // creating a payload
      const payload = {
        id: rows[0].id,
        email: rows[0].email,
      };

      const token = jwt.sign(payload, process.env.SECRET, {
        expiresIn: "1h",
      });
      return res.status(200).json({
        message: "User logged in successfully",
        token: token,
      });
    });
  }
} catch (error) {
  return res.status(500)
    .json({
      status: false,
      message: 'Internal server error',
      errors: error
    });
  }
};

// Fetch all Users
// const getAllUsers = (req, res) => {
//   try{
//   db.query(allUsers, (err, rows, fields) => {
//     if (err) {
//       return res.status(500).json({
//         status: false,
//         message: "An error occurred, please contact the system Admin",
//       });
//     }
//     return res.status(200).json({
//       status :true,
//       message: "Users fetched successfully",
//       data:rows});
//   });
// } catch (error) {
//   return res.status(500)
//     .json({
//       status: false,
//       message: 'Internal server error',
//       errors: error
//     });
//   }
// }

const getAllUsers = async(req,res) => {
  db.query('SELECT * from users', (err, result) => {
    if (err) {
      res.status(500).send('Error retrieving users from database');
    } else {
      res.json(result);
    }
  });
};

// Get User By ID
// const getAUser = async (req, res) => {
//   const userId = req.params;
//   try {
//   await db.query(getUser, [userId], (err, results) => {
//     if (err) {
//       return res.status(500).json({
//         status : false,
//         message: "Error retrieving user",
//       });
//     }
//   // } else {
//   //   if(result.length) res.json(result[0]);
//   //   else res.status(404).send('User not found');
//   // }

//     if (!results.length) {
//       return res.status(404).json({
//         status: false,
//         message: "User not found",
//       });
//     } else {
//     return res.status(200).json(results[0]);
//     }
//   });
// } catch (error) {
//   return res.status(500)
//     .json({
//       status: false,
//       message: 'Internal server error',
//       errors: error
//     });
//   }
// };

// const getUserId = async (req, res) => {
//   const userId = req.params;
//   db.query('select * from users where id = ?', userId, (err, result) => {
//     if (err) {
//       res.status(500).send('Error retrieving user');
//     } else {
//       // if(result.length) 
//       res.json(result);
//       // else res.status(404).send('User not found');
//     }
//   });
// };

// Update User By ID
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, phone_number, password } = req.body;
  db.query(findUser, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "An error occurred, please contact the system Admin",
      });
    }
    if (!rows.length) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    if (rows[0].id !== req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (first_name) {
      db.query("UPDATE users SET first_name = ? WHERE id = ?", [
        first_name,
        id,
      ]);
    }
    if (last_name) {
      db.query("UPDATE users SET last_name = ? WHERE id = ?", [last_name,id]);
    }
    if (phone_number) {
      db.query("UPDATE users SET phone_number = ? WHERE id = ?", [
        phone_number,
        id,
      ]);
    }
    if (password) {
      const hashPassword = bcrypt.hash(password, 10);
      db.query("UPDATE users SET password = ? WHERE id = ?", [hashPassword, id]);
    }
    return res.status(200).json({
      message: "Update was successful",
    });
  });
};

// Delete User By ID
const deleteUser = async (req, res) => {
  const { id } = req.params;
  db.query(getUser, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "An error occurred, please contact the system Admin",
      });
    }
    if (!rows.length) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    if (rows[0].id !== req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    db.query(removeUser, [id]);
    return res.status(410).json({
      message: "User successfully deleted",
    });
  });
};

module.exports = {
  createUser,
  verifyEmail,
  login,
  getAllUsers,
  // getUserId,
  updateUser,
  deleteUser,
};
