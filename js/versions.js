class VersionManager {
    constructor() {
        this.versions = null;
    }

    async loadVersions() {
        try {
            const response = await fetch('/versions.json');
            if (!response.ok) {
                throw new Error('Failed to load versions');
            }
            this.versions = await response.json();
            return this.versions;
        } catch (error) {
            console.error('Error loading versions:', error);
            throw error;
        }
    }

    getVersion(versionId) {
        if (!this.versions) return null;
        return this.versions.versions.find(v => v.id === versionId);
    }

    getAllVersions() {
        if (!this.versions) return [];
        return this.versions.versions;
    }

    getLatestVersion() {
        if (!this.versions || !this.versions.versions.length) return null;
        return this.versions.versions[0];
    }
}

const versionManager = new VersionManager();