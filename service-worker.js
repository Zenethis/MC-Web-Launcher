let gameFiles = {};

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
    if (event.data.type === 'SET_FILES') {
        console.log('Service worker received files:', Object.keys(event.data.files).length);
        gameFiles = event.data.files;
    }
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Only intercept requests under /game path
    if (!url.pathname.startsWith('/game/')) {
        return;
    }
    
    // Remove /game/ prefix to get the actual file path
    let path = url.pathname.replace('/game/', '');
    
    // If requesting root of /game, serve index.html
    if (path === '' || path === '/') {
        path = 'index.html';
    }

    // Only intercept if we have this file
    if (gameFiles[path]) {
        event.respondWith(
            (async () => {
                const file = gameFiles[path];
                const headers = new Headers();
                headers.set('Content-Type', file.type);
                
                let content = file.content;
                if (file.isBinary && content instanceof Uint8Array) {
                    content = content.buffer;
                }

                return new Response(content, { 
                    headers,
                    status: 200,
                    statusText: 'OK'
                });
            })()
        );
    } else {
        console.log('File not found in service worker:', path);
    }
});