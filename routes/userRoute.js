const router = require("express").Router();
const middleware = require("../middleware/auth.middleware");
const controllers = require("../controllers/userController");

router.post("/register", controllers.createUser);
router.post("/verify", controllers.verifyEmail);
router.post("/login", controllers.login);
// router.get("/", middleware.authenticate, controllers.getAllUsers);
// router.get("/:id", middleware.authenticate, controllers.getUserId);

router.get("/", controllers.getAllUsers);
router.get('/:id', controllers.getUserId);

router.patch("/:id",middleware.authenticate, controllers.updateUser);
router.delete("/:id",middleware.authenticate, controllers.deleteUser);

module.exports = router;
