const mongoose = require('mongoose');


const assetSchema = new mongoose.Schema({
  name: String, // e.g., 'Luxury Beach Villa'
  type: { type: String, default: 'property' }, // e.g., 'property', 'interior', etc.
  category: String, // e.g., 'luxury-villas', 'mountain-cabins', etc.
  url: String, // Cloudinary URL
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' }, // Link to property 
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who uploaded
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Asset || mongoose.model('Asset', assetSchema);