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
  const registerUser = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(registerUser);

  if (dbUser === undefined) {
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUser = `INSERT INTO user (username,password,name,gender) VALUES 
        ('${username}','${hashPassword}','${name}','${gender}');`;
      await db.run(createUser);
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

app.get("/user/tweets/feed/", async (request, response) => {
  /*const {
    limit = 4,
    order = "DESC",
    order_by = "username",
    search_q = "",
  } = request.query;*/
  //const { userId } = request.body;
  const tweetUser = `SELECT
    user.username, tweet.tweet, tweet.date_time AS dateTime
  FROM
     user
    INNER JOIN  tweet ON tweet.user_id = user.user_id
    
  ORDER BY
    tweet.date_time DESC
  LIMIT 4;`;
  const getQuery = await db.all(tweetUser);
  response.send(getQuery);
});

//API 4

app.get("/user/following/", async (request, response) => {
  const getNames = `SELECT DISTINCT(name) FROM user INNER JOIN follower ON user.user_id = follower.follower_user_id`;
  const followerNames = await db.all(getNames);
  response.send(followerNames);
});

//API 5

app.get("/user/followers/", async (request, response) => {
  const getNames = `SELECT DISTINCT(name) FROM user INNER JOIN follower ON user.user_id = follower.following_user_id`;
  const followerNames = await db.all(getNames);
  response.send(followerNames);
});

//API 10

app.post("/user/tweets/", async (request, response) => {
  const { tweet } = request.body;
  const newTweet = `INSERT INTO tweet (tweet) VALUES ('${tweet}');`;
  await db.run(newTweet);
  response.send("Created a Tweet");
});
module.exports = app;
