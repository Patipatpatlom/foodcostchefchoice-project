import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import ingredientRoutes from './routes/ingredientRoutes.js';
import recipeRoutes from './routes/recipeRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { requireAuth } from './middleware/requireAuth.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ingredients', requireAuth, ingredientRoutes);
app.use('/api/recipes', requireAuth, recipeRoutes);

app.get('/', (req, res) => {
  res.send('De Chef\'s Choice API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
