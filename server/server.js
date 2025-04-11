const dotenv = require('dotenv');
const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const RedisStore = require('connect-redis')(session);
const { createClient } = require('redis');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const app = express();
const port = process.env.SERVER_PORT || 3000;
const server = http.createServer(app);

const redisClient = createClient({
  url: process.env.REDIS_URL,
  legacyMode: true,
});
redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis client connected'));
redisClient.connect().catch((err) => console.error('Redis connection failed:', err));

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
    store: new RedisStore({
      client: redisClient,
      prefix: 'sess:', 
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      path: '/', 
    },
    name: 'connect.sid', 
  })
);

app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session Data:', req.session);
  next();
});

const apiRouter = express.Router();
apiRouter.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store',
  });
  next();
});

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

app.use('/api', apiRouter);
apiRouter.use('/tech', techRoute);
apiRouter.use('/service', servicesRoute);
apiRouter.use('/auth/google', loginRoute);
apiRouter.use('/business', businessesRoute);
apiRouter.use('/sign_in', signInRoute);
apiRouter.use('/service_record', serviceRecordRoute);
apiRouter.use('/user', userRoute);
apiRouter.use('/edit', editRoute);
apiRouter.use('/demo', demoRoute);

apiRouter.get('/test-redis', async (req, res) => {
  try {
    await redisClient.set('test', 'hello');
    const value = await redisClient.get('test');
    res.status(200).json({ message: 'Redis working', value });
  } catch (error) {
    console.error('Redis test error:', error);
    res.status(500).json({ error: 'Redis test failed' });
  }
});

app.set('views', __dirname);
app.set('view engine', 'jsx');
app.engine('jsx', require('express-react-views').createEngine());

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  connectDB();
});