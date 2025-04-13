import express, { Router } from 'express';
import * as userController from '../controllers/userController';
import * as messageController from '../controllers/messageController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();
;
router.post('/auth/register', userController.register);
router.post('/auth/login', userController.login);
router.get('/auth/verify', authenticateToken, userController.verifyToken);
router.get('/all_users', authenticateToken, userController.getAllUsers);
router.get('/users/:username', authenticateToken, userController.getUserByUsername);
router.get('/users/search/:identifier', authenticateToken, userController.getUsers);

router.get('/messages/:roomId', authenticateToken, messageController.getMessages);
router.post('/messages', authenticateToken, messageController.sendMessage);



export default router;