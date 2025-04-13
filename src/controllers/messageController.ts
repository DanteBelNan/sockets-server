import { Request, Response } from 'express';
import Message from '../models/Message';


export const getMessages = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId: roomId})
    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener usuarios.', error: err });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { roomId, username, message } = req.body;
    const newMessage = new Message({ roomId, username, message });
    await newMessage.save();
    res.status(201).json({ newMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ newMessage: 'Error al enviar el mensaje.', error: err });
  }
}
