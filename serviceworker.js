const version = 'V0.11';
const staticCacheName = version + 'staticfiles';
const imageCacheName = 'images';
const pagesCacheName = 'pages';

const cacheList = [
  staticCacheName,
  imageCacheName,
  pagesCacheName
];

addEventListener('install', installEvent => {
  //console.log('The service worker is installing...');
  skipWaiting();
  installEvent.waitUntil(
    caches.open(staticCacheName)
    .then( staticCache => {
      return staticCache.addAll([
        '/assets/css/styles.css',
        '/assets/js/scripts.js',
        '/assets/js/vendor/fontfaceobserver.js',
        '/assets/js/vendor/widowadjust-min.js',
        '/assets/fonts/literata-vf/Literata-Roman-VF-subset.woff2',
        '/assets/fonts/literata-vf/Literata-Italic-VF-subset.woff2',
        '/assets/images/favicons/android-chrome-192x192.png',
        '/assets/images/favicons/android-chrome-512x512.png',
        '/assets/images/favicons/apple-touch-icon.png',
        '/assets/images/favicons/favicon-16x16.png',
        '/assets/images/favicons/favicon-32x32.png',
        '/favicon.ico'
      ]); // end return addAll
    }), // end open then
    caches.open(pagesCacheName)
    .then( pagesCache => {
      return pagesCache.addAll([
        '/index.html',
        '/about/'
      ]); // end return addAll
    }) // end open then
    // Cache your files here
  ); // end waitUntil
}); // end addEventListener

addEventListener('activate', activateEvent => {
  //console.log('The service worker is activated.');
  activateEvent.waitUntil(
    caches.keys()
    .then( cacheNames => {
      return Promise.all(
        cacheNames.map( cacheName => {
          if (!cacheList.includes(cacheName)) {
            return caches.delete(cacheName);
          } // end if
        }) // end map
      ); // end return Promise.all
    }) // end keys then
    .then( () => {
      return clients.claim();
    }) // end then
  ); // end waitUntil
}); // end addEventListener

// When the browser requests a file... 

addEventListener('fetch', fetchEvent => {
  const request = fetchEvent.request;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;
  // When the user requests an HTML file 
  if (request.headers.get('Accept').includes('text/html')) {
    fetchEvent.respondWith(
      // Fetch that page from the network
      fetch(request)
      .then( responseFromFetch => {
        // Put a copy in the cache
        const copy = responseFromFetch.clone();
        fetchEvent.waitUntil(
          caches.open(pagesCacheName)
          .then( pagesCache => {
            return pagesCache.put(request, copy); 
          }) // end open then
        ); // end waitUntil
        return responseFromFetch;
      }) // end fetch then
      .catch( error => {
        // Otherwise look for a cached version of the page
        return caches.match(request)
        .then( responseFromCache => {
          if (responseFromCache) {
            return responseFromCache;
          } // end if
          // Otherwise show the fallback page
          return caches.match('/offline.html');
        }); // end match then and return
      }) // end fetch catch
    ); // end respondWith
    return; // Go no further
  } // end if

  // When the user requests an image 
  if (request.headers.get('Accept').includes('image')) {
    fetchEvent.respondWith(
      // Look for a cached version of the image
      caches.match(request)
      .then( responseFromCache => {
        if (responseFromCache) {
          return responseFromCache;
        } // end if
        // Otherwise fetch the image from the network
        return fetch(request)
        .then( responseFromFetch => {
          // Put a copy in the cache
          const copy = responseFromFetch.clone();
          fetchEvent.waitUntil(
            caches.open(imageCacheName)
            .then( imageCache => {
              return imageCache.put(request, copy);
            }) // end open then
          ); // end waitUntil
          return responseFromFetch;
        }); // end fetch then and return
      }) // end match then
    ); // end respondWith
    return; // Go no further
  } // end if
  // For everything else... 
  fetchEvent.respondWith(
    // Look for a cached version of the file
    caches.match(request)
    .then( responseFromCache => {
      if (responseFromCache) {
        return responseFromCache;
      } // end if
      // Otherwise fetch the file from the network
      return fetch(request);
    }) // end match then
  ); // end respondWith
}); // end addEventListener