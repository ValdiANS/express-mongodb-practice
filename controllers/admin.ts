import type { RequestHandler } from 'express';
import { WithId } from 'mongodb';

import Product from '../models/product';
import User from '../models/user';

import { asyncHandler } from '../util/utils';

export const getAddProduct: RequestHandler = asyncHandler(
  async (req, res, next) => {
    try {
      const users = await User.fetchAll();

      res.render('admin/edit-product', {
        docTitle: 'Valdi - Add Product',
        path: '/admin/add-product',
        users,
        editing: false,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

export const postAddProduct: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const { title, price, description, imageUrl, userId } =
      req.body as Product & { price: string; userId: string };

    try {
      const product = new Product({
        title,
        price,
        description,
        imageUrl,
        userId,
      });

      await product.save();

      res.redirect('/admin/products');
    } catch (error) {
      console.log(error);
      res.redirect('/admin/products');
    }
  }
);

export const getEditProduct: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const { productId } = req.params as { productId: string };
    const { edit: editMode } = req.query as { edit: string };

    if (editMode !== 'true') {
      return res.redirect('/');
    }

    try {
      const product = await Product.fetchById(productId);

      if (!product) {
        return res.redirect('/');
      }

      res.render('admin/edit-product', {
        docTitle: 'Valdi - Edit Product',
        path: '/admin/edit-product',
        editing: new Boolean(editMode),
        product,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

export const postEditProduct: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const { productId } = req.params as { productId: string };
    const { title, imageUrl, description, price }: Product & { price: string } =
      req.body;

    try {
      const updatedProduct = new Product({
        title,
        price,
        description,
        imageUrl,
      });
      const result = await Product.update(productId, updatedProduct);

      console.log(
        `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
      );

      res.redirect('/admin/products');
    } catch (error) {
      console.log(error);
    }
  }
);

export const getAdminProducts: RequestHandler = asyncHandler(
  async (req, res, next) => {
    try {
      const products: WithId<Product>[] = await Product.fetchAll();

      res.render('admin/admin-product-list', {
        docTitle: 'Valdi - Admin Products',
        path: '/admin/products',
        products,
        users: [],
        selectedUserId: '',
      });
    } catch (error) {
      console.log(error);
    }
  }
);

export const postFilterAdminProducts: RequestHandler = (req, res, next) => {
  const { userId } = req.body;

  console.log(`userId: ${userId}`);

  if (!userId) {
    res.redirect('/admin/products');
    return;
  }

  res.render('admin/admin-product-list', {
    docTitle: 'Valdi - Admin Products',
    path: '/admin/products',
    products: [],
    users: [],
    selectedUserId: parseInt(userId),
  });
};

export const deleteProduct: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const { productId } = req.body;

    try {
      const result = await Product.delete(productId);

      if (!result.acknowledged) {
        console.log('Failed to delete product!');
        return;
      }

      if (result.deletedCount === 1) {
        console.log('Successfully deleted one product.');
      } else {
        console.log('No documents matched the query. Deleted 0 documents.');
      }

      res.redirect('/products');
    } catch (error) {
      console.log(error);
    }
  }
);

export const getAddUser: RequestHandler = (req, res, next) => {
  res.render('admin/add-user', {
    docTitle: 'Create User',
    path: '/admin/add-user',
  });
};

export const postUser: RequestHandler = asyncHandler(async (req, res, next) => {
  const { name, email }: { name: string; email: string } = req.body;

  try {
    const newUser = new User({ username: name, email });

    await newUser.save();

    res.redirect('/admin/products');
  } catch (error) {
    console.log(error);
  }
});
