import express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import cors from 'cors';
import multer from 'multer';
import { Request } from 'express';

const app = express();

// 1. Добавим проверку папки uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 2. Переместили CORS выше
app.use(cors({
  origin: 'http://localhost:3000',
}));

// 3. Убрали дублирующиеся объявления интерфейсов
interface Character {
  id: number;
  name: string;
  race: string;
  class: string;
  image: string;
  armor: string;
  health: string;
  strength: string;
  dexterity: string;
  endurance: string;
  wisdom: string;
  intelligence: string;
  charisma: string;
  backstory: string;
  features: string;
  equipment: string;
  spells: string;
  notes: string;
  level?: string;
}

interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

// 4. Настройка Multer вынесена отдельно
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });
const defaultImage = '/uploads/image.webp';

// 5. Убраны дублирующиеся роуты
const dataFilePath = path.join(__dirname, '..', 'data', 'data.json');

function readData(): Character[] {
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
}

function writeData(data: Character[]) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// 6. Исправленные роуты
app.post('/api/characters', upload.single('image'), (req: RequestWithFile, res) => {
  const characters = readData();

  const newCharacter: Character = {
    id: Date.now(),
    ...req.body,
    image: req.file ? `/uploads/${req.file.filename}` : defaultImage,
  };

  characters.push(newCharacter);
  writeData(characters);
  res.status(201).json(newCharacter);
});

app.put('/api/characters/:id', upload.single('image'), (req: RequestWithFile, res) => {
  const id = Number(req.params.id);
  const characters = readData();
  const index = characters.findIndex(char => char.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Character not found' });
  }

  // Извлекаем остальные поля, исключая id
  const { id: _, ...otherFields } = req.body;

  characters[index] = {
    ...characters[index],
    ...otherFields,
    image: req.file ? `/uploads/${req.file.filename}` : characters[index].image,
  };

  writeData(characters);
  res.json(characters[index]);
});

// 7. Убраны дублирующиеся GET/PUT/DELETE роуты
app.get('/api/characters/:id', (req, res) => {
  const id = Number(req.params.id);
  const characters = readData();
  const character = characters.find(char => char.id === id);
  
  if (!character) {
    return res.status(404).json({ error: 'Character not found' });
  }
  res.json(character);
});

app.get('/api/characters', (req, res) => {
  const characters = readData();
  res.json(characters);
});

app.delete('/api/characters/:id', (req, res) => {
  const id = Number(req.params.id);
  const characters = readData();
  const index = characters.findIndex(char => char.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Character not found' });
  }

  const deletedCharacter = characters.splice(index, 1);
  writeData(characters);
  res.json({ message: 'Character deleted', deletedCharacter });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});