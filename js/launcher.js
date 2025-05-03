class MinecraftLauncher {
    constructor() {
        this.versions = null;
        this.currentInstallation = null;
        this.serviceWorkerPath = '/service-worker.js';
        this.initialized = false;
        this.icons = null;
    }

    async init() {
        try {
            // Initialize storage first
            await storage.init();
            
            // Load data first
            await this.loadVersions();
            await this.loadIcons();
            
            // Initialize UI elements after data is loaded
            this.initElements();
            
            // Initialize event listeners after elements are ready
            this.initEventListeners();
            
            // Load installations after everything is set up
            await this.loadInstallations();
            
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize launcher:', error);
            throw error;
        }
    }

    async loadIcons() {
        try {
            const response = await fetch('icons.json');
            this.icons = await response.json();
            this.populateIconSelects();
        } catch (error) {
            console.error('Failed to load icons:', error);
        }
    }

    populateIconSelects() {
        const iconSelects = [
            document.getElementById('installation-icon'),
            document.getElementById('edit-installation-icon'),
            document.getElementById('url-installation-icon')
        ];

        iconSelects.forEach(select => {
            if (!select) return;
            select.innerHTML = this.icons.icons.map(icon => 
                `<option value="${icon.id}">${icon.name}</option>`
            ).join('');
        });
    }

    initElements() {
        // Tab elements
        this.tabBtns = document.querySelectorAll('.tab-btn') || [];
        this.tabContents = document.querySelectorAll('.tab-content') || [];
        
        // Installation elements
        this.installationModal = document.getElementById('installation-modal');
        this.installationForm = document.getElementById('installation-form');
        this.versionSelect = document.getElementById('version-select');
        this.installationsList = document.querySelector('.installations-list');
        
        // Play elements
        this.instanceSelect = document.getElementById('instance-select');
        this.playButton = document.getElementById('play-btn');
        
        // Launch modal elements
        this.launchModal = document.getElementById('launch-modal');
        this.serveButton = document.getElementById('serve-btn');
        this.blobButton = document.getElementById('blob-btn');

        // Download progress elements
        this.downloadProgress = document.getElementById('download-progress');
        if (this.downloadProgress) {
            this.progressText = this.downloadProgress.querySelector('.progress-text');
            this.progressPercentage = this.downloadProgress.querySelector('.progress-percentage');
            this.progressBarFill = this.downloadProgress.querySelector('.progress-bar-fill');
            this.downloadedSize = this.downloadProgress.querySelector('.downloaded-size');
            this.totalSize = this.downloadProgress.querySelector('.total-size');
        }

        // Edit modal elements
        this.editModal = document.getElementById('edit-installation-modal');
        this.editForm = document.getElementById('edit-installation-form');
        
        // URL installation modal elements
        this.urlModal = document.getElementById('url-installation-modal');
        this.urlForm = document.getElementById('url-installation-form');

        // Loading and error elements
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.loadingText = document.getElementById('loading-text');
        this.errorMessage = document.getElementById('error-message');
    }

    initEventListeners() {
        // Tab switching
        if (this.tabBtns) {
            this.tabBtns.forEach(btn => {
                btn?.addEventListener('click', () => this.switchTab(btn.dataset.tab));
            });
        }

        // Installation modal
        const newInstallBtn = document.getElementById('new-installation');
        if (newInstallBtn) {
            newInstallBtn.addEventListener('click', () => {
                if (this.installationModal) this.installationModal.style.display = 'block';
            });
        }

        // URL installation button
        const newUrlBtn = document.getElementById('new-url-installation');
        if (newUrlBtn) {
            newUrlBtn.addEventListener('click', () => {
                if (this.urlModal) this.urlModal.style.display = 'block';
            });
        }

        // URL installation form
        if (this.urlForm) {
            this.urlForm.addEventListener('submit', (e) => this.handleUrlInstallationSubmit(e));
        }

        // Edit installation form
        if (this.editForm) {
            this.editForm.addEventListener('submit', (e) => this.handleEditInstallationSubmit(e));
        }

        // Close buttons for all modals
        document.querySelectorAll('.close')?.forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                if (this.installationModal) this.installationModal.style.display = 'none';
                if (this.editModal) this.editModal.style.display = 'none';
                if (this.urlModal) this.urlModal.style.display = 'none';
                if (this.launchModal) this.launchModal.style.display = 'none';
            });
        });

        // Cancel buttons for all forms
        document.querySelectorAll('.cancel-btn')?.forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });

        // Installation form
        if (this.installationForm) {
            this.installationForm.addEventListener('submit', (e) => this.handleInstallationSubmit(e));
        }

        // Play button
        if (this.playButton) {
            this.playButton.addEventListener('click', () => this.handlePlay());
        }

        // Launch options
        if (this.serveButton) {
            this.serveButton.addEventListener('click', () => this.launchGame('serve'));
        }
        if (this.blobButton) {
            this.blobButton.addEventListener('click', () => this.launchGame('blob'));
        }
    }

    async loadVersions() {
        try {
            const response = await fetch('versions.json');
            if (!response.ok) {
                throw new Error('Failed to load versions');
            }
            this.versions = await response.json();
            this.populateVersionSelect();
        } catch (error) {
            console.error('Failed to load versions:', error);
            throw error;
        }
    }

    async loadInstallations() {
        const installations = await storage.getInstallations();
        
        // Only populate installations list if we're in the installations tab
        if (document.querySelector('.tab-btn[data-tab="installations"]').classList.contains('active')) {
            this.populateInstallations(installations);
        }
        
        // Only update instance select if we're in the play tab
        if (document.querySelector('.tab-btn[data-tab="play"]').classList.contains('active')) {
            this.updateInstanceSelect(installations);
        }
    }

    populateVersionSelect() {
        if (!this.versionSelect) {
            this.versionSelect = document.getElementById('version-select');
        }
        
        if (!this.versionSelect || !this.versions?.versions?.length) return;

        this.versionSelect.innerHTML = '<option value="">Select version...</option>';
        this.versions.versions.forEach(version => {
            const option = document.createElement('option');
            option.value = version.id;
            option.textContent = version.name;
            this.versionSelect.appendChild(option);
        });
    }

    populateInstallations(installations) {
        if (!this.installationsList) return;
        
        this.installationsList.innerHTML = '';
        installations.forEach(installation => {
            const item = document.createElement('div');
            item.className = 'installation-item';
            
            const iconPath = installation.customIcon || 
                (installation.iconId && this.icons.icons.find(i => i.id === installation.iconId)?.path) || 
                'assets/minecraft-logo.png';

            item.innerHTML = `
                <div class="installation-info">
                    <img src="${iconPath}" alt="${installation.name}" class="installation-icon">
                    <div>
                        <h3>${installation.name}</h3>
                        <p>${installation.version}</p>
                    </div>
                </div>
                <div class="installation-actions">
                    <button class="play-btn installation-play-btn" data-installation='${JSON.stringify(installation)}'>
                        <span class="material-icons">play_arrow</span>
                        Play
                    </button>
                    <button class="edit-btn" data-installation='${JSON.stringify(installation)}'>
                        <span class="material-icons">edit</span>
                        Edit
                    </button>
                    <button class="reinstall-btn" data-installation='${JSON.stringify(installation)}'>
                        <span class="material-icons">refresh</span>
                        Reinstall
                    </button>
                    <button class="delete-btn" data-name="${installation.name}">
                        <span class="material-icons">delete</span>
                        Delete
                    </button>
                </div>
            `;
            this.installationsList.appendChild(item);
        });

        // Add handlers
        document.querySelectorAll('.installation-play-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const installation = JSON.parse(btn.dataset.installation);
                this.currentInstallation = installation;
                
                if (installation.supportBlob) {
                    if (this.launchModal) {
                        this.launchModal.style.display = 'block';
                    } else {
                        this.launchGame('serve');
                    }
                } else {
                    this.launchGame('serve');
                }
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteInstallation(btn.dataset.name));
        });
        
        document.querySelectorAll('.reinstall-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const installation = JSON.parse(btn.dataset.installation);
                this.reinstallGame(installation);
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const installation = JSON.parse(btn.dataset.installation);
                this.showEditModal(installation);
            });
        });
    }

    updateInstanceSelect(installations) {
        if (!this.instanceSelect || !installations?.length) return;

        this.instanceSelect.innerHTML = '<option value="">Select an installation...</option>';
        installations.forEach(installation => {
            const iconPath = installation.customIcon || 
                (installation.iconId && this.icons.icons.find(i => i.id === installation.iconId)?.path) || 
                'assets/minecraft-logo.png';
            
            const option = document.createElement('option');
            option.value = JSON.stringify(installation);
            option.textContent = installation.name; // Changed from innerHTML to textContent for the option
            this.instanceSelect.appendChild(option);
        });
        
        // Convert regular select to custom select if not already done
        this.initializeCustomSelect();
    }

    initializeCustomSelect() {
        const select = this.instanceSelect;
        const parent = select.parentElement;
        
        // Check if we already converted this select
        if (parent.querySelector('.select-with-icon')) {
            const customSelect = parent.querySelector('.select-with-icon');
            customSelect.remove(); // Remove existing custom select to rebuild it
        }
        
        // Create custom select
        const customSelect = document.createElement('div');
        customSelect.className = 'select-with-icon';
        
        // Create selected display
        const selectedDisplay = document.createElement('div');
        selectedDisplay.className = 'selected-instance';
        selectedDisplay.innerHTML = '<img src="assets/minecraft-logo.png"><span>Select an installation...</span>';
        
        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'instance-dropdown';
        
        // Add options to dropdown
        Array.from(select.options).forEach(opt => {
            if (!opt.value) return; // Skip placeholder
            
            const installation = JSON.parse(opt.value);
            const iconPath = installation.customIcon || 
                (installation.iconId && this.icons.icons.find(i => i.id === installation.iconId)?.path) || 
                'assets/minecraft-logo.png';
            
            const option = document.createElement('div');
            option.className = 'instance-option';
            option.innerHTML = `
                <img src="${iconPath}" alt="${installation.name}">
                <span>${installation.name}</span>
            `;
            option.addEventListener('click', () => {
                selectedDisplay.innerHTML = `
                    <img src="${iconPath}" alt="${installation.name}">
                    <span>${installation.name}</span>
                `;
                select.value = opt.value;
                dropdown.classList.remove('show');
                this.currentInstallation = installation;
                
                // Enable play button when an instance is selected
                if (this.playButton) {
                    this.playButton.disabled = false;
                }
            });
            dropdown.appendChild(option);
        });
        
        // Toggle dropdown on click
        selectedDisplay.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!customSelect.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        // Add elements to DOM
        customSelect.appendChild(selectedDisplay);
        customSelect.appendChild(dropdown);
        
        // Hide original select and add custom one
        select.style.display = 'none';
        parent.appendChild(customSelect);
    }

    switchTab(tabId) {
        // Toggle active state on tab buttons
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Toggle visibility of tab contents
        this.tabContents.forEach(content => {
            content.classList.toggle('hidden', content.id !== `${tabId}-tab`);
            
            // Clear content that shouldn't persist between tab switches
            if (content.id !== `${tabId}-tab`) {
                if (content.querySelector('.installations-list')) {
                    content.querySelector('.installations-list').innerHTML = '';
                }
            }
        });

        // Load appropriate content based on active tab
        if (tabId === 'installations') {
            this.loadInstallations();
        } else if (tabId === 'play') {
            // Only update the instance select in play tab
            storage.getInstallations().then(installations => {
                this.updateInstanceSelect(installations);
            });
        }
    }

    async handleInstallationSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('installation-name').value;
        const versionId = this.versionSelect.value;
        const version = this.versions.versions.find(v => v.id === versionId);
        const width = parseInt(document.getElementById('window-width').value);
        const height = parseInt(document.getElementById('window-height').value);
        const iconId = document.getElementById('installation-icon').value;
        const customIcon = document.getElementById('installation-custom-icon').value;

        if (!name || !version) return;

        // Convert relative URL to absolute
        const url = new URL(version.url, window.location.href).href;

        const installation = {
            name,
            version: version.name,
            versionId,
            url,
            supportBlob: version.supportBlob,
            windowWidth: width,
            windowHeight: height,
            iconId,
            customIcon: customIcon || null
        };

        await storage.saveInstallation(installation);
        await this.loadInstallations();
        this.installationModal.style.display = 'none';
        this.installationForm.reset();
    }

    async handleUrlInstallationSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('url-installation-name').value;
        const url = document.getElementById('url-installation-url').value;
        const width = parseInt(document.getElementById('url-window-width').value);
        const height = parseInt(document.getElementById('url-window-height').value);
        const iconId = document.getElementById('url-installation-icon').value;
        const customIcon = document.getElementById('url-installation-custom-icon').value;

        if (!name || !url) return;

        const installation = {
            name,
            version: 'Custom URL',
            versionId: 'custom_' + Date.now(),
            url,
            supportBlob: true,
            windowWidth: width,
            windowHeight: height,
            iconId,
            customIcon: customIcon || null
        };

        await storage.saveInstallation(installation);
        await this.loadInstallations();
        this.urlModal.style.display = 'none';
        this.urlForm.reset();
    }

    showEditModal(installation) {
        document.getElementById('edit-installation-old-name').value = installation.name;
        document.getElementById('edit-installation-name').value = installation.name;
        document.getElementById('edit-window-width').value = installation.windowWidth || 1280;
        document.getElementById('edit-window-height').value = installation.windowHeight || 720;
        document.getElementById('edit-installation-icon').value = installation.iconId || 'default';
        document.getElementById('edit-installation-custom-icon').value = installation.customIcon || '';
        
        this.editModal.style.display = 'block';
    }

    async handleEditInstallationSubmit(e) {
        e.preventDefault();
        const oldName = document.getElementById('edit-installation-old-name').value;
        const newName = document.getElementById('edit-installation-name').value;
        const width = parseInt(document.getElementById('edit-window-width').value);
        const height = parseInt(document.getElementById('edit-window-height').value);
        const iconId = document.getElementById('edit-installation-icon').value;
        const customIcon = document.getElementById('edit-installation-custom-icon').value;

        const installations = await storage.getInstallations();
        const installationIndex = installations.findIndex(i => i.name === oldName);
        
        if (installationIndex === -1) return;

        const installation = installations[installationIndex];
        installation.name = newName;
        installation.windowWidth = width;
        installation.windowHeight = height;
        installation.iconId = iconId;
        installation.customIcon = customIcon || null;

        installations[installationIndex] = installation;
        await storage.saveInstallations(installations);
        await this.loadInstallations();

        this.editModal.style.display = 'none';
        this.editForm.reset();
    }

    openGameWindow(url) {
        const width = this.currentInstallation.windowWidth || 1280;
        const height = this.currentInstallation.windowHeight || 720;
        
        // Calculate center position
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const gameWindow = window.open(url, '_blank', 
            `width=${width},` +
            `height=${height},` +
            `left=${left},` +
            `top=${top},` +
            'toolbar=no,' +
            'menubar=no,' +
            'location=no,' +
            'status=no,' +
            'resizable=yes'
        );
        
        if (!gameWindow) {
            throw new Error('Pop-up was blocked. Please allow pop-ups for this site.');
        }
        
        return gameWindow;
    }

    async deleteInstallation(name) {
        const installation = (await storage.getInstallations()).find(i => i.name === name);
        if (installation) {
            await storage.deleteInstanceFiles(installation.versionId, installation.name);
        }
        await storage.deleteInstallation(name);
        await this.loadInstallations();
    }

    handlePlay() {
        const installationJson = this.instanceSelect?.value;
        if (!installationJson) return;

        try {
            this.currentInstallation = JSON.parse(installationJson);
            
            if (this.currentInstallation.supportBlob) {
                if (this.launchModal) {
                    this.launchModal.style.display = 'block';
                } else {
                    this.launchGame('serve'); // Fallback to serve if modal doesn't exist
                }
            } else {
                this.launchGame('serve');
            }
        } catch (error) {
            console.error('Failed to parse installation:', error);
            this.showError('Failed to launch game: Invalid installation data');
        }
    }

    async launchGame(mode) {
        if (this.launchModal) {
            this.launchModal.style.display = 'none';
        }
        
        if (!this.currentInstallation) return;

        const hasFiles = await storage.hasGameFiles(this.currentInstallation.versionId, this.currentInstallation.name);
        
        if (!hasFiles) {
            await this.downloadGameFiles();
        }

        if (mode === 'serve') {
            await this.serveGame();
        } else {
            await this.launchBlob();
        }
    }

    showLoading(message) {
        this.loadingText.textContent = message;
        this.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('active');
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.add('active');
        setTimeout(() => {
            this.errorMessage.classList.remove('active');
        }, 5000);
    }

    showProgress(show) {
        this.downloadProgress.classList.toggle('hidden', !show);
    }

    updateProgress(downloaded, total) {
        const percent = Math.round((downloaded / total) * 100);
        this.progressBarFill.style.width = `${percent}%`;
        this.progressPercentage.textContent = `${percent}%`;
        this.downloadedSize.textContent = `${(downloaded / 1024 / 1024).toFixed(2)} MB`;
        this.totalSize.textContent = `${(total / 1024 / 1024).toFixed(2)} MB`;
    }

    async downloadGameFiles() {
        this.showProgress(true);
        this.progressText.textContent = 'Downloading game files...';
        
        try {
            const response = await fetch(this.currentInstallation.url);
            if (!response.ok) {
                throw new Error(`Failed to download game files: ${response.status} ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const contentLength = +response.headers.get('Content-Length');
            let receivedLength = 0;
            const chunks = [];

            while(true) {
                const {done, value} = await reader.read();
                
                if (done) {
                    break;
                }

                chunks.push(value);
                receivedLength += value.length;
                this.updateProgress(receivedLength, contentLength);
            }

            const blob = new Blob(chunks);
            
            this.progressText.textContent = 'Extracting files...';
            
            // Create a zip reader
            const zipReader = new zip.ZipReader(new zip.BlobReader(blob));
            const entries = await zipReader.getEntries();
            
            const files = {};
            let foundIndex = false;
            let mainIndexHtml = null;
            
            // First pass: Find the root index.html if it exists
            for (const entry of entries) {
                if (!entry.directory) {
                    const paths = entry.filename.split('/');
                    // Check if file is directly in root or only one level deep
                    if (paths.length <= 2 && paths[paths.length - 1] === 'index.html') {
                        mainIndexHtml = entry;
                        foundIndex = true;
                        break;
                    }
                }
            }

            // If no root index.html was found, look for one in subdirectories
            if (!mainIndexHtml) {
                for (const entry of entries) {
                    if (!entry.directory && entry.filename.endsWith('/index.html')) {
                        mainIndexHtml = entry;
                        foundIndex = true;
                        // Get the parent directory of this index.html
                        const parentDir = entry.filename.split('/').slice(0, -1).join('/');
                        // We'll need to adjust all other file paths relative to this directory
                        break;
                    }
                }
            }

            if (!mainIndexHtml) {
                throw new Error('No index.html found in the ZIP file');
            }

            // Get the base directory for path adjustments
            const baseDir = mainIndexHtml.filename.split('/').slice(0, -1).join('/');
            const baseDirRegex = new RegExp(`^${baseDir}/?`);
            
            // Process each file in the zip
            for (const entry of entries) {
                if (!entry.directory) {
                    // Adjust the path relative to the found index.html location
                    let filename = entry.filename;
                    if (baseDir) {
                        // Only include files from the same directory as index.html or its subdirectories
                        if (!filename.startsWith(baseDir)) continue;
                        filename = filename.replace(baseDirRegex, '');
                    }
                    
                    const content = await entry.getData(
                        entry.filename.match(/\.(jpg|jpeg|png|gif|wasm|data|bin)$/i) ?
                        new zip.Uint8ArrayWriter() :
                        new zip.TextWriter()
                    );
                    
                    files[filename] = {
                        content: content,
                        type: this.getContentType(filename),
                        isBinary: entry.filename.match(/\.(jpg|jpeg|png|gif|wasm|data|bin)$/i) ? true : false
                    };
                }
            }
            
            await zipReader.close();
            await storage.saveGameFiles(this.currentInstallation.versionId, this.currentInstallation.name, files);
            console.log('Successfully saved', Object.keys(files).length, 'files');
        } catch (error) {
            console.error('Failed to download game files:', error);
            this.showError(`Failed to download game files: ${error.message}`);
            throw error;
        } finally {
            this.showProgress(false);
        }
    }

    isTextFile(filename) {
        const textExtensions = ['js', 'css', 'html', 'json', 'txt', 'xml', 'svg', 'md', 'csv'];
        const ext = filename.split('.').pop().toLowerCase();
        return textExtensions.includes(ext);
    }

    getContentType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            'js': 'application/javascript',
            'css': 'text/css',
            'html': 'text/html',
            'json': 'application/json',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'wasm': 'application/wasm',
            'data': 'application/octet-stream',
            'bin': 'application/octet-stream'
        };
        return types[ext] || 'application/octet-stream';
    }

    async serveGame() {
        this.showLoading('Preparing game files...');
        try {
            const files = await storage.getGameFiles(this.currentInstallation.versionId, this.currentInstallation.name);
            
            if (!files || Object.keys(files).length === 0) {
                throw new Error('No game files found. Try redownloading the installation.');
            }
            
            if (!files['index.html']) {
                throw new Error('index.html not found in game files');
            }

            // Register service worker with broader scope
            await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
            
            // Wait for service worker to be ready
            const registration = await navigator.serviceWorker.ready;
            
            // Send files to service worker
            registration.active.postMessage({
                type: 'SET_FILES',
                files: files
            });

            // Open game in popup window
            this.openGameWindow('/game/');
        } catch (error) {
            console.error('Failed to serve game:', error);
            this.showError(`Failed to launch game: ${error.message}`);
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async launchBlob() {
        this.showLoading('Preparing game files...');
        try {
            const files = await storage.getGameFiles(this.currentInstallation.versionId, this.currentInstallation.name);
            
            if (!files || Object.keys(files).length === 0) {
                throw new Error('No game files found. Try redownloading the installation.');
            }
            
            if (!files['index.html']) {
                throw new Error('index.html not found in game files');
            }

            // Create a blob URL for all necessary files
            const htmlContent = files['index.html'].content;
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            // Open game in popup window
            const gameWindow = this.openGameWindow(url);

            // Clean up the blob URL after ensuring it loads
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('Failed to launch game:', error);
            this.showError(`Failed to launch game: ${error.message}`);
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async reinstallGame(installation) {
        this.currentInstallation = installation;
        try {
            // Delete existing files for this specific instance
            await storage.deleteInstanceFiles(installation.versionId, installation.name);
            // Download fresh copy
            await this.downloadGameFiles();
            this.showError('Game files have been successfully reinstalled');
        } catch (error) {
            this.showError(`Failed to reinstall game: ${error.message}`);
        }
    }
}

// Initialize launcher when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const launcher = new MinecraftLauncher();
    await launcher.init();
});