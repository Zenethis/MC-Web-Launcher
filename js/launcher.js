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
        
        // Play elements (updated for new UI)
        // Find the play button and instance select inside the new .game-banner .version-selector
        const playTab = document.getElementById('play-tab');
        if (playTab) {
            const versionSelector = playTab.querySelector('.version-selector');
            if (versionSelector) {
                this.playButton = versionSelector.querySelector('#play-btn') || versionSelector.querySelector('.play-button');
                // Create/select a dropdown for installations if not present
                this.instanceSelect = versionSelector.querySelector('#instance-select');
                if (!this.instanceSelect) {
                    // If not present, create and insert it before the play button
                    this.instanceSelect = document.createElement('select');
                    this.instanceSelect.id = 'instance-select';
                    this.instanceSelect.innerHTML = '<option value="">Select an installation...</option>';
                    versionSelector.insertBefore(this.instanceSelect, this.playButton);
                }
            }
        }
        
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
            option.textContent = installation.name;
            this.instanceSelect.appendChild(option);
        });
        // Do NOT call initializeCustomSelect here, keep the native select
        // this.initializeCustomSelect();
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

// --- Skin Tab Logic (moved from index.html, now uses names.txt, iframe preview) ---
let currentSkinPage = 1;
let totalSkinPages = 1;
const SKINS_PER_PAGE = 60;
let allSkinNames = [];

async function fetchSkinNames() {
    const resp = await fetch('names.txt');
    const text = await resp.text();
    return text.split(/\s+/).filter(Boolean);
}

function createSkinCard(name, onClick) {
    const card = document.createElement('div');
    card.className = 'skin-card';
    card.innerHTML = `
        <img src="https://mineskin.eu/armor/body/${encodeURIComponent(name)}/100.png" alt="${name}" />
        <div class="skin-name">${name}</div>
    `;
    card.onclick = () => onClick(name);
    return card;
}

function renderSkinPagination() {
    let pagination = document.getElementById('skins-pagination');
    if (!pagination) {
        pagination = document.createElement('div');
        pagination.id = 'skins-pagination';
        pagination.style.display = 'flex';
        pagination.style.justifyContent = 'center';
        pagination.style.alignItems = 'center';
        pagination.style.gap = '12px';
        pagination.style.margin = '16px 0 0 0';
        const grid = document.getElementById('skins-grid');
        if (grid && grid.parentNode) {
            grid.parentNode.appendChild(pagination);
        }
    }
    pagination.innerHTML = '';
    // Prev button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentSkinPage === 1;
    prevBtn.onclick = () => {
        if (currentSkinPage > 1) {
            currentSkinPage--;
            populateSkinsGrid();
        }
    };
    pagination.appendChild(prevBtn);
    // Page input
    const pageInput = document.createElement('input');
    pageInput.type = 'number';
    pageInput.min = 1;
    pageInput.max = totalSkinPages;
    pageInput.value = currentSkinPage;
    pageInput.style.width = '48px';
    pageInput.style.textAlign = 'center';
    pageInput.onchange = () => {
        let val = parseInt(pageInput.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > totalSkinPages) val = totalSkinPages;
        currentSkinPage = val;
        populateSkinsGrid();
    };
    pagination.appendChild(pageInput);
    // Page label
    const pageLabel = document.createElement('span');
    pageLabel.textContent = ` / ${totalSkinPages}`;
    pagination.appendChild(pageLabel);
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentSkinPage === totalSkinPages;
    nextBtn.onclick = () => {
        if (currentSkinPage < totalSkinPages) {
            currentSkinPage++;
            populateSkinsGrid();
        }
    };
    pagination.appendChild(nextBtn);
}

async function populateSkinsGrid() {
    const skinGrid = document.getElementById('skins-grid');
    if (!skinGrid) return;
    if (allSkinNames.length === 0) {
        allSkinNames = await fetchSkinNames();
    }
    totalSkinPages = Math.ceil(allSkinNames.length / SKINS_PER_PAGE);
    if (currentSkinPage > totalSkinPages) currentSkinPage = totalSkinPages;
    if (currentSkinPage < 1) currentSkinPage = 1;
    const start = (currentSkinPage - 1) * SKINS_PER_PAGE;
    const end = start + SKINS_PER_PAGE;
    skinGrid.innerHTML = '';
    allSkinNames.slice(start, end).forEach(name => {
        skinGrid.appendChild(createSkinCard(name, showSkinPreview));
    });
    renderSkinPagination();
}

function showSkinPreview(name) {
    const previewContainer = document.getElementById('skin-preview-container');
    // Remove any existing modal content to avoid duplicate iframes
    previewContainer.innerHTML = '';
    // Modal content wrapper
    const modalContent = document.createElement('div');
    modalContent.id = 'skin-preview-modal-content';
    modalContent.style.background = '#232323';
    modalContent.style.borderRadius = '16px';
    modalContent.style.boxShadow = '0 8px 32px rgba(0,0,0,0.55)';
    modalContent.style.padding = '32px 24px 24px 24px';
    modalContent.style.position = 'relative';
    modalContent.style.display = 'flex';
    modalContent.style.flexDirection = 'column';
    modalContent.style.alignItems = 'center';
    modalContent.style.maxWidth = '95vw';
    modalContent.style.maxHeight = '95vh';
    // Create a new iframe for every preview to ensure param is always set
    const previewFrame = document.createElement('iframe');
    previewFrame.id = 'skin-preview-frame';
    // Use absolute path for iframe src to avoid base href or relative path issues
    previewFrame.src = window.location.origin + '/skin-display?skin=' + encodeURIComponent('https://mineskin.eu/skin/' + name);
    previewFrame.style.width = '340px';
    previewFrame.style.height = '540px';
    previewFrame.style.maxWidth = '90vw';
    previewFrame.style.maxHeight = '70vh';
    previewFrame.style.border = 'none';
    previewFrame.style.borderRadius = '10px';
    previewFrame.style.background = '#181818';
    previewFrame.style.boxShadow = '0 2px 12px rgba(0,0,0,0.25)';
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.id = 'skin-preview-close';
    closeBtn.className = 'skin-preview-close';
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '12px';
    closeBtn.style.right = '18px';
    closeBtn.style.fontSize = '2.2em';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.color = '#fff';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.zIndex = '10001';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        previewContainer.style.display = 'none';
        previewContainer.innerHTML = '';
    };
    // Add download button
    const dl = document.createElement('a');
    dl.id = 'skin-download-btn';
    dl.className = 'skin-download-btn';
    dl.textContent = 'Download Skin';
    dl.href = `https://mineskin.eu/download/${encodeURIComponent(name)}`;
    dl.download = `${name}.png`;
    dl.style.display = 'block';
    dl.style.margin = '24px auto 0 auto';
    dl.style.background = '#4caf50';
    dl.style.color = '#fff';
    dl.style.padding = '12px 36px';
    dl.style.fontWeight = 'bold';
    dl.style.fontSize = '1.1em';
    dl.style.borderRadius = '8px';
    dl.style.textDecoration = 'none';
    dl.style.textAlign = 'center';
    dl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.13)';
    dl.style.cursor = 'pointer';
    // Assemble modal
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(previewFrame);
    modalContent.appendChild(dl);
    previewContainer.appendChild(modalContent);
    // Style the overlay
    previewContainer.style.display = 'flex';
    previewContainer.style.position = 'fixed';
    previewContainer.style.left = '0';
    previewContainer.style.top = '0';
    previewContainer.style.width = '100vw';
    previewContainer.style.height = '100vh';
    previewContainer.style.background = 'rgba(0,0,0,0.85)';
    previewContainer.style.justifyContent = 'center';
    previewContainer.style.alignItems = 'center';
    previewContainer.style.zIndex = '9999';
    previewContainer.style.marginTop = '0';
    // Allow clicking outside modal to close
    previewContainer.onclick = (e) => {
        if (e.target === previewContainer) {
            previewContainer.style.display = 'none';
            previewContainer.innerHTML = '';
        }
    };
}

function setupCustomSkinInput() {
    const customBtn = document.getElementById('custom-skin-btn');
    const customInput = document.getElementById('custom-skin-name');
    if (customBtn && customInput) {
        customBtn.onclick = () => {
            const name = customInput.value.trim();
            if (name) showSkinPreview(name);
        };
    }
}

// Only run if skins tab exists
if (document.getElementById('skins-grid')) {
    populateSkinsGrid();
    setupCustomSkinInput();
}

// --- Data URL Tab Logic ---
function setupDataUrlTab() {
    const tab = document.getElementById('data-url-tab');
    if (!tab) return;
    const controls = document.getElementById('data-url-controls');
    const bookmarkletContainer = document.getElementById('data-url-bookmarklet-container');
    controls.innerHTML = '';
    bookmarkletContainer.innerHTML = '';

    // Fetch versions.json for blob-supporting versions
    fetch('versions.json').then(r => r.json()).then(data => {
        const versions = (data.versions || []).filter(v => v.supportBlob);
        if (!versions.length) {
            controls.innerHTML = '<span style="color:#e57373">No blob-supported versions found.</span>';
            return;
        }
        const select = document.createElement('select');
        select.style.marginRight = '12px';
        versions.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = v.name;
            select.appendChild(opt);
        });
        controls.appendChild(select);
        const genBtn = document.createElement('button');
        genBtn.textContent = 'Generate Bookmarklet';
        genBtn.style.padding = '8px 18px';
        genBtn.style.background = '#4caf50';
        genBtn.style.color = '#fff';
        genBtn.style.border = 'none';
        genBtn.style.borderRadius = '6px';
        genBtn.style.fontWeight = '600';
        genBtn.style.cursor = 'pointer';
        controls.appendChild(genBtn);
        genBtn.onclick = async () => {
            bookmarkletContainer.innerHTML = '<span style="color:#aaa">Generating, please wait...</span>';
            const versionId = select.value;
            const version = versions.find(v => v.id === versionId);
            if (!version) return;
            try {
                const resp = await fetch(version.url);
                if (!resp.ok) throw new Error('Failed to fetch version zip');
                const blob = await resp.blob();
                const zipReader = new zip.ZipReader(new zip.BlobReader(blob));
                const entries = await zipReader.getEntries();
                let mainIndexHtml = null;
                for (const entry of entries) {
                    if (!entry.directory && entry.filename.endsWith('index.html')) {
                        mainIndexHtml = entry;
                        break;
                    }
                }
                if (!mainIndexHtml) throw new Error('index.html not found in zip');
                const html = await mainIndexHtml.getData(new zip.TextWriter());
                await zipReader.close();
                // Use plain data:text/html, not base64, for smaller size
                let htmlStr = html;
                if (htmlStr.charCodeAt(0) === 0xFEFF) htmlStr = htmlStr.slice(1);
                const dataUrl = 'data:text/html,' + encodeURIComponent(htmlStr).replace(/%20/g, '+');
                // --- UI: bookmarklet + copy button + textarea ---
                const a = document.createElement('a');
                a.href = dataUrl;
                a.textContent = 'Drag Me To Bookmarks (' + version.name + ')';
                a.style.display = 'inline-block';
                a.style.padding = '12px 24px';
                a.style.background = '#4caf50';
                a.style.color = '#fff';
                a.style.fontWeight = 'bold';
                a.style.borderRadius = '8px';
                a.style.textDecoration = 'none';
                a.style.marginTop = '12px';
                a.draggable = true;
                a.title = 'Drag this to your bookmarks bar!';
                // Copy button
                const copyBtn = document.createElement('button');
                copyBtn.textContent = 'Copy Data URL';
                copyBtn.style.marginLeft = '18px';
                copyBtn.style.padding = '10px 18px';
                copyBtn.style.background = '#2196f3';
                copyBtn.style.color = '#fff';
                copyBtn.style.border = 'none';
                copyBtn.style.borderRadius = '6px';
                copyBtn.style.fontWeight = '600';
                copyBtn.style.cursor = 'pointer';
                // Textarea (hidden by default)
                const textarea = document.createElement('textarea');
                textarea.value = dataUrl;
                textarea.readOnly = true;
                textarea.style.width = '100%';
                textarea.style.height = '80px';
                textarea.style.marginTop = '14px';
                textarea.style.fontSize = '0.95em';
                textarea.style.display = 'none';
                // Copy logic
                copyBtn.onclick = () => {
                    textarea.style.display = 'block';
                    textarea.select();
                    try {
                        document.execCommand('copy');
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => { copyBtn.textContent = 'Copy Data URL'; }, 1200);
                    } catch (e) {
                        copyBtn.textContent = 'Failed to copy';
                        setTimeout(() => { copyBtn.textContent = 'Copy Data URL'; }, 1200);
                    }
                };
                // Render
                bookmarkletContainer.innerHTML = '';
                bookmarkletContainer.appendChild(a);
                bookmarkletContainer.appendChild(copyBtn);
                bookmarkletContainer.appendChild(textarea);
            } catch (e) {
                bookmarkletContainer.innerHTML = '<span style="color:#e57373">Error: ' + e.message + '</span>';
            }
        };
    });
}
// Show/hide Data Url tab on tab switch
(function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (btn.dataset.tab === 'data-url') {
                setupDataUrlTab();
            }
        });
    });
})();

// Initialize launcher when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const launcher = new MinecraftLauncher();
    await launcher.init();
});
document.addEventListener('DOMContentLoaded', function() {
    // Settings panel logic
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettings = document.getElementById('close-settings');
    const musicCheckbox = document.getElementById('toggle-music');
    const bgMusic = document.getElementById('bg-music');
    let musicStarted = false;
    let musicList = [];
    let currentSongIdx = 0;

    // --- Music JSON loading and song select ---
    fetch('music.json')
        .then(resp => resp.json())
        .then(list => {
            musicList = Array.isArray(list) ? list : (list.songs || []);
            // If musicList is empty, fallback to default
            if (!musicList.length) {
                musicList = [{
                    name: 'Lucky All Day by Mazbou',
                    path: 'assets/audio/background-lucky-all-day-mazbou.mp3'
                }];
            }
            // Build song select in settings
            let songSelect = document.getElementById('song-select');
            if (!songSelect) {
                songSelect = document.createElement('select');
                songSelect.id = 'song-select';
                songSelect.style.marginLeft = '8px';
                const label = document.createElement('label');
                label.textContent = 'Song:';
                label.style.display = 'flex';
                label.style.alignItems = 'center';
                label.style.gap = '8px';
                label.appendChild(songSelect);
                settingsPanel.insertBefore(label, closeSettings);
            }
            songSelect.innerHTML = musicList.map((song, i) => `<option value="${i}">${song.name}</option>`).join('');
            // Load from localStorage
            const savedIdx = localStorage.getItem('selectedSongIdx');
            if (savedIdx !== null && musicList[savedIdx]) {
                currentSongIdx = parseInt(savedIdx, 10);
                songSelect.value = currentSongIdx;
            }
            // Set music src and label
            function setSong(idx) {
                currentSongIdx = idx;
                localStorage.setItem('selectedSongIdx', idx);
                bgMusic.src = musicList[idx].path;
                // Update label in visualizer
                document.querySelectorAll('.visualizer-label').forEach(el => {
                    el.textContent = musicList[idx].name;
                });
                // If music is enabled and started, play new song
                if (musicCheckbox && musicCheckbox.checked && musicStarted) {
                    bgMusic.play();
                }
            }
            setSong(currentSongIdx);
            songSelect.onchange = e => setSong(parseInt(e.target.value, 10));
        });

    // --- Settings panel open/close ---
    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            settingsPanel.classList.remove('hidden');
            settingsPanel.style.display = 'block'; // Ensure it is visible
        });
    }
    if (closeSettings && settingsPanel) {
        closeSettings.addEventListener('click', function(e) {
            e.preventDefault();
            settingsPanel.classList.add('hidden');
            settingsPanel.style.display = 'none'; // Ensure it is hidden
        });
    }

    // --- Audio Visualizer Setup ---
    let audioCtx, analyser, dataArray, visualizerAnim;
    function setupVisualizer() {
        if (!audioCtx && window.AudioContext && bgMusic) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaElementSource(bgMusic);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64; // Smoother bars
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            dataArray = new Uint8Array(analyser.frequencyBinCount);
        }
    }
    function drawVisualizer() {
        // Only draw if the visualizer is inside the banner
        const banner = document.querySelector('.game-banner');
        let visualizer = banner ? banner.querySelector('.audio-visualizer-header') : null;
        if (!visualizer) {
            // Remove any stray visualizer elsewhere
            document.querySelectorAll('.audio-visualizer-header').forEach(el => {
                if (!el.closest('.game-banner')) el.remove();
            });
            // If not present, create and append it
            visualizer = document.createElement('div');
            visualizer.className = 'audio-visualizer-header';
            visualizer.innerHTML = '<canvas id="audio-visualizer" width="120" height="48"></canvas><span class="visualizer-label">Eaglercraft Lofi Beats</span>';
            if (banner) banner.appendChild(visualizer);
        }
        const canvas = visualizer.querySelector('#audio-visualizer');
        if (!canvas || !analyser) return;
        const ctx = canvas.getContext('2d');
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // --- Center-out visualizer: bars expand outward from center ---
        const barCount = 18;
        const barGap = 4;
        const barWidth = 5;
        const centerX = canvas.width / 2;
        const maxBarHeight = canvas.height - 6;
        // Draw bars from center out, left and right
        for (let i = 0; i < barCount; i++) {
            // Map bars so 0 is center, 1 is right1, 2 is left1, 3 is right2, 4 is left2, ...
            let x;
            if (i === 0) {
                x = centerX - barWidth / 2;
            } else if (i % 2 === 1) {
                // right
                x = centerX + (Math.ceil(i / 2)) * (barWidth + barGap) - barWidth / 2;
            } else {
                // left
                x = centerX - (Math.ceil(i / 2)) * (barWidth + barGap) - barWidth / 2;
            }
            // Use frequency data in order (center out)
            let freqIdx = Math.floor(i * dataArray.length / barCount);
            let avg = 0;
            for (let jj = -1; jj <= 1; jj++) {
                const safeIdx = Math.min(Math.max(freqIdx + jj, 0), dataArray.length - 1);
                avg += dataArray[safeIdx];
            }
            avg /= 3;
            // --- Reduce bar strength for less height ---
            const prev = canvas._prevBarHeights?.[i] || 0;
            // Lower the minimum and scale down the amplitude
            const target = Math.max(4, avg / 4.5); // was 10, avg/1.3
            const barHeight = prev + (target - prev) * 0.18; // slower lerp for smoother effect
            canvas._prevBarHeights = canvas._prevBarHeights || [];
            canvas._prevBarHeights[i] = barHeight;
            ctx.fillStyle = '#7ed6df';
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        }
        // Animate
        visualizerAnim = requestAnimationFrame(drawVisualizer);
    }
    function startVisualizer() {
        setupVisualizer();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        if (!visualizerAnim) drawVisualizer();
    }
    function stopVisualizer() {
        if (visualizerAnim) cancelAnimationFrame(visualizerAnim);
        visualizerAnim = null;
        // Only clear the canvas in the banner
        const banner = document.querySelector('.game-banner');
        const visualizer = banner ? banner.querySelector('.audio-visualizer-header') : null;
        if (visualizer) {
            const canvas = visualizer.querySelector('#audio-visualizer');
            if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
        // Remove any stray visualizer elsewhere
        document.querySelectorAll('.audio-visualizer-header').forEach(el => {
            if (!el.closest('.game-banner')) el.remove();
        });
    }

    // --- Music Toggle Persistence ---
    if (musicCheckbox) {
        const saved = localStorage.getItem('playBackgroundMusic');
        if (saved !== null) {
            musicCheckbox.checked = saved === 'true';
        }
    }
    if (musicCheckbox && bgMusic) {
        musicCheckbox.addEventListener('change', () => {
            localStorage.setItem('playBackgroundMusic', musicCheckbox.checked ? 'true' : 'false');
            if (musicCheckbox.checked) {
                if (musicStarted) {
                    bgMusic.play();
                    startVisualizer();
                }
            } else {
                bgMusic.pause();
                stopVisualizer();
            }
        });
        if (!musicCheckbox.checked) {
            bgMusic.pause();
            stopVisualizer();
        }
    }
    // Only start music on first user click
    window.addEventListener('click', function() {
        if (bgMusic && musicCheckbox && musicCheckbox.checked && !musicStarted) {
            bgMusic.volume = 0.5;
            bgMusic.play();
            startVisualizer();
            musicStarted = true;
        }
    }, { once: true });
    // Pause visualizer if music is paused/stopped
    if (bgMusic) {
        bgMusic.addEventListener('pause', stopVisualizer);
        bgMusic.addEventListener('play', function() {
            if (musicCheckbox && musicCheckbox.checked) startVisualizer();
        });
    }
});
