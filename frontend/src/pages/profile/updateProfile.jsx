// Dans votre fichier AuthContext.jsx
const updateProfile = async (formData) => {
  try {
    const token = localStorage.getItem('access_token');
    
    const response = await axios.put(
      'http://localhost:8000/api/profile/',  // Modifiez l'URL selon votre API
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      }
    );

    // Mettre à jour les données utilisateur dans le contexte
    setUser(prev => ({ ...prev, ...response.data }));
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Erreur de mise à jour du profil');
  }
};

// Ajoutez cette fonction dans le retour du contexte
return {
  user,
  login,
  logout,
  updateProfile,  // <-- Ajoutez cette ligne
  // ... autres fonctions
};