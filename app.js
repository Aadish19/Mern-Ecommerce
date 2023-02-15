const path = require("path");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
/* const multer = require("multer"); */
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();
// require("dotenv").config();

/* const XStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime().toString() + "-" + file.originalname);
  },
}); */
/* const filefilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}; */
const mongoDBstore = require("connect-mongodb-session")(session);
const store = new mongoDBstore({
  uri: process.env.DB_URL,
  collection: "sessions",
});

const errorController = require("./controllers/error");
const User = require("./models/user");
const accessLogStreams = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const { collection, db } = require("./models/user");
app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStreams }));
app.use(bodyParser.urlencoded({ extended: false }));
/* app.use(
  multer({ storage: XStorageEngine, fileFilter: filefilter }).single("image")
); */
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
  session({
    secret: "myNameisDhanush",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => {
      throw new Error(err);
    });
});
app.use(flash());

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);
const config = require('./config.json');

// const env = process.env.NODE_ENV.toString() || 'development';

// if(env === 'test' || env === 'development') {
//     const envConfig = config[env];
//     Object.keys(envConfig).forEach(key => {
//         process.env[key] = envConfig[key];
//     });
// };


const connectDB =  async ()=>{

  try{
      const conn = await mongoose.connect(process.env.MONGO_URI,{
          //must add in order to not get any error masseges:
          useUnifiedTopology:true,
          useNewUrlParser: true,
          useCreateIndex: true
      })
      console.log(`mongo database is connected!!! ${conn.connection.host} `)
  }catch(error){
      console.error(`Error: ${error} `)
      process.exit(1) //passing 1 - will exit the proccess with error
  }

}

mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => {
    console.log(err);
  });
