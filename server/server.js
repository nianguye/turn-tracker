const dotenv = require('dotenv');
const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const app = express();
const port = process.env.SERVER_PORT || 3000;
const server = http.createServer(app);

app.use(
  cors({
    origin: process.env.APP_URL, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,

    },
  })
);
app.set('trust proxy', 1);

const socketOrigin = process.env.NODE_ENV === 'production'
  ? process.env.APP_URL
  : `${process.env.APP_URL}:${process.env.CLIENT_PORT}`;
const io = new Server(server, {
  cors: {
    origin: socketOrigin,
    methods: ['GET', 'POST'],
  },
});
io.on('connection', (socket) => {
  console.log(`User CONNECTED: ${socket.id}`);
  socket.on('join_room', (data) => {
    console.log(`JOINED ROOM: ${data}`);
    socket.join(data);
  });
  socket.on('refresh_home', (data) => {
    console.log('Broadcasting To:', data.room);
    socket.broadcast.to(data.room).emit('receive_home_refresh', data);
  });
});

async function connectDB() {
  try {
    await mongoose.connect(process.env.ATLAS_URI);
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
    process.exit(1);
  }
}

const techRoute = require('./routes/technicians');
const servicesRoute = require('./routes/services');
const loginRoute = require('./routes/googleLogin');
const businessesRoute = require('./routes/businesses');
const signInRoute = require('./routes/sign_in');
const serviceRecordRoute = require('./routes/service_record');
const userRoute = require('./routes/user');
const editRoute = require('./routes/editBusiness');
const demoRoute = require('./routes/demo');

app.use('/api/tech', techRoute);
app.use('/api/service', servicesRoute);
app.use('/auth/google', loginRoute);
app.use('/api/business', businessesRoute);
app.use('/api/sign_in', signInRoute);
app.use('/api/service_record', serviceRecordRoute);
app.use('/api/user', userRoute);
app.use('/api/edit', editRoute);
app.use('/api/demo', demoRoute);

app.set('views', __dirname);
app.set('view engine', 'jsx');
app.engine('jsx', require('express-react-views').createEngine());

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  connectDB();
});