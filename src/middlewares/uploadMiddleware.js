import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Para ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== FUNÇÃO PARA GERAR CÓDIGO ALEATÓRIO =====
const generateRandomCode = () => {
  return crypto.randomBytes(6).toString('hex'); // Gera código de 12 caracteres
};

// Configuração de storage do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determinar pasta baseada na rota
    let uploadPath = path.join(__dirname, '../../uploads/');
    
    if (req.route.path.includes('restaurants')) {
      uploadPath = path.join(__dirname, '../../uploads/restaurants/');
    } else if (req.route.path.includes('products')) {
      uploadPath = path.join(__dirname, '../../uploads/products/');
    } else if (req.route.path.includes('categories')) {
      uploadPath = path.join(__dirname, '../../uploads/categories/');
    } else {
      uploadPath = path.join(__dirname, '../../uploads/general/');
    }
    
    console.log('📁 Upload para:', uploadPath);
    cb(null, uploadPath);
  },
  
  filename: (req, file, cb) => {
    // Gerar código aleatório + timestamp para garantir unicidade
    const randomCode = generateRandomCode();
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const originalName = path.basename(file.originalname, fileExtension);
    
    // Formato: codigoAleatorio_timestamp_nomeOriginal.ext
    // Exemplo: a3f2c1_1729630285_logo-empresa.jpg
    const fileName = `${randomCode}_${timestamp}_${originalName}${fileExtension}`;
    
    console.log('📄 Nome do arquivo gerado:', fileName);
    cb(null, fileName);
  }
});

// Filtro para validar tipos de arquivo
const fileFilter = (req, file, cb) => {
  console.log('🔍 Validando arquivo:', file.originalname, 'Tipo:', file.mimetype);
  
  // Tipos permitidos
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    console.log('✅ Tipo de arquivo aceito');
    cb(null, true);
  } else {
    console.log('❌ Tipo de arquivo rejeitado');
    cb(new Error('Tipo de arquivo não permitido. Use: JPG, PNG, WEBP ou GIF'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 1 // 1 arquivo por vez
  }
});

// Middleware para upload de imagem única
export const uploadSingleImage = (fieldName = 'image') => {
  return upload.single(fieldName);
};

// Middleware para upload múltiplo (futura implementação)
export const uploadMultipleImages = (fieldName = 'images', maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// Middleware para tratamento de erros de upload
export const handleUploadError = (error, req, res, next) => {
  console.error('❌ Erro no upload:', error.message);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Arquivo muito grande. Tamanho máximo: 5MB'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Muitos arquivos. Máximo permitido: 1 arquivo'
      });
    }
    
    return res.status(400).json({
      error: 'Erro no upload: ' + error.message
    });
  }
  
  if (error.message.includes('não permitido')) {
    return res.status(400).json({
      error: error.message
    });
  }
  
  next(error);
};

// Função para gerar URL completa da imagem
export const generateImageUrl = (req, filename) => {
  if (!filename) return null;
  
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${filename}`;
};

// Função para extrair apenas o nome do arquivo da URL
export const extractFilename = (imageUrl) => {
  if (!imageUrl) return null;
  
  const parts = imageUrl.split('/');
  return parts[parts.length - 1];
};