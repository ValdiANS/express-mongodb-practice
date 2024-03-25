import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@expressjs-practice.2mbnusa.mongodb.net/?retryWrites=true&w=majority&appName=Expressjs-Practice`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const db = client.db('shop');

const mongoConnect = async (
  callback = async (mongoClient: MongoClient): Promise<any> => {}
) => {
  try {
    // await client.connect();

    return await callback(client);
  } finally {
    // await client.close();
  }
};

const COLLECTION_NAMES = {
  PRODUCTS: 'products',
  USERS: 'users',
  ORDERS: 'orders',
} as const;

export { mongoConnect, db, COLLECTION_NAMES, client };
