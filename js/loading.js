// Track loading progress
let loadedFiles = 0;
let totalFiles = 0;
let pendingRequests = new Set();
let loadedRequests = new Set();
let hasShownContent = false;
let isPageReloading = false;
let initialLoadComplete = false;
let isInitialLoad = true;

// Function to log state
function logState(message) {
  console.log(`[DEBUG] ${message}`);
  console.log('[DEBUG] Current State:');
  console.log('- Total files:', totalFiles);
  console.log('- Loaded files:', loadedFiles);
  console.log('- Pending requests:', pendingRequests.size);
  console.log('- Loaded requests:', loadedRequests.size);
  console.log('- Is page reloading:', isPageReloading);
  console.log('- Initial load complete:', initialLoadComplete);
  console.log('- Has shown content:', hasShownContent);
  console.log('- Is initial load:', isInitialLoad);
  console.log('- Pending files:', Array.from(pendingRequests));
  console.log('- Loaded files:', Array.from(loadedRequests));
}

// Function to check if required elements exist
function checkElements() {
  const loadingOverlay = document.querySelector('.loading-overlay');
  const mainContent = document.querySelector('.main-content');
  
  if (loadingOverlay && mainContent) {
    console.log('[DEBUG] Required elements found');
    return true;
  }
  
  console.log('[DEBUG] Required elements not found');
  return false;
}

// Function to show content and hide loading screen
function showContent() {
  logState('Attempting to show content');
  
  if (!hasShownContent && isInitialLoad) {
    if (!checkElements()) {
      console.error('[ERROR] Required elements not found');
      return;
    }
    
    const loadingOverlay = document.querySelector('.loading-overlay');
    const mainContent = document.querySelector('.main-content');
    
    try {
      loadingOverlay.classList.add('hidden');
      mainContent.classList.add('loaded');
      hasShownContent = true;
      initialLoadComplete = true;
      isInitialLoad = false;
      logState('Content shown successfully');
    } catch (error) {
      console.error('[ERROR] Failed to update element classes:', error);
    }
  } else {
    console.log('[DEBUG] Content already shown or not initial load, skipping');
  }
}

// Function to track a new file request
function trackFileRequest(filename) {
  if (!loadedRequests.has(filename) && !pendingRequests.has(filename)) {
    console.log(`[DEBUG] Tracking new file request: ${filename}`);
    pendingRequests.add(filename);
    totalFiles++;
    logState('New file request tracked');
  }
}

// Function to mark a file as loaded
function markFileLoaded(filename) {
  console.log(`[DEBUG] Marking file as loaded: ${filename}`);
  pendingRequests.delete(filename);
  loadedRequests.add(filename);
  loadedFiles++;
  logState('File loaded');
  
  if (pendingRequests.size === 0 && !isPageReloading && isInitialLoad) {
    console.log('[DEBUG] All files loaded, showing content');
    showContent();
  }
}

// Function to load a single file
async function loadFile(filename) {
  try {
    console.log(`[DEBUG] Attempting to load ${filename}...`);
    if (loadedRequests.has(filename)) {
      console.log(`[DEBUG] File already loaded: ${filename}`);
      // Return the cached data for JSON files
      if (filename.endsWith('.json')) {
        const response = await fetch(filename);
        if (!response.ok) {
          console.error(`[ERROR] Failed to reload ${filename}: ${response.status} ${response.statusText}`);
          return null;
        }
        const data = await response.json();
        console.log(`[DEBUG] Successfully reloaded JSON: ${filename}`);
        return data;
      }
      return true;
    }
    
    trackFileRequest(filename);
    
    const response = await fetch(filename);
    if (!response.ok) {
      console.error(`[ERROR] Failed to load ${filename}: ${response.status} ${response.statusText}`);
      markFileLoaded(filename);
      return null;
    }

    // Handle different file types
    if (filename.endsWith('.json')) {
      const data = await response.json();
      console.log(`[DEBUG] Successfully loaded JSON: ${filename}`);
      markFileLoaded(filename);
      return data;
    } else {
      // For non-JSON files (images, CSS, etc.)
      await response.blob();
      console.log(`[DEBUG] Successfully loaded file: ${filename}`);
      markFileLoaded(filename);
      return true;
    }
  } catch (error) {
    console.error(`[ERROR] Error loading ${filename}:`, error);
    markFileLoaded(filename);
    return null;
  }
}

// Function to load all files
async function loadAllFiles() {
  console.log('[DEBUG] Starting loadAllFiles');
  const container = document.getElementById('rules-container');
  const loadingDiv = document.createElement('div');
  loadingDiv.textContent = 'Loading rules...';
  container.appendChild(loadingDiv);

  try {
    // Load initial JSON files
    const initialFiles = [
      'data/introduction.json',
      'data/core_rules.json',
      'data/the_warband.json',
      'data/factions.json',
      'data/equipment.json',
      'data/battles.json',
      'data/generate_mission.json'
    ];

    console.log('[DEBUG] Starting to load initial files...');
    const results = await Promise.all(initialFiles.map(file => loadFile(file)));
    console.log('[DEBUG] Results:', results);
    
    const validResults = results.filter(result => result !== null && result !== true);
    console.log('[DEBUG] Valid results:', validResults);
    
    console.log(`[DEBUG] Loaded ${validResults.length} out of ${initialFiles.length} initial files`);
    
    // Clear loading message
    container.innerHTML = '';

    if (validResults.length === 0) {
      console.error('[ERROR] No valid results found');
      container.innerHTML = '<div class="text-red-500">Failed to load any files. Please check the console for errors.</div>';
      return;
    }

    // Create a map of loaded files
    const fileMap = new Map();
    initialFiles.forEach((file, index) => {
      if (results[index] && results[index] !== true) {
        fileMap.set(file, {
          data: results[index],
          parent: null
        });
      }
    });

    console.log('[DEBUG] File map:', fileMap);

    // Process top-level sections
    for (const file of initialFiles) {
      if (fileMap.has(file)) {
        console.log(`[DEBUG] Processing file: ${file}`);
        const data = fileMap.get(file).data;
        
        // Create section container
        const sectionContainer = document.createElement('div');
        sectionContainer.className = 'section-buttons';
        
        // Use renderSection to create the button and content
        renderSection(data, sectionContainer, 0);
        
        container.appendChild(sectionContainer);
      }
    }

    // Remove the display style override since we're using max-height transitions
    // document.querySelectorAll('.collapsible-content').forEach(content => {
    //   content.style.display = 'none';
    // });
  } catch (error) {
    console.error('[ERROR] Error in loadAllFiles:', error);
    container.innerHTML = '<div class="text-red-500">An error occurred while loading the files. Please check the console for details.</div>';
  }
}

// Initialize loading when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadAllFiles();
}); 