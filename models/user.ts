import { ObjectId, WithId } from 'mongodb';
import { COLLECTION_NAMES, db, mongoConnect } from '../util/database';
import Product from './product';

type Cart = {
  items: CartItem[];
};

type CartItem = {
  productId: ObjectId;
  quantity: number;
};

type Order = {
  userId: ObjectId;
} & Cart;

class User {
  _id: ObjectId;
  username: string;
  email: string;
  carts: Cart = {
    items: [],
  };

  constructor(user: { _id?: string; username: string; email: string }) {
    const { _id, username, email } = user;

    this._id = new ObjectId(_id);
    this.username = username;
    this.email = email;
  }

  async save() {
    await mongoConnect(async (client) => {
      try {
        const usersCollection = db.collection<User>(COLLECTION_NAMES.USERS);
        const result = await usersCollection.insertOne(this);

        if (result.acknowledged) {
          console.log(
            `User was successfully inserted with the _id: ${result.insertedId}`
          );
        }
      } catch (error) {
        console.log(error);
      }
    });
  }

  async addToCart(product: Product) {
    return await mongoConnect(async (client) => {
      const { _id: productId } = product;

      const cartItem: CartItem = {
        productId: productId as ObjectId,
        quantity: 1,
      };

      try {
        const usersCollection = db.collection<User>(COLLECTION_NAMES.USERS);
        const addProductToCartItemsResult = await usersCollection.updateOne(
          {
            _id: this._id,
            'carts.items.productId': { $ne: productId },
          },
          {
            $addToSet: {
              'carts.items': cartItem,
            },
          }
        );

        console.log(addProductToCartItemsResult);

        if (addProductToCartItemsResult.modifiedCount === 1) {
          console.log(
            `Product was successfully inserted to Carts. modifiedCount: ${addProductToCartItemsResult.modifiedCount}`
          );
          return;
        }

        const addProductQuantityInCartItemsResult =
          await usersCollection.updateOne(
            {
              _id: this._id,
              'carts.items.productId': productId,
            },
            {
              $inc: {
                'carts.items.$.quantity': 1,
              },
            }
          );

        if (addProductQuantityInCartItemsResult.modifiedCount === 1) {
          console.log(
            `Product quantity was successfully increased in Carts. matchedCount: ${addProductQuantityInCartItemsResult.matchedCount}`
          );
        }
      } catch (error) {
        console.log(error);
      }
    });
  }

  async getCarts() {
    return await mongoConnect(async (client) => {
      try {
        const usersCollection = db.collection<User>(COLLECTION_NAMES.USERS);

        const pipeline = [
          { $match: { _id: this._id } },
          {
            $unwind: '$carts.items',
          },
          {
            $replaceRoot: {
              newRoot: '$carts.items',
            },
          },
          {
            $lookup: {
              from: 'products',
              localField: 'productId',
              foreignField: '_id',
              as: 'cartItems',
            },
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  {
                    $arrayElemAt: ['$cartItems', 0],
                  },
                  '$$ROOT',
                ],
              },
            },
          },
          {
            $project: {
              productId: 0,
              cartItems: 0,
            },
          },
          {
            $replaceWith: {
              $setField: {
                field: 'total',
                input: '$$ROOT',
                value: {
                  $multiply: ['$price', '$quantity'],
                },
              },
            },
          },
          {
            $group: {
              _id: null,
              totalPrice: { $sum: '$total' },
              products: { $push: '$$ROOT' },
            },
          },
          {
            $project: {
              _id: 0,
              totalPrice: 1,
              products: 1,
            },
          },
        ];

        const resultCursor = usersCollection.aggregate(pipeline);

        const result = await resultCursor.toArray();

        if (result.length === 0) {
          // Empty value
          return {
            totalPrice: 0,
            products: [],
          };
        }

        return result[0];
      } catch (error) {
        console.log(error);
      }
    });
  }

  async deleteItemFromCart(productId: string) {
    return await mongoConnect(async (client) => {
      const usersCollection = db.collection<User>(COLLECTION_NAMES.USERS);
      const result = await usersCollection.updateOne(
        {
          _id: this._id,
        },
        {
          $pull: {
            'carts.items': { productId: { $eq: new ObjectId(productId) } },
          },
        },
        {}
      );

      console.log(result);

      if (result.modifiedCount === 1) {
        console.log(
          `Product with _id: ${productId} was successfully deleted from Cart. matchedCount: ${result.matchedCount}`
        );
      }

      return result;
    });
  }

  async addOrder() {
    return await mongoConnect(async (client) => {
      const session = client.startSession();

      try {
        session.startTransaction();

        const usersCollection = db.collection<User>(COLLECTION_NAMES.USERS);
        const ordersCollection = db.collection<Order>(COLLECTION_NAMES.ORDERS);

        const totalPricePipeline = [
          { $match: { _id: this._id } },
          {
            $unwind: '$carts.items',
          },
          {
            $replaceRoot: {
              newRoot: '$carts.items',
            },
          },
          {
            $lookup: {
              from: 'products',
              localField: 'productId',
              foreignField: '_id',
              as: 'cartItems',
            },
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  {
                    $arrayElemAt: ['$cartItems', 0],
                  },
                  '$$ROOT',
                ],
              },
            },
          },
          {
            $project: {
              productId: 0,
              cartItems: 0,
            },
          },
          {
            $replaceWith: {
              $setField: {
                field: 'total',
                input: '$$ROOT',
                value: {
                  $multiply: ['$price', '$quantity'],
                },
              },
            },
          },
          {
            $group: {
              _id: null,
              totalPrice: { $sum: '$total' },
              products: { $push: '$$ROOT' },
            },
          },
          {
            $project: {
              _id: 0,
              totalPrice: 1,
            },
          },
        ];

        const totalPriceCursor = usersCollection.aggregate(totalPricePipeline);

        const [{ totalPrice }] = (await totalPriceCursor.toArray()) as {
          totalPrice: number;
        }[];

        // find user and set the carts.items = []
        const user = await usersCollection.findOneAndUpdate(
          {
            _id: this._id,
          },
          {
            $set: {
              carts: { items: [] },
            },
          }
        );

        const orderDoc: Order = {
          userId: user?._id as ObjectId,
          items: user?.carts.items as CartItem[],
        };

        const result = await ordersCollection.insertOne(orderDoc);

        if (result.acknowledged) {
          console.log(
            `Order was successfully inserted with the _id: ${result.insertedId}`
          );
        }

        await session.commitTransaction();
      } catch (error) {
        console.log(error);
        await session.abortTransaction();
      } finally {
        await session.endSession();
      }
    });
  }

  async getOrders() {
    return await mongoConnect(async (client) => {
      try {
        const ordersCollection = db.collection<Order>(COLLECTION_NAMES.ORDERS);

        const ordersPipeline = [
          { $match: { userId: this._id } },
          {
            $unwind: '$items',
          },
          {
            $lookup: {
              from: 'products',
              localField: 'items.productId',
              foreignField: '_id',
              as: 'product',
            },
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  {
                    $arrayElemAt: ['$product', 0],
                  },
                  '$$ROOT',
                  {
                    quantity: '$items.quantity',
                  },
                ],
              },
            },
          },
          {
            $replaceWith: {
              $setField: {
                field: 'total',
                input: '$$ROOT',
                value: {
                  $multiply: ['$price', '$quantity'],
                },
              },
            },
          },
          {
            $project: {
              product: 0,
              items: 0,
              totalPrice: 0,
            },
          },
          {
            $group: {
              _id: '$_id',
              totalPrice: { $sum: '$total' },
              orderProducts: { $push: '$$ROOT' },
            },
          },
          {
            $group: {
              _id: null,
              totalPrice: { $sum: '$totalPrice' },
              orders: { $push: '$$ROOT' },
            },
          },
          {
            $project: {
              _id: 0,
            },
          },
        ];

        const ordersCursor = ordersCollection.aggregate(ordersPipeline);

        const orders = await ordersCursor.toArray();

        if (orders.length === 0) {
          return {
            totalPrice: 0,
            orders: [],
          };
        }

        const userOrder = orders[0] as {
          totalPrice: number;
          orders: ({ _id: ObjectId } & Order)[];
        };

        return userOrder;
      } catch (error) {
        console.log(error);
      }
    });
  }

  static async fetchById(userId: string): Promise<WithId<User> | null> {
    return await mongoConnect(async (client) => {
      try {
        const usersCollection = db.collection<User>(COLLECTION_NAMES.USERS);
        const user = await usersCollection.findOne({
          _id: new ObjectId(userId),
        });

        return user;
      } catch (error) {
        console.log(error);
      }
    });
  }

  static async fetchAll(): Promise<WithId<User>[]> {
    return await mongoConnect(async (client) => {
      try {
        const usersCollection = db.collection<User>(COLLECTION_NAMES.USERS);
        const allUsersCursor = usersCollection.find();
        const allUsers = await allUsersCursor.toArray();

        return allUsers;
      } catch (error) {
        console.log(error);
      }
    });
  }
}

export { Order };
export default User;
