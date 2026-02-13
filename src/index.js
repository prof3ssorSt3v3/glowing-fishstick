import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken'; //jwt.sign() jwt.verify()
import path from 'node:path';
import dotenv from 'dotenv';
const dir = process.cwd();
const file = path.resolve(dir, '.env.local');
dotenv.config({ path: file, debug: true, encoding: 'utf-8' });
import { createClient } from 'redis';

const redisClient = await createClient({
  url: process.env.REDIS_URL,
})
  .on('error', (err) => {
    console.log('Redis does not like me. Much sad.');
    console.log(err);
  })
  .connect();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  //home route
  res.send('Redis is alive');
});

class UserService {
  constructor() {}

  static validateUser(req, res, next) {
    if (req.body.email && req.body.password) {
      //pretend to look the user id up in a database...
      req.user = { id: crypto.randomUUID() };
      next();
    } else {
      res.status(401).json({ error: 401, message: 'Invalid Login Attempt' });
    }
  }
  static signToken(req, res, next) {
    //we want to put the user id into a signed token
    const token = jwt.sign(req.user, process.env.JWT_SECRET);
    req.token = token;
    next();
  }
  static verifyToken(req, res, next) {
    //we need the Authorization header with the bearer token
    try {
      let token = req.get('Authorization');
      console.log(token);
      if (!token) throw new Error('Missing Authorization header');
      //make sure Authorization header exists
      token = token.replace(/^bearer\s/i, '');
      console.log('trimmed:', token);
      let decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      //make sure decodeToken is returned
      let id = decodedToken.id;
      //make sure that id is inside decodedToken... error
      req.user = { id: id };
      next();
    } catch (err) {
      console.log(err);
      res.status(401).json({ error: 401, message: 'UNAuthorized.' });
    }
  }
}
app.get('/api', UserService.verifyToken, async (req, res) => {
  let ppl = await DataService.getAllPeople();
  res.json({ people: ppl });
  //this return value takes 1 second before the response
});

app.get('/api/:id', async (req, res) => {
  try {
    let person = await DataService.getOnePerson(req.params.id);
    res.json({ person });
  } catch (err) {
    res.status(418).json({ error: 418, message: 'I am a teapot' });
  }
});

app.post('/api/auth/login', UserService.validateUser, UserService.signToken, (req, res) => {
  // res.status(200).json({ error: 'maybe' });
  res.cookie('token', req.token);
  //save the token as a cookie on the response
  //we could also send it back in the body
  res.status(200).json({ message: 'Successful Login', token: req.token });
});

const PORT = process.env.PORT;
app.listen(PORT, (err) => {
  if (err) {
    console.log(err.message);
    return;
  }
  console.log(`Listening on PORT ${PORT}`);
});

const people = [
  { id: 1, name: 'Aymen' },
  { id: 2, name: 'Jimmy' },
  { id: 3, name: 'Thomas' },
  { id: 4, name: 'Jade' },
  { id: 5, name: 'Xavier' },
  { id: 6, name: 'Nkhenny' },
  { id: 7, name: 'Edgard' },
  { id: 8, name: 'Art' },
  { id: 9, name: 'Megan' },
];

class DataService {
  constructor() {
    this.name = 'DataService';
  }
  static encodeKey(id) {
    return `APersonWithAnID${id}`;
  }
  static getAllPeople() {
    //get the data from the people array (database)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        //create a fake delay of 1 seconds to get the data
        resolve(people);
      }, 1000);
    });
  }
  static async getOnePerson(id) {
    // get the person from the cache if they are already in the cache
    //OR go to the array (database) to retrieve the one
    const key = DataService.encodeKey(id);
    const match = await redisClient.get(key);
    if (match) {
      return JSON.parse(match); //the person object from the cache
    }

    const person = people.find((p) => p.id === +id);
    if (person) {
      await redisClient.set(key, JSON.stringify(person), {
        EX: 60 * 5, //save for 5 minutes
      });
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          //create a fake delay of 1 seconds to get the data
          resolve(person);
        }, 1000);
      });
    } else {
      throw new Error('Tony broke my database');
    }

    //NO PERSON MATCH
    //throw error?
    //return null
    //blame Steve
    //blame Tony

    // Number(id)
    // parseInt(id)
    // +id
    // if(!person)
  }
}

// DataService.getAllPeople().then((ppl)=>{});

// let ppl = await DataService.getAllPeople();
