const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.port || 5000;

// middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.get('/', (req, res) => {
  res.send('Data Will Add Soon. Server is Running Fine');
});
// custom middleware to check url of where the get request coming from
const logger = async (req, res, next) => {
  console.log('called : ', req.host, req.originalUrl);
  next();
};
const adminLogger = async (req, res, next) => {
  console.log('Admin Request From : ', req.host, req.originalUrl);
  next();
};
// verify token
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log('Verify token found : ', token);
  if (!token) {
    return res.status(401).send({ message: 'not authorized' });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: 'Unauthorized' });
    }
    // if token is valid then it will be decoded
    console.log('value in the token : ', decoded);
    req.user = decoded;
    next();
  });
};
// verify admin token
const verifyAdminToken = async (req, res, next) => {
  const token = req.cookies?.adminToken;
  console.log('Verify admin token found : ', token);
  if (!token) {
    return res.status(401).send({ message: 'not authorized' });
  }
  jwt.verify(token, process.env.ADMIN_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: 'Unauthorized' });
    }
    // if token is valid then it will be decoded
    console.log('value in the admin token : ', decoded);
    req.admin = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wnhqwzg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db('carRepairServices');
    const servicesCollection = database.collection('servicesCollection');
    const serviceBookingCollection = database.collection(
      'serviceBookingCollection'
    );

    // post data to services collection
    app.post('/addServices', (req, res) => {});

    // get data from services collection
    app.get('/services', logger, async (req, res) => {
      const cursor = servicesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // get single data from services collection by id
    app.get('/services/:id', logger, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesCollection.findOne(query);
      res.send(result);
    });

    // post services booking data
    app.post('/serviceBooking', async (req, res) => {
      const newBooking = req.body;
      console.log('New Service Booking for : ', newBooking);
      const result = await serviceBookingCollection.insertOne(newBooking);
      res.send(result);
    });

    // get all servicesBookingData
    app.get('/allBookings', adminLogger, verifyAdminToken, async (req, res) => {
      if (process.env.ADMIN_EMAIL !== req.admin.email) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      const cursor = serviceBookingCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // get services booking data by user email
    app.get('/bookings', logger, verifyToken, async (req, res) => {
      console.log('User in the valid token : ', req.user);

      if (req.query?.email !== req.user.email) {
        return res.status(403).send({ message: 'forbidden access' });
      }

      let query = {};
      if (req.query?.email) {
        query = { userEmail: req.query?.email };
      }
      const cursor = serviceBookingCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // auth related api
    app.post('/jwt', logger, async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h',
      });
      console.log(token);
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: false, //when you will be in production mode make it true if your domain is ssl certified means https
          sameSite: 'lax',
        })
        .send({ success: true });
    });

    // generate token for admin email
    app.post('/admin', adminLogger, async (req, res) => {
      const adminEmail = req.body;
      console.log('Admin email : ', adminEmail);
      const token = jwt.sign(adminEmail, process.env.ADMIN_TOKEN_SECRET, {
        expiresIn: '1h',
      });
      res
        .cookie('adminToken', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
        })
        .send({ success: true });
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.log);

app.listen(port, () => {
  console.log('Server is running on Port: ', port);
});
