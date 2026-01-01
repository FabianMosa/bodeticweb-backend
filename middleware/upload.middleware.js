import multer from "multer";

// Guardamos el archivo en memoria temporalmente antes de subirlo a la nube
const storage = multer.memoryStorage();

export const upload = multer({ storage: storage });
