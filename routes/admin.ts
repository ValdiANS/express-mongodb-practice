import express from 'express';
import {
  getAddProduct,
  postAddProduct,
  getAdminProducts,
  deleteProduct,
  getEditProduct,
  postEditProduct,
  getAddUser,
  postUser,
  postFilterAdminProducts,
} from '../controllers/admin';

const router = express.Router();

router.get('/add-product', getAddProduct);
router.post('/add-product', postAddProduct);

router.get('/products', getAdminProducts);
router.post('/products', postFilterAdminProducts);

router.get('/edit-product/:productId', getEditProduct);
router.post('/edit-product/:productId', postEditProduct);

router.post('/delete-product', deleteProduct);

router.get('/add-user', getAddUser);

router.post('/user', postUser);

export default router;
