// Function to load narrative layers
async function loadNarrativeLayers() {
    try {
        // Get the list of narrative files from the server logs
        const narrativeFiles = [
            'corruption_cradle.json',
            'corruption_mired.json',
            'industrial_outpost.json',
            'industrial_throat.json',
            'sacred_bloomheart.json',
            'sacred_ember.json',
            'sacred_moonfall.json',
            'sacred_spinefield.json',
            'industrial_filament.json',
            'industrial_lantern.json',
            'sacred_halo.json',
            'sacred_vault.json',
            'corruption_everbled.json',
            'corruption_maw.json',
            'corruption_orchard.json',
            'industrial_ashen.json',
            'industrial_dredge.json',
            'corruption_sinking.json'
        ];

        const narrativeLayer = document.getElementById('narrativeLayer');
        if (!narrativeLayer) return;

        // Clear existing options except the first one
        while (narrativeLayer.options.length > 1) {
            narrativeLayer.remove(1);
        }

        // Add options for each narrative layer
        for (const file of narrativeFiles) {
            try {
                const response = await fetch(`/data/narrative/${file}`);
                if (!response.ok) continue;
                const data = await response.json();
                const option = document.createElement('option');
                option.value = file.replace('.json', '');
                option.textContent = data.name;
                narrativeLayer.appendChild(option);
            } catch (error) {
                console.error(`Error loading narrative file ${file}:`, error);
            }
        }
    } catch (error) {
        console.error('Error loading narrative layers:', error);
    }
}

// Function to load narrative layer content
async function loadNarrativeLayerContent() {
    const narrativeButtons = document.querySelectorAll('.section-button.detail-button');
    
    // Map display names to actual filenames
    const nameToFile = {
        'Bloomheart Vault': 'sacred_bloomheart',
        'Moonfall Shrine': 'sacred_moonfall',
        'Saint\'s Spinefield': 'sacred_spinefield',
        'Ember Choir Ruins': 'sacred_ember',
        'Cracked Halo': 'sacred_halo',
        'Vault of Vultures': 'sacred_vault',
        'The Maw Beneath': 'corruption_maw',
        'The Sinking Front': 'corruption_sinking',
        'Carrion Cradle': 'corruption_cradle',
        'Everbled Crossing': 'corruption_everbled',
        'Mired Hollow': 'corruption_mired',
        'Pale Orchard': 'corruption_orchard',
        'Ashen Convoy': 'industrial_ashen',
        'Hollow Outpost Sigma': 'industrial_outpost',
        'Lantern Verge': 'industrial_lantern',
        'Filament Spiral': 'industrial_filament',
        'Throat of Echoes': 'industrial_throat',
        'Gloamfang Dredge': 'industrial_dredge'
    };

    for (const button of narrativeButtons) {
        const buttonText = button.textContent.trim();
        const fileName = nameToFile[buttonText];
        
        if (!fileName) {
            console.error(`No filename mapping found for: ${buttonText}`);
            continue;
        }
        
        try {
            const response = await fetch(`/data/narrative/${fileName}.json`);
            if (!response.ok) {
                console.error(`Failed to load narrative content for ${fileName}: ${response.statusText}`);
                continue;
            }
            const data = await response.json();
            
            // Find the content box for this button
            const contentBox = button.nextElementSibling?.querySelector('.content-box');
            if (contentBox && data.content) {
                contentBox.innerHTML = data.content;
            }
        } catch (error) {
            console.error(`Error loading narrative content for ${fileName}:`, error);
        }
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