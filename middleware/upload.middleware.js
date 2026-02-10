import multer from "multer";

// Almacena el archivo en memoria (buffer) para luego subirlo a Cloudinary u otro servicio
const storage = multer.memoryStorage();
export const upload = multer({ storage });
