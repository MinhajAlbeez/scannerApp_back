const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const Product = require('../models/Products'); // Ensure this path is correct

// Create an Express router
const router = express.Router();

// Set up Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + path.extname(file.originalname);
    cb(null, fileName);
  }
});

// Set up Multer for file uploads
const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});
  
// API route for file upload
router.post('/upload-excel', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Read the uploaded file using xlsx
  const filePath = path.join(__dirname, 'uploads', req.file.filename);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];  // Get the first sheet
  const sheet = workbook.Sheets[sheetName];

  // Convert sheet data to JSON
  const data = xlsx.utils.sheet_to_json(sheet);

  // Process the data to fit your object structure
  const processedData = data.map(item => ({
    barcode: item.barcode,
    name: item.name,
    qty_available: item['product_variant_id/qty_available'],
    standard_price: item.standard_price,
    list_price: item.list_price,
  }));

  // Save processed data to MongoDB
  try {
    // Create an array of Product documents to insert into the DB
    const productsToSave = processedData.map(product => ({
      barcode: product.barcode,
      name: product.name,
      qty_available: product.qty_available,
      standard_price: product.standard_price,
      list_price: product.list_price,
    }));

    // Insert products into MongoDB
    await Product.insertMany(productsToSave);
    
    res.status(200).json({ message: 'File uploaded and processed successfully', data: processedData });
  } catch (error) {
    console.error('Error saving to DB:', error);
    res.status(500).json({ message: 'Error saving data to database', error: error.message });
  }
  
});

router.get('/:barcode', async (req, res) => {
    try {
      const product = await Product.findOne({ barcode: req.params.barcode });
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  });

module.exports = router;
