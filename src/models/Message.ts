import mongoose, { Schema } from 'mongoose';
import { IMessage } from '../types/IMessage';


const MessageSchema = new Schema<IMessage>({
  username: { type: String, required: true },
  message: { type: String, required: true },
  roomId: { type: String },
});



const Message = mongoose.model<IMessage>('Message', MessageSchema);
export default Message;
