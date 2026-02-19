export class MockServer {
  constructor() {
    this.isAuthenticated = false;
    this.files = [
      {
        id: '1',
        title: 'BNGRC',
        filename: 'bngrc.mp3',
        size: 1024000,
        duration: 15,
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        title: 'Alerte_vent',
        filename: 'vent.mp3',
        size: 2048000,
        duration: 30,
        createdAt: '2024-01-16T10:00:00Z',
      },
      {
        id: '3',
        title: 'Alerte_tsunami',
        filename: 'tsunami.mp3',
        size: 1536000,
        duration: 22,
        createdAt: '2024-01-17T10:00:00Z',
      },
    ];
    this.freeSpace = 15728640; // 15MB
  }

  async delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // POST /api/auth
  async authenticate(code) {
    await this.delay(800);
    if (code === '1234') {
      this.isAuthenticated = true;
      return {
        success: true,
        token: 'mock_token_' + Date.now(),
      };
    }
    throw { response: { status: 401 } };
  }

  // GET /api/status
  async getStatus() {
    await this.delay(500);
    return {
      success: true,
      connected: true,
      totalFiles: this.files.length,
      freeSpace: this.freeSpace,
      firmwareVersion: '1.0.0-mock',
    };
  }

  // GET /api/files → Liste des fichiers
  async getFiles() {
    await this.delay(600);
    if (!this.isAuthenticated) {
      throw { response: { status: 401 } };
    }
    return {
      success: true,
      files: this.files,
      totalFiles: this.files.length,
      freeSpace: this.freeSpace,
    };
  }

  // POST /api/upload → Ajouter ou remplacer
  async uploadMP3(file, title, onProgress) {
    await this.delay(300);
    if (!this.isAuthenticated) {
      throw { response: { status: 401 } };
    }

    // Simuler progression
    for (let i = 0; i <= 100; i += 10) {
      await this.delay(200);
      if (onProgress) onProgress(i);
    }

    // Vérifier si un fichier avec ce titre existe déjà
    const existingIndex = this.files.findIndex(
      f => f.title.toLowerCase() === title.toLowerCase()
    );

    if (existingIndex !== -1) {
      // Remplacer l'existant
      this.files[existingIndex] = {
        ...this.files[existingIndex],
        filename: file.name,
        size: file.size,
        updatedAt: new Date().toISOString(),
      };
      return {
        success: true,
        message: 'Fichier remplacé avec succès',
        action: 'replaced',
      };
    } else {
      // Ajouter nouveau
      this.files.push({
        id: Date.now().toString(),
        title: title,
        filename: file.name,
        size: file.size,
        duration: 0,
        createdAt: new Date().toISOString(),
      });
      return {
        success: true,
        message: 'Nouveau fichier ajouté avec succès',
        action: 'added',
      };
    }
  }

  // DELETE /api/files/:name
  async deleteFile(fileId) {
    await this.delay(500);
    if (!this.isAuthenticated) {
      throw { response: { status: 401 } };
    }
    const index = this.files.findIndex(f => f.id === fileId);
    if (index !== -1) {
      this.files.splice(index, 1);
      return { success: true, message: 'Fichier supprimé' };
    }
    throw { response: { status: 404, data: { message: 'Fichier introuvable' } } };
  }

  // POST /api/test/:name
  async testPlay(fileId) {
    await this.delay(600);
    if (!this.isAuthenticated) {
      throw { response: { status: 401 } };
    }
    const file = this.files.find(f => f.id === fileId);
    if (!file) {
      throw { response: { status: 404 } };
    }
    return {
      success: true,
      message: `Lecture de "${file.title}" en cours...`,
      duration: file.duration || 15,
      title: file.title,
      filename: file.filename,
      // En mode réel, l'ESP32 joue lui-même le son
      // En mode mock, on retourne les infos pour que l'app joue localement
    };
  }

  // POST /api/settings
  async changePassword(newPassword) {
    await this.delay(1000);
    if (newPassword.length < 8) {
      return { success: false, message: 'Mot de passe trop court' };
    }
    return { success: true, message: 'Mot de passe changé. Redémarrage...' };
  }
}

export const mockServer = new MockServer();