import { DeleteResult, ObjectId, UpdateResult, WithId } from 'mongodb';
import { COLLECTION_NAMES, db, mongoConnect } from '../util/database';
import User, { Order } from './user';

class Product {
  _id?: ObjectId;
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  userId?: ObjectId;

  constructor(product: {
    _id?: string;
    title: string;
    price: string;
    description: string;
    imageUrl: string;
    userId?: string;
  }) {
    const { _id, title, price, description, imageUrl, userId } = product;

    this.title = title;
    this.price = parseFloat(price);
    this.description = description;
    this.imageUrl = imageUrl;

    if (_id) {
      this._id = new ObjectId(_id);
    }

    if (userId) {
      this.userId = new ObjectId(userId);
    }
  }

  public async save() {
    await mongoConnect(async (client) => {
      try {
        const productsCollection = db.collection<Product>(
          COLLECTION_NAMES.PRODUCTS
        );

        const result = await productsCollection.insertOne(this);

        if (result.acknowledged) {
          console.log(
            `Product was successfully inserted with the _id: ${result.insertedId}`
          );
        }
      } catch (error) {
        console.log(error);
      }
    });
  }

  static async fetchAll(): Promise<WithId<Product>[]> {
    return await mongoConnect(async (client) => {
      try {
        const productsCollection = db.collection<Product>(
          COLLECTION_NAMES.PRODUCTS
        );
        const allProductsCursor = productsCollection.find();
        const allProducts = await allProductsCursor.toArray();

        return allProducts;
      } catch (error) {
        console.log(error);
      }
    });
  }

  static async fetchById(id: string): Promise<WithId<Product> | null> {
    return await mongoConnect(async (client) => {
      try {
        const productsCollection = db.collection<Product>(
          COLLECTION_NAMES.PRODUCTS
        );
        const product = await productsCollection.findOne({
          _id: new ObjectId(id),
        });

        return product;
      } catch (error) {
        console.log(error);
      }
    });
  }

  static async update(
    id: string,
    updatedProduct: Product
  ): Promise<UpdateResult<Product>> {
    const { title, price, description, imageUrl } = updatedProduct;

    return await mongoConnect(async (client) => {
      try {
        const productsCollection = db.collection<Product>(
          COLLECTION_NAMES.PRODUCTS
        );
        const result = await productsCollection.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: {
              title,
              price,
              description,
              imageUrl,
            },
          },
          { upsert: false }
        );

        return result;
      } catch (error) {
        console.log(error);
      }
    });
  }

  static async delete(id: string): Promise<DeleteResult> {
    return await mongoConnect(async (client) => {
      const session = client.startSession();

      try {
        session.startTransaction();

        const productsCollection = db.collection<Product>(
          COLLECTION_NAMES.PRODUCTS
        );
        const usersCollection = db.collection<User>(COLLECTION_NAMES.USERS);
        const ordersCollection = db.collection<Order>(COLLECTION_NAMES.ORDERS);

        // Delete product from user carts
        await usersCollection.updateMany(
          {},
          {
            $pull: {
              'carts.items': { productId: { $eq: new ObjectId(id) } },
            },
          }
        );

        // Delete product from orders
        await ordersCollection.updateMany(
          {},
          {
            $pull: {
              items: { productId: { $eq: new ObjectId(id) } },
            },
          }
        );

        const result = await productsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        await session.commitTransaction();
        return result;
      } catch (error) {
        console.log(error);
        await session.abortTransaction();
      } finally {
        await session.endSession();
      }
    });
  }
}

export default Product;
