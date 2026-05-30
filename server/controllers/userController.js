import { prisma } from '../utils/db.js';

export const updateProfile = async (req, res) => {
  try {
    const { name, restaurantName, cuisineType, role } = req.body;
    
    // Optional: add validation to prevent users from arbitrarily changing their roles to executive chef
    // In a real system, changing roles might require admin approval. Here, we'll allow it for demo purposes.

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        restaurantName,
        cuisineType,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        restaurantName: true,
        cuisineType: true,
      }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Construct the URL to the uploaded file
    // For local storage in the "uploads" folder, we'll serve it statically
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        profileImage: imageUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        restaurantName: true,
        cuisineType: true,
      }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
