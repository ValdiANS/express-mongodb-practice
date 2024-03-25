import type { RequestHandler } from 'express';
import { ObjectId, WithId } from 'mongodb';

import Product from '../models/product';
import User from '../models/user';

import { asyncHandler } from '../util/utils';

export const getIndex: RequestHandler = asyncHandler(async (req, res, next) => {
  const { userId } = req.query as { userId?: string };

  try {
    const users = await User.fetchAll();
    const loggedUser = users.find((user) => user._id === new ObjectId(userId));
    const products: WithId<Product>[] = await Product.fetchAll();

    res.render('shop/index', {
      docTitle: 'Valdi Shop',
      path: '/',
      products,
      users,
      selectedUserId: userId ?? users[0]._id.toString(),
      selectedUserName: loggedUser?.username ?? users[0].username,
      selectedUserEmail: loggedUser?.email ?? users[0].email,
    });
  } catch (error) {
    console.log(error);
  }
});

export const getProducts: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const { userId } = req.query as { userId?: string };

    try {
      const users = await User.fetchAll();
      const loggedUser = users.find(
        (user) => user._id === new ObjectId(userId)
      );
      const products: WithId<Product>[] = await Product.fetchAll();

      res.render('shop/product-list', {
        docTitle: 'Valdi - Products',
        path: '/products',
        products,
        users,
        selectedUserId: userId ?? users[0]._id.toString(),
        selectedUserName: loggedUser?.username ?? users[0].username,
        selectedUserEmail: loggedUser?.email ?? users[0].email,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

export const getProduct: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const { userId } = req.query as { userId?: string };
    const { productId } = req.params as { productId: string };

    try {
      const users = await User.fetchAll();
      const loggedUser = users.find(
        (user) => user._id === new ObjectId(userId)
      );
      const product = await Product.fetchById(productId);

      res.render('shop/product-detail', {
        docTitle: product?.title,
        path: '/products',
        product,
        users,
        selectedUserId: userId ?? users[0]._id.toString(),
        selectedUserName: loggedUser?.username ?? users[0].username,
        selectedUserEmail: loggedUser?.email ?? users[0].email,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

export const getCart: RequestHandler = asyncHandler(async (req, res, next) => {
  const { userId } = req.query as { userId?: string };

  try {
    const users = await User.fetchAll();
    let loggedUser = users.find((user) => user._id.toString() === userId);

    if (loggedUser === undefined) {
      loggedUser = users[0];
    }

    const formattedUser = new User({
      _id: loggedUser?._id.toString(),
      username: loggedUser?.username,
      email: loggedUser?.email,
    });

    const { totalPrice, products: cartProducts } =
      (await formattedUser.getCarts()) as {
        totalPrice: number;
        products: Product[];
      };

    res.render('shop/cart', {
      docTitle: 'Valdi - Cart',
      path: '/cart',
      products: cartProducts,
      totalPrice,
      users,
      selectedUserId: userId ?? users[0]._id.toString(),
      selectedUserName: loggedUser?.username ?? users[0].username,
      selectedUserEmail: loggedUser?.email ?? users[0].email,
    });
  } catch (error) {
    console.log(error);
  }
});

export const postCart: RequestHandler = asyncHandler(async (req, res, next) => {
  const {
    productId,
    userId,
    userName,
    userEmail,
  }: {
    productId: string;
    userId: string;
    userName: string;
    userEmail: string;
  } = req.body;

  try {
    const product = await Product.fetchById(productId);

    if (product === null) return;

    const user = new User({
      _id: userId,
      username: userName,
      email: userEmail,
    });

    await user.addToCart(product as Product);

    res.redirect(`/cart?userId=${userId}`);
    return;
  } catch (error) {
    console.log(error);
  }
});

export const postCartDeleteItem: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const {
      productId,
      userId,
      userName,
      userEmail,
    }: {
      productId: string;
      userId: string;
      userName: string;
      userEmail: string;
    } = req.body;

    try {
      const user = new User({
        _id: userId,
        username: userName,
        email: userEmail,
      });

      await user.deleteItemFromCart(productId);

      res.redirect(`/cart?userId=${userId}`);
    } catch (error) {
      console.log(error);
    }
  }
);

export const postCreateOrder: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const {
      userId,
      userName,
      userEmail,
    }: { userId: string; userName: string; userEmail: string } = req.body;

    try {
      const user = new User({
        _id: userId,
        username: userName,
        email: userEmail,
      });

      await user.addOrder();

      res.redirect(`/orders?userId=${userId}`);
    } catch (error) {
      console.log(error);
    }
  }
);

export const getOrders: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const { userId } = req.query as { userId?: string };

    try {
      const users = await User.fetchAll();
      let loggedUser = users.find((user) => user._id.toString() === userId);

      if (loggedUser === undefined) {
        loggedUser = users[0];
      }

      const formattedUser = new User({
        _id: loggedUser?._id.toString(),
        username: loggedUser?.username,
        email: loggedUser?.email,
      });

      const { totalPrice, orders } = await formattedUser.getOrders();

      res.render('shop/orders', {
        docTitle: 'Valdi - Orders',
        path: '/orders',
        users,
        orders,
        totalPrice,
        selectedUserId: userId ?? users[0]._id.toString(),
        selectedUserName: loggedUser?.username ?? users[0].username,
        selectedUserEmail: loggedUser?.email ?? users[0].email,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

export const getCheckout: RequestHandler = (req, res, next) => {
  res.render('shop/checkout', {
    docTitle: 'Valdi - Checkout',
    path: '/checkout',
  });
};
