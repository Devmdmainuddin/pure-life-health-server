const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// middlewares
const logger = async (req, res, next) => {
  console.log('called :', req.host, req.originalUrl)
  next()
}
//


const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log('value of token in middieware', token)
  if (!token) {
    return res.status(401).send({ message: 'not authorized' })
  }
  jwt.verify(token, process.env.ACCRSS_TOKEN_SECRET, (err, decoded) => {
    // error
    if (err) {
      console.log(err)
      return res.status(401).send({ message: 'unauthorized' })
    }
    // if token is valid
    console.log('value in the token', decoded)
    req.user = decoded;
    next()
  })

}

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.sk1ew0y.mongodb.net/?retryWrites=true&w=majority&appName=cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    await client.connect();


    const pureLifeHealthproduct = client.db("lifeHealth").collection("product")
    const pureLifeHealthCategorey = client.db("lifeHealth").collection("categorey")
    const pureLifeHealthUsers = client.db("lifeHealth").collection("users")
    const pureLifeHealthOrder = client.db("lifeHealth").collection("order")


    app.get('/cartItems', async (req, res) => {
      const carsor = pureLifeHealthproduct.find();
      const result = await carsor.toArray();
      res.send(result)
    })
    app.get('/cartItems/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await pureLifeHealthproduct.findOne(query)
      res.send(result);
    })
    app.get('/cartItem/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const options = {
        projection: { _id: 1, title: 1, price: 1, email: 1, image: 1 },
      };
      const result = await pureLifeHealthproduct.findOne(query, options)
      res.send(result);
    })


    app.post('/addCartItems', async (req, res) => {
      const art = req.body;
      console.log('properties', art)
      const result = await pureLifeHealthproduct.insertOne(art)
      res.send(result);
    })

    app.get('/categorey', async (req, res) => {
      const carsor = pureLifeHealthCategorey.find();
      const result = await carsor.toArray();
      res.send(result)
    })

    app.post('/addCategorey', async (req, res) => {
      const art = req.body;
      console.log('properties', art)
      const result = await pureLifeHealthCategorey.insertOne(art)
      res.send(result);
    })

    app.post('/order', async (req, res) => {
      const art = req.body;
      console.log('properties', art)
      const result = await pureLifeHealthOrder.insertOne(art)
      res.send(result);
    })

    app.get('/myOrder',verifyToken, async (req, res) => {
      console.log(req.query.email)
      console.log('user in the valid token', req.user)
      if(req.query.email !== req.user.email){
        return res.status(403).send({message: 'forbidden access'})
      }
      
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await pureLifeHealthOrder.find(query).toArray();
      res.send(result)
    })
    app.delete('/myOrder/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await pureLifeHealthOrder.deleteOne(query)
      res.send(result);
      console.log('delete', id)
    })






    app.get('/users', async (req, res) => {
      const carsor = pureLifeHealthUsers.find();
      const result = await carsor.toArray();
      res.send(result)
    })

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCRSS_TOKEN_SECRET, { expiresIn: '1h' })
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict'
      }).send({ success: true })
    })
    app.post('/logout',async (req,res)=>{
      const user = req.body;
      console.log('logging out',user);
      res.clearCookie('token',{maxAge:0}).send({ success: true })
    })


    app.post('/users', async (req, res) => {
      const user = req.body;
      console.log('new user', user);
      const result = await pureLifeHealthUsers.insertOne(user);
      res.send(result);
    });


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

    // await client.close();
  }
}
run().catch(console.dir);








app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})