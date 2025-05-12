// Function to load a single content file
async function loadContentFile(filename) {
    try {
        const response = await fetch(`/data/${filename}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error loading content for ${filename}:`, error);
        return null;
    }
}

// Function to load deployment zones
async function loadDeploymentZones() {
    try {
        const response = await fetch('/data/deployment/deployment_zones.json');
        if (!response.ok) {
            throw new Error(`Failed to load deployment zones: ${response.statusText}`);
        }
        const data = await response.json();
        return data.deployment_zones;
    } catch (error) {
        console.error('Error loading deployment zones:', error);
        return [];
    }
}

// Function to load player objectives
async function loadPlayerObjectives() {
    try {
        const response = await fetch('/data/objectives/player_objectives.json');
        if (!response.ok) {
            throw new Error(`Failed to load player objectives: ${response.statusText}`);
        }
        const data = await response.json();
        return data.player_objectives;
    } catch (error) {
        console.error('Error loading player objectives:', error);
        return [];
    }
}

// Function to load objective placements
async function loadObjectivePlacements() {
    try {
        const response = await fetch('/data/objectives/objective_placement.json');
        if (!response.ok) {
            throw new Error(`Failed to load objective placements: ${response.statusText}`);
        }
        const data = await response.json();
        return data.objective_placements;
    } catch (error) {
        console.error('Error loading objective placements:', error);
        return [];
    }
}

// Function to render deployment zone table
function renderDeploymentZoneTable(deploymentZones) {
    const table = document.querySelector('table[data-content="deployment_zones"]');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = deploymentZones.map(zone => `
        <tr>
            <td class="px-4 py-2">${zone.name}</td>
            <td class="px-4 py-2">${zone.description}</td>
            <td class="px-4 py-2">${zone.setup}</td>
            <td class="px-4 py-2" style="width: 300px; height: 300px;">
                <img src="/images/${zone.image}" alt="${zone.name}" style="width: 300px; height: 300px; object-fit: contain; display: block;">
            </td>
        </tr>
    `).join('');
}

// Function to render player objectives section
function renderPlayerObjectives(objectives) {
    const container = document.querySelector('[data-content="player_objectives"]');
    if (!container) return;

    container.innerHTML = objectives.map(objective => `
        <div class="flex items-center gap-2 mb-2">
            <img src="/images/${objective.image}" alt="${objective.name}" class="w-6 h-6 object-contain">
            <span>${objective.name}</span>
        </div>
    `).join('');
}

// Function to render objective placement table
function renderObjectivePlacementTable(placements) {
    const table = document.querySelector('table[data-content="objective_placements"]');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = placements.map(placement => `
        <tr>
            <td class="px-4 py-2">${placement.name}</td>
            <td class="px-4 py-2">${placement.description}</td>
            <td class="px-4 py-2">${placement.setup}</td>
            <td class="px-4 py-2" style="width: 300px; height: 300px;">
                <img src="/images/${placement.image}" alt="${placement.name}" style="width: 300px; height: 300px; object-fit: contain; display: block;">
            </td>
        </tr>
    `).join('');
}

// Function to load all content
async function loadAllContent() {
    try {
        // Load all data in parallel
        const [
            equipmentData,
            deploymentZones,
            playerObjectives,
            objectivePlacements
        ] = await Promise.all([
            loadContentFile('equipment.json'),
            loadDeploymentZones(),
            loadPlayerObjectives(),
            loadObjectivePlacements()
        ]);

        if (!equipmentData) return;

        // Load all section files
        const sectionPromises = equipmentData.sections.map(async (section) => {
            const data = await loadContentFile(section.file);
            if (data) {
                const element = document.querySelector(`[data-content="${section.file.replace('.json', '')}"]`);
                if (element) {
                    renderHtmlContent(element, data);
                }
            }
        });

        // Wait for all sections to load
        await Promise.all(sectionPromises);

        // Render the new data
        renderDeploymentZoneTable(deploymentZones);
        renderPlayerObjectives(playerObjectives);
        renderObjectivePlacementTable(objectivePlacements);
        
        return true;
    } catch (error) {
        console.error('Error loading content:', error);
        return false;
    }
}

// Initialize content loading when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM Content Loaded - Starting content initialization');
        await loadAllContent();
        console.log('Content initialization complete');
    } catch (error) {
        console.error('Error during content initialization:', error);
    }
}); 