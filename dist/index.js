"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const app = (0, express_1.default)();
// 1. Добавим проверку папки uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static('uploads'));
// 2. Переместили CORS выше
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
}));
// 4. Настройка Multer вынесена отдельно
const storage = multer_1.default.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}${ext}`);
    },
});
const upload = (0, multer_1.default)({ storage });
const defaultImage = '/uploads/image.webp';
// 5. Убраны дублирующиеся роуты
const dataFilePath = path.join(__dirname, '..', 'data', 'data.json');
function readData() {
    if (!fs.existsSync(dataFilePath)) {
        fs.writeFileSync(dataFilePath, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
}
function writeData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}
// 6. Исправленные роуты
app.post('/api/characters', upload.single('image'), (req, res) => {
    const characters = readData();
    const newCharacter = Object.assign(Object.assign({ id: Date.now() }, req.body), { image: req.file ? `/uploads/${req.file.filename}` : defaultImage });
    characters.push(newCharacter);
    writeData(characters);
    res.status(201).json(newCharacter);
});
app.put('/api/characters/:id', upload.single('image'), (req, res) => {
    const id = Number(req.params.id);
    const characters = readData();
    const index = characters.findIndex(char => char.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Character not found' });
    }
    // Извлекаем остальные поля, исключая id
    const _a = req.body, { id: _ } = _a, otherFields = __rest(_a, ["id"]);
    characters[index] = Object.assign(Object.assign(Object.assign({}, characters[index]), otherFields), { image: req.file ? `/uploads/${req.file.filename}` : characters[index].image });
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
