import express, { Express, Request, Response } from 'express';
import apiRoutes from './routes/api';
import socketRouter from './routes/socket';
import { connectDB } from './config/db';
import dotenv from 'dotenv';
import { createServer } from 'node:http'; 
import { Server } from 'socket.io'; 

// Cargar variables de entorno
dotenv.config();

// Inicializar Express
const app: Express = express();
const cors = require('cors');
const PORT: number = parseInt(process.env.PORT || '3000');

// Middleware
app.use(express.json());
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:8080", // Ajusta el origen de tu frontend
    methods: ["GET", "POST"]
  }
});


// Conectar a MongoDB
connectDB();

// Rutas
app.use('/api', apiRoutes);
app.use('/ws', socketRouter(io))

// Ruta principal
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

httpServer.listen(3001, () => {
  console.log(`Servidor Socket.IO corriendo en el puerto ${PORT}`);
}
);

export default app;