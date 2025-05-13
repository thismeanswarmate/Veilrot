// Cache for narrative data
let narrativeDataCache = null;

// Function to load narrative data
async function loadNarrativeData() {
    if (narrativeDataCache) {
        return narrativeDataCache;
    }

    try {
        const response = await fetch('/data/narrative.json');
        if (!response.ok) {
            throw new Error(`Failed to load narrative data: ${response.statusText}`);
        }
        narrativeDataCache = await response.json();
        return narrativeDataCache;
    } catch (error) {
        console.error('Error loading narrative data:', error);
        throw error;
    }
}

// Function to load narrative layers
async function loadNarrativeLayers() {
    try {
        const narrativeLayer = document.getElementById('narrativeLayer');
        if (!narrativeLayer) return;

        // Clear existing options except the first one
        while (narrativeLayer.options.length > 1) {
            narrativeLayer.remove(1);
        }

        const data = await loadNarrativeData();

        // Add options for each name
        for (const [_, placeData] of Object.entries(data.locations)) {
            const option = document.createElement('option');
            option.value = placeData.name;
            option.textContent = placeData.name;
            narrativeLayer.appendChild(option);
        }
    } catch (error) {
        console.error('Error loading narrative layers:', error);
    }
}

// Function to load narrative layer content
async function loadNarrativeLayerContent() {
    const narrativeButtons = document.querySelectorAll('.section-button.detail-button');
    
    try {
        const data = await loadNarrativeData();

        // Update button text to match JSON names
        for (const button of narrativeButtons) {
            const buttonText = button.textContent.trim();
            const placeData = Object.values(data.locations).find(place => place.name === buttonText);
            
            if (placeData) {
                // Update button text to match JSON name
                button.textContent = placeData.name;
                
                // Find the content box for this button
                const contentBox = button.nextElementSibling?.querySelector('.content-box');
                if (contentBox && placeData.content) {
                    contentBox.innerHTML = placeData.content;
                }
            }
        }
    } catch (error) {
        console.error('Error loading narrative content:', error);
    }
}

// Initialize narrative functionality when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM Content Loaded - Starting narrative initialization');
        await loadNarrativeLayers();
        await loadNarrativeLayerContent();
        console.log('Narrative initialization complete');
    } catch (error) {
        console.error('Error during narrative initialization:', error);
    }
}); 