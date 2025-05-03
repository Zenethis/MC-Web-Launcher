class StorageManager {
    constructor() {
        this.DB_NAME = 'minecraft-launcher-db';
        this.STORE_NAME = 'game-files';
        this.store = null;
        this.db = null;
        this.storageAvailable = false;
    }

    async init() {
        if (this.store) return;
        
        try {
            // Check if localStorage is available
            this.storageAvailable = this.checkStorage();
            if (!this.storageAvailable) {
                throw new Error('Local storage is not available. Please enable cookies and local storage.');
            }

            // Delete existing database to start fresh
            await this.deleteDatabase();
            await this.createStore();
            console.log('Storage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize storage:', error);
            throw error;
        }
    }

    checkStorage() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            return false;
        }
    }

    async deleteDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(this.DB_NAME);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                console.log('Database deleted successfully');
                resolve();
            };
        });
    }

    async createStore() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, 1);
            
            request.onerror = () => reject(request.error);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database opened successfully');
                resolve();
            };
        });
    }

    async saveInstallation(installation) {
        const installations = await this.getInstallations();
        installations.push(installation);
        localStorage.setItem('installations', JSON.stringify(installations));
    }

    async getInstallations() {
        const stored = localStorage.getItem('installations');
        return stored ? JSON.parse(stored) : [];
    }

    async saveInstallations(installations) {
        localStorage.setItem('installations', JSON.stringify(installations));
    }

    async saveGameFiles(versionId, instanceName, files) {
        if (!this.db) throw new Error('Database not initialized');
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            
            const key = `${versionId}_${instanceName}`;
            const request = store.put(files, key);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                console.log('Game files saved successfully for instance:', instanceName);
                resolve();
            };
        });
    }

    async getGameFiles(versionId, instanceName) {
        if (!this.db) throw new Error('Database not initialized');
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            
            const key = `${versionId}_${instanceName}`;
            const request = store.get(key);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const files = request.result;
                console.log('Retrieved game files for instance:', instanceName, 'Files found:', files ? Object.keys(files).length : 0);
                resolve(files);
            };
        });
    }

    async deleteInstanceFiles(versionId, instanceName) {
        if (!this.db) throw new Error('Database not initialized');
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            
            const key = `${versionId}_${instanceName}`;
            const request = store.delete(key);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                console.log('Game files deleted for instance:', instanceName);
                resolve();
            };
        });
    }

    async deleteInstallation(installationName) {
        const installations = await this.getInstallations();
        const filtered = installations.filter(inst => inst.name !== installationName);
        localStorage.setItem('installations', JSON.stringify(filtered));
    }

    async hasGameFiles(versionId, instanceName) {
        const files = await this.getGameFiles(versionId, instanceName);
        return !!files;
    }

    async clearGameFiles() {
        if (!this.db) throw new Error('Database not initialized');
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            
            const request = store.clear();
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                console.log('All game files cleared');
                resolve();
            };
        });
    }
}

// Create and initialize storage instance
const storage = new StorageManager();