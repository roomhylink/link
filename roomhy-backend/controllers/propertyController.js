const Property = require('../models/Property');

// Get ALL Properties (For Super Admin & Area Manager lists)
exports.getAllProperties = async (req, res) => {
    try {
        // Populate owner details to show name and phone
        const properties = await Property.find()
            .populate('owner', 'name phone email')
            .sort({ createdAt: -1 }); // Newest first

        res.json({ success: true, properties });
    } catch (err) {
        console.error("Get Properties Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Publish property (Super Admin action)
exports.publishProperty = async (req, res) => {
    try {
        const propId = req.params.id;
        const property = await Property.findById(propId);
        if (!property) return res.status(404).json({ message: 'Property not found' });
        
        property.status = 'active';
        property.isPublished = true;
        await property.save();
        
        res.json({ success: true, property });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};