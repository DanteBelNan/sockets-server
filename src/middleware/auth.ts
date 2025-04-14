import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';
import { AuthRequest } from '../types/IAuthRequest';
import { Socket } from 'socket.io';


export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido o expirado.' });
  }
};

export const authenticateSocket = (socket: Socket, next: Function) => {
  const token = socket.handshake.auth.token;

  if(!token){
    return next(new Error('Authentication error: Token not provided'))
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    socket.data.user = decoded
    next();
  }catch(error){
    return next(new Error('Authentication error: Invalid token'));
  }
}
