const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  barcode: { type: String, required: true, unique: false },
  name: { type: String, required: true },
  qty_available: { type: String },  // Mapping the 'product_variant_id/qty_available'
  standard_price: { type: Number, required: true },
  list_price: { type: Number, required: true },
});

module.exports = mongoose.model('Product', productSchema);
