const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  checkUsernameExists,
  validateRoleName,
  checkUsernameFree,
} = require("./auth-middleware");
const { JWT_SECRET, BCRYPT_ROUNDS } = require("../secrets"); // use this secret!
const { add, findBy, findById } = require("../users/users-model");

router.post("/register", checkUsernameFree, validateRoleName, async (req, res, next) => {
  /**
    [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }

    response:
    status 201
    {
      "user"_id: 3,
      "username": "anna",
      "role_name": "angel"
    }
   */
  try {
    const { username, password } = req.body;
    const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);

    const [newUser] = await add({ username, password: hash, role_name: req.role_name });
    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
});

router.post("/login", checkUsernameExists, async (req, res, next) => {
  /**
    [POST] /api/auth/login { "username": "sue", "password": "1234" }

    response:
    status 200
    {
      "message": "sue is back!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
    }

    The token must expire in one day, and must provide the following information
    in its payload:

    {
      "subject"  : 1       // the user_id of the authenticated user
      "username" : "bob"   // the username of the authenticated user
      "role_name": "admin" // the role of the authenticated user
    }
   */
  function tokenBuilder(user) {
    const payload = {
      subject: user.user_id,
      role_name: user.role_name,
      username: user.username,
    };

    const options = {
      expiresIn: "1d",
    };

    return jwt.sign(payload, JWT_SECRET, options);
  }

  if (bcrypt.compareSync(req.body.password, req.user.password)) {
    const token = tokenBuilder(req.user);
    res.json({ message: `${req.user.username} is back!`, token });
  } else {
    next({ status: 401, message: "Invalid credentials" });
  }
});

module.exports = router;
