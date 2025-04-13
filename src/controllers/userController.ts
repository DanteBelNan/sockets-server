import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types/IAuthRequest';
import jwt from 'jsonwebtoken';
export const JWT_SECRET: string = process.env.JWT_SECRET!;


export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username o Email ya registrados.' });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();
    const token = jwt.sign(
      { userId: newUser._id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error en el servidor.', error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    let user = await User.findOne({ email: identifier });

    if (!user){
      user = await User.findOne({ username: identifier });
    }

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );


    res.json({
      message: 'Login exitoso.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error en el servidor.', error: err });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password'); // Excluimos contraseñas
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener usuarios.', error: err });
  }
};

export const getUserByUsername = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params
    const user = await User.findOne({ username }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.status(200).json({ user });
  }catch (err) {
    res.status(500).json({ message: 'Error al obtener usuario.', error: err });
  }
}

export const getUsers = async (req: AuthRequest, res: Response) => {
  try{
    const { identifier } = req.params
    const { take } = req.query
    const users = await User.find({
      $or: [
        { username: { $regex: identifier, $options: 'i' } },
        { email: { $regex: identifier, $options: 'i' } }
      ]
    }).select('-password');
    if (!users) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.status(200).json({ users });
  }catch (err) {
    res.status(500).json({ message: 'Error al obtener usuarios.', error: err });
  }
}

export const verifyToken = async (req: Request, res: Response) => {
  res.status(200).json({valid: true})
}

//Eliminar toda la mierda del repo y subirlo denuevo!!!