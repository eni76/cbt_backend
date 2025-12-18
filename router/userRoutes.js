import express from 'express';
import {
  register,
  login,
  getUser,
  getAllUsers,
  deleteUser,
  recoverAccount,
  verifyEmail,
} from '../controllers/userController.js';

const router = express.Router();

router.post('/register', register);
router.get('/verify/:token', verifyEmail);
router.post('/login', login);
router.get('/:id', getUser);
router.get('/', getAllUsers);
router.delete('/:id', deleteUser);
router.post('/recover', recoverAccount);

export default router;
