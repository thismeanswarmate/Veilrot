// Function to load narrative layers
async function loadNarrativeLayers() {
    try {
        const narrativeLayer = document.getElementById('narrativeLayer');
        if (!narrativeLayer) return;

        // Clear existing options except the first one
        while (narrativeLayer.options.length > 1) {
            narrativeLayer.remove(1);
        }

        // Load the consolidated narrative file
        const response = await fetch('/data/narrative.json');
        if (!response.ok) {
            throw new Error(`Failed to load narrative data: ${response.statusText}`);
        }
        const data = await response.json();

        // Add options for each narrative layer
        for (const category in data) {
            for (const location in data[category]) {
                const narrativeData = data[category][location];
                const option = document.createElement('option');
                option.value = `${category}_${location}`;
                option.textContent = narrativeData.name;
                narrativeLayer.appendChild(option);
            }
        }
    } catch (error) {
        console.error('Error loading narrative layers:', error);
    }
}

// Function to load narrative layer content
async function loadNarrativeLayerContent() {
    const narrativeButtons = document.querySelectorAll('.section-button.detail-button');
    
    // Map display names to category and location
    const nameToLocation = {
        'Bloomheart Vault': ['sacred', 'bloomheart'],
        'Moonfall Shrine': ['sacred', 'moonfall'],
        'Saint\'s Spinefield': ['sacred', 'spinefield'],
        'Ember Choir Ruins': ['sacred', 'ember'],
        'Cracked Halo': ['sacred', 'halo'],
        'Vault of Vultures': ['sacred', 'vault'],
        'The Maw Beneath': ['corruption', 'maw'],
        'The Sinking Front': ['corruption', 'sinking'],
        'Carrion Cradle': ['corruption', 'cradle'],
        'Everbled Crossing': ['corruption', 'everbled'],
        'Mired Hollow': ['corruption', 'mired'],
        'Pale Orchard': ['corruption', 'orchard'],
        'Ashen Convoy': ['industrial', 'ashen'],
        'Hollow Outpost Sigma': ['industrial', 'outpost'],
        'Lantern Verge': ['industrial', 'lantern'],
        'Filament Spiral': ['industrial', 'filament'],
        'Throat of Echoes': ['industrial', 'throat'],
        'Gloamfang Dredge': ['industrial', 'dredge']
    };

    try {
        const response = await fetch('/data/narrative.json');
        if (!response.ok) {
            throw new Error(`Failed to load narrative data: ${response.statusText}`);
        }
        const data = await response.json();

        for (const button of narrativeButtons) {
            const buttonText = button.textContent.trim();
            const [category, location] = nameToLocation[buttonText] || [];
            
            if (!category || !location) {
                console.error(`No location mapping found for: ${buttonText}`);
                continue;
            }
            
            const narrativeData = data[category]?.[location];
            if (!narrativeData) {
                console.error(`No narrative data found for ${category}/${location}`);
                continue;
            }
            
            // Find the content box for this button
            const contentBox = button.nextElementSibling?.querySelector('.content-box');
            if (contentBox && narrativeData.content) {
                contentBox.innerHTML = narrativeData.content;
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