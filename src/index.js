import express from 'express';
import cors from 'cors';
import path from 'node:path';
import dotenv from 'dotenv';
const dir = process.cwd();
const file = path.resolve(dir, '.env.local');
dotenv.config({ path: file, debug: true, encoding: 'utf-8' });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  //home route
});

const PORT = process.env.PORT;
app.listen(PORT, (err) => {
  if (err) {
    console.log(err.message);
    return;
  }
  console.log(`Listening on PORT ${PORT}`);
});
