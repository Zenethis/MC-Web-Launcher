class ContentManager {
    constructor() {
        this.resourcePacks = [];
        this.mods = [];
    }

    async init() {
        await this.loadResourcePacks();
        await this.loadMods();
    }

    async loadResourcePacks() {
        try {
            const response = await fetch('packs.json');
            const data = await response.json();
            this.resourcePacks = data.resourcePacks;
            this.populateResourcePacks();
        } catch (error) {
            console.error('Error loading resource packs:', error);
        }
    }

    async loadMods() {
        try {
            const response = await fetch('mods.json');
            const data = await response.json();
            this.mods = data.mods;
            this.populateMods();
        } catch (error) {
            console.error('Error loading mods:', error);
        }
    }

    populateResourcePacks() {
        const container = document.querySelector('.packs-grid');
        if (!container) return;

        container.innerHTML = this.resourcePacks.map(pack => `
            <div class="pack-item">
                <img src="${pack.icon}" alt="${pack.title}">
                <h3>${pack.title}</h3>
                <p>${pack.description}</p>
                <button class="download-btn" onclick="contentManager.downloadPack('${pack.path}', '${pack.title}')">
                    <span class="material-icons">download</span>
                    Download
                </button>
            </div>
        `).join('');
    }

    populateMods() {
        const container = document.querySelector('.mods-grid');
        if (!container) return;

        container.innerHTML = this.mods.map(mod => `
            <div class="mod-item">
                <img src="${mod.icon}" alt="${mod.title}">
                <h3>${mod.title}</h3>
                <p>${mod.description}</p>
                <button class="download-btn" onclick="contentManager.downloadMod('${mod.path}', '${mod.title}')">
                    <span class="material-icons">download</span>
                    Download
                </button>
            </div>
        `).join('');
    }

    async downloadPack(path, title) {
        try {
            // Show downloading screen
            const progress = document.getElementById('download-progress');
            if (progress) {
                progress.classList.remove('hidden');
                progress.querySelector('.progress-text').textContent = 'Downloading...';
                progress.querySelector('.progress-percentage').textContent = '';
                progress.querySelector('.progress-bar-fill').style.width = '100%';
                progress.querySelector('.downloaded-size').textContent = '';
                progress.querySelector('.total-size').textContent = '';
            }
            const response = await fetch(path);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = title + '.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading resource pack:', error);
        } finally {
            // Hide downloading screen
            const progress = document.getElementById('download-progress');
            if (progress) progress.classList.add('hidden');
        }
    }

    async downloadMod(path, title) {
        try {
            // Show downloading screen
            const progress = document.getElementById('download-progress');
            if (progress) {
                progress.classList.remove('hidden');
                progress.querySelector('.progress-text').textContent = 'Downloading...';
                progress.querySelector('.progress-percentage').textContent = '';
                progress.querySelector('.progress-bar-fill').style.width = '100%';
                progress.querySelector('.downloaded-size').textContent = '';
                progress.querySelector('.total-size').textContent = '';
            }
            const response = await fetch(path);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // Use the original file extension from the path
            const extension = path.split('.').pop();
            a.download = title + '.' + extension;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading mod:', error);
        } finally {
            // Hide downloading screen
            const progress = document.getElementById('download-progress');
            if (progress) progress.classList.add('hidden');
        }
    }
}

// Initialize content manager when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.contentManager = new ContentManager();
    await contentManager.init();
});
