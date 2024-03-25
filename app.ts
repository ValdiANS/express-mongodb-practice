import 'dotenv/config';

import path from 'path';
import express from 'express';
import { MongoClient } from 'mongodb';

import { client, mongoConnect } from './util/database';
import adminRoutes from './routes/admin';
import shopRoutes from './routes/shop';

const { get404 } = require('./controllers/error');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(get404);

mongoConnect(async (client: MongoClient) => {
  try {
    await client.connect();

    await client.db('expressjs-practice').command({ ping: 1 });

    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
    app.listen(3000);
  } catch (error) {
    console.log(error);
  }
});
