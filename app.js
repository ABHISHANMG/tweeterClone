const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
app.use(express.json());
const path = require("path");

const dbPath = path.join(__dirname, "twitterClone.db");
let db = null;

const initializeDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server working http://localhost/3000");
    });
  } catch (error) {
    console.log(`Error ${error.message}`);
    process.exit(1);
  }
};
initializeDatabase();

//API 1

app.post("/register", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const hashPassword = await bcrypt.hash(password, 10);
  const registerUser = `SELECT * FROM user WHERE username = '${username};`;
  const dbUser = await db.get(registerUser);

  if (dbUser === undefined) {
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUser = `INSERT INTO user (username,password,name,gender) VALUES 
        ('${username}','${hashPassword},'${name}','${gender}'`;
      const dbResponse = await db.run(createUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2

const authentication = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payLoad) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3 

app.get('/user/tweets/feed/',authentication,async(request,response)=>{
    const {offset = 2, limit = 5,order = "ASC",order_by = "",search_q = "",
  } = request.query;
    const tweetUser = `SELECT * FROM user INNER JOIN tweet ON user.user_id = tweet.user_id 
    WHERE  
    `
})


module.exports = app;
