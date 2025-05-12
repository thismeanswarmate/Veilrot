let abilities = {};
let tooltipTimeout = null;
let currentTooltip = null;
let weaponTraits = null;
let armorTraits = null;
let tooltipElements = new Map(); // Store tooltip elements
let activeTooltipElement = null; // Track the currently active tooltip element
let isInitialized = false; // Track if initialization is complete

// Function to render HTML content
function renderHtmlContent(element, content) {
    if (typeof content === 'string') {
        element.innerHTML = content;
    } else if (content && typeof content === 'object') {
        if (content.content) {
            element.innerHTML = content.content;
        }
    }
}

// Function to hide all tooltips
function hideAllTooltips() {
    if (currentTooltip) {
        currentTooltip.style.display = 'none';
        currentTooltip = null;
    }
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
    }
    activeTooltipElement = null;
}

// Function to show tooltip
function showTooltip(element, tooltip) {
    if (currentTooltip) {
        currentTooltip.style.display = 'none';
    }
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
    }
    
    currentTooltip = tooltip;
    tooltipTimeout = setTimeout(() => {
        tooltip.style.display = 'block';
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.bottom + 5}px`;
    }, 100);
}

// Function to hide tooltip
function hideTooltip() {
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
    }
    if (currentTooltip) {
        currentTooltip.style.display = 'none';
        currentTooltip = null;
    }
}

// Load abilities data
async function loadAbilities() {
    if (Object.keys(abilities).length > 0) {
        return; // Already loaded
    }
    try {
        const response = await fetch('/data/abilities.json');
        const data = await response.json();
        abilities = data.abilities;
    } catch (error) {
        console.error('Error loading abilities:', error);
    }
}

// Load trait data
async function loadTraitData() {
    try {
        const [weaponResponse, armorResponse] = await Promise.all([
            fetch('/data/weapon_traits.json'),
            fetch('/data/armor_traits.json')
        ]);
        weaponTraits = await weaponResponse.json();
        armorTraits = await armorResponse.json();
        
        // Render the trait tables
        const weaponTraitsElement = document.querySelector('[data-content="weapon_traits"]');
        const armorTraitsElement = document.querySelector('[data-content="armor_traits"]');
        
        if (weaponTraitsElement) renderHtmlContent(weaponTraitsElement, weaponTraits);
        if (armorTraitsElement) renderHtmlContent(armorTraitsElement, armorTraits);
    } catch (error) {
        console.error('Error loading trait data:', error);
    }
}

// Format ability description with threshold
function formatAbilityDescription(ability) {
    if (!ability) return '';
    return ability.description.replace('X', ability.threshold);
}

// Get trait description from weapon or armor traits
function getTraitDescription(traitName) {
    if (!weaponTraits || !armorTraits) return null;
    
    // Try to find in weapon traits first
    const weaponTable = weaponTraits.content;
    const weaponMatch = weaponTable.match(new RegExp(`<tr><td[^>]*>${traitName}</td><td[^>]*>(.*?)</td></tr>`));
    if (weaponMatch) {
        return weaponMatch[1];
    }
    
    // Try armor traits if not found in weapon traits
    const armorTable = armorTraits.content;
    const armorMatch = armorTable.match(new RegExp(`<tr><td[^>]*>${traitName}</td><td[^>]*>(.*?)</td></tr>`));
    if (armorMatch) {
        return armorMatch[1];
    }
    
    return null;
}

// Setup both tooltips and content blocks
function setupAbilities() {
    // Clear existing tooltips
    tooltipElements.forEach(tooltip => tooltip.remove());
    tooltipElements.clear();
    
    // Handle tooltips for abilities and traits
    document.querySelectorAll('.tooltip[data-ability]').forEach(element => {
        const abilityName = element.getAttribute('data-ability');
        const ability = abilities[abilityName];
        
        // Prevent default link behavior for anchor tags
        if (element.tagName === 'A') {
            element.addEventListener('click', (e) => {
                e.preventDefault();
            });
        }
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.style.display = 'none';
        
        if (ability) {
            // Handle ability tooltip
            const description = formatAbilityDescription(ability);
            tooltip.innerHTML = `<strong>${abilityName}</strong><br>${description.replace(/\n/g, '<br>')}`;
        } else {
            // Handle trait tooltip
            const traitDescription = getTraitDescription(abilityName);
            if (traitDescription) {
                tooltip.innerHTML = `<strong>${abilityName}:</strong><br>${traitDescription.replace(/<br>/g, '<br>')}`;
            } else {
                return; // Skip if no description found
            }
        }
        
        document.body.appendChild(tooltip);
        tooltipElements.set(element, tooltip);

        // Add mouseenter event listener
        element.addEventListener('mouseenter', () => {
            if (activeTooltipElement && activeTooltipElement !== element) {
                hideAllTooltips();
            }
            showTooltip(element, tooltip);
            activeTooltipElement = element;
        });

        // Add mouseleave event listener
        element.addEventListener('mouseleave', (event) => {
            // Check if we're moving to another tooltip element
            const relatedTarget = event.relatedTarget;
            if (!relatedTarget || !relatedTarget.classList.contains('tooltip')) {
                hideTooltip();
                activeTooltipElement = null;
            }
        });
    });

    // Handle content blocks
    document.querySelectorAll('div[data-ability]').forEach(element => {
        const abilityName = element.getAttribute('data-ability');
        const ability = abilities[abilityName];
        if (ability) {
            element.innerHTML = formatAbilityDescription(ability).replace(/\n/g, '<br>');
        }
    });
}

// Function to create tooltips for traits
function createTraitTooltips() {
    if (!weaponTraits || !armorTraits) return;

    // Get all tables
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
        // Find the trait column index
        const headers = table.querySelectorAll('th');
        let traitColumnIndex = -1;
        headers.forEach((header, index) => {
            if (header.textContent.trim() === 'Traits' || header.textContent.trim() === 'Special Rules') {
                traitColumnIndex = index;
            }
        });

        if (traitColumnIndex !== -1) {
            // Get all rows except header
            const rows = table.querySelectorAll('tr:not(:first-child)');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells[traitColumnIndex]) {
                    const traitCell = cells[traitColumnIndex];
                    const traitText = traitCell.textContent.trim();
                    
                    // Skip if the cell is empty or contains only a dash
                    if (traitText && traitText !== '—') {
                        const traitNames = traitText.split(',').map(t => t.trim());
                        
                        if (traitNames.length > 0) {
                            // Create tooltip element
                            const tooltip = document.createElement('div');
                            tooltip.className = 'custom-tooltip';
                            tooltip.style.display = 'none';
                            
                            // Build tooltip content from all traits
                            let tooltipContent = '';
                            traitNames.forEach((traitName, index) => {
                                if (traitName) {
                                    const description = getTraitDescription(traitName);
                                    if (description) {
                                        if (index > 0) tooltipContent += '<br><br>';
                                        tooltipContent += `<strong>${traitName}:</strong><br>${description.replace(/<br>/g, '<br>')}`;
                                    }
                                }
                            });
                            
                            if (tooltipContent) {
                                tooltip.innerHTML = tooltipContent;
                                document.body.appendChild(tooltip);
                                tooltipElements.set(traitCell, tooltip);
                                
                                // Add tooltip behavior to the cell
                                traitCell.classList.add('tooltip');
                                
                                // Create a wrapper for the trait name
                                const traitWrapper = document.createElement('span');
                                traitWrapper.className = 'tooltip';
                                traitWrapper.textContent = traitText;
                                traitCell.innerHTML = '';
                                traitCell.appendChild(traitWrapper);
                                
                                // Add tooltip behavior to both the cell and the wrapper
                                [traitCell, traitWrapper].forEach(element => {
                                    element.addEventListener('mouseenter', () => {
                                        showTooltip(element, tooltip);
                                    });
                                    
                                    element.addEventListener('mouseleave', (e) => {
                                        // Check if we're moving to the other tooltip element
                                        const relatedTarget = e.relatedTarget;
                                        if (relatedTarget !== traitCell && relatedTarget !== traitWrapper) {
                                            hideTooltip();
                                        }
                                    });
                                });
                            }
                        }
                    }
                }
            });
        }
    });
}

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
    if (isInitialized) return;
    
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

        // Load abilities and traits in parallel
        await Promise.all([
            loadAbilities(),
            loadTraitData()
        ]);
        
        // Initialize tooltips
        setupAbilities();
        createTraitTooltips();

        // Render the new data
        renderDeploymentZoneTable(deploymentZones);
        renderPlayerObjectives(playerObjectives);
        renderObjectivePlacementTable(objectivePlacements);
        
        isInitialized = true;
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

// Function to load mission content
async function loadMissionContent(missionPath) {
    try {
        const response = await fetch(`/data/missions/${missionPath}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load mission: ${response.statusText}`);
        }
        const missionData = await response.json();
        return missionData;
    } catch (error) {
        console.error('Error loading mission:', error);
        return null;
    }
}

// Function to render mission content
function renderMissionContent(element, missionData) {
    if (!missionData) {
        element.innerHTML = '<p>Error loading mission data</p>';
        return;
    }

    const content = `
        <div class="mission-content">
            <h3>${missionData.name}</h3>
            <p><strong>Overview:</strong> ${missionData.overview}</p>
            <p><strong>Primary Objectives:</strong> ${missionData.primary_objectives}</p>
            <p><strong>Secondary Objectives:</strong> ${missionData.secondary_objectives}</p>
            ${missionData.special_rules ? `<p><strong>Special Rules:</strong> ${missionData.special_rules}</p>` : ''}
        </div>
    `;
    element.innerHTML = content;
}

// Setup mission content loading
function setupMissionContent() {
    document.querySelectorAll('.content-box[data-mission]').forEach(element => {
        const missionPath = element.getAttribute('data-mission');
        if (missionPath) {
            loadMissionContent(missionPath).then(missionData => {
                renderMissionContent(element, missionData);
            });
        }
    });
}

// Mission Generator functionality
function initMissionGenerator() {
    const deploymentType = document.getElementById('deploymentType');
    const player1Zone = document.getElementById('player1Zone');
    const player2Zone = document.getElementById('player2Zone');
    const objectiveSetup = document.getElementById('objectiveSetup');
    const missionRule = document.getElementById('missionRule');
    const missionContent = document.getElementById('missionContent');
    const narrativeLayer = document.getElementById('narrativeLayer');
    const narrativeContent = document.getElementById('narrativeContent');

    // Check if all required elements exist
    if (!deploymentType || !player1Zone || !player2Zone || !objectiveSetup || !missionRule || !missionContent || !narrativeLayer || !narrativeContent) {
        console.error('Required elements not found');
        return;
    }

    // Handle narrative layer changes
    narrativeLayer.addEventListener('change', async function() {
        if (!narrativeContent) return;
        
        // Clear existing content
        narrativeContent.innerHTML = '<div class="p-4 text-gray-500">Loading narrative content...</div>';
        
        if (this.value) {
            try {
                const response = await fetch(`/data/narrative/${this.value}.json`);
                if (!response.ok) {
                    throw new Error(`Failed to load narrative content: ${response.statusText}`);
                }
                const data = await response.json();
                if (data && data.content) {
                    narrativeContent.innerHTML = data.content;
                } else {
                    throw new Error('Invalid narrative content format');
                }
            } catch (error) {
                console.error('Error loading narrative content:', error);
                narrativeContent.innerHTML = '<div class="p-4 text-red-500">Error loading narrative content. Please try again later.</div>';
            }
        } else {
            narrativeContent.innerHTML = '';
        }
    });

    // Handle deployment type changes
    deploymentType.addEventListener('change', function() {
        // Reset both dropdowns
        player1Zone.disabled = true;
        player2Zone.disabled = true;
        player1Zone.value = '';
        player2Zone.value = '';
        
        // Remove only deployment zone images, preserving objective images
        const container = document.querySelector('.w-full.max-w-xl');
        if (container) {
            const existingImages = container.querySelectorAll('img:not([src*="Mission_TableGrid.png"])');
            existingImages.forEach(img => {
                if (!img.src.includes('Mission_Objectives')) {
                    img.remove();
                }
            });
        }
        
        if (this.value === 'pitched') {
            player1Zone.disabled = false;
        } else if (this.value === 'asymmetrical') {
            player1Zone.disabled = false;
            player2Zone.disabled = false;
        }
    });

    // Handle zone selection changes
    player1Zone.addEventListener('change', updateDeploymentZoneImages);
    player2Zone.addEventListener('change', updateDeploymentZoneImages);

    // Handle objective setup changes
    objectiveSetup.addEventListener('change', function() {
        const container = document.querySelector('.w-full.max-w-xl');
        if (!container) return;

        // Remove any existing objective setup images
        const existingImages = container.querySelectorAll('img:not([src*="Mission_TableGrid.png"])');
        existingImages.forEach(img => {
            if (img.src.includes('Mission_Objectives')) {
                img.remove();
            }
        });
        
        if (this.value) {
            const setupNumber = this.value.replace('setup', '');
            const img = document.createElement('img');
            img.src = `/images/mission/Mission_Objectives${setupNumber.padStart(2, '0')}.png`;
            img.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 2;';
            container.appendChild(img);
        }
    });

    // Handle mission rule changes
    missionRule.addEventListener('change', async function() {
        if (!missionContent) return;

        if (this.value) {
            try {
                const response = await fetch(`/data/missions/${this.value}.json`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (data && data.content) {
                    missionContent.innerHTML = data.content;
                } else if (data && data.overview) {
                    // If the data has the overview structure, format it properly
                    const content = `
                        <div class="mission-content">
                            <h3>${data.name || ''}</h3>
                            <p><strong>Overview:</strong> ${data.overview}</p>
                            <p><strong>Primary Objectives:</strong> ${data.primary_objectives}</p>
                            <p><strong>Secondary Objectives:</strong> ${data.secondary_objectives}</p>
                            ${data.special_rules ? `<p><strong>Special Rules:</strong> ${data.special_rules}</p>` : ''}
                        </div>
                    `;
                    missionContent.innerHTML = content;
                } else {
                    throw new Error('Invalid mission data format');
                }
            } catch (error) {
                console.error('Error loading mission content:', error);
                missionContent.innerHTML = '<p class="text-red-500">Error loading mission content</p>';
            }
        } else {
            missionContent.innerHTML = '';
        }
    });
}

function updateDeploymentZoneImages() {
    const container = document.querySelector('.w-full.max-w-xl');
    if (!container) return;

    const tableGrid = container.querySelector('img[src*="Mission_TableGrid.png"]');
    if (!tableGrid) return;
    
    // Remove any existing deployment zone images
    const existingImages = container.querySelectorAll('img:not([src*="Mission_TableGrid.png"])');
    existingImages.forEach(img => {
        if (!img.src.includes('Mission_Objectives')) {
            img.remove();
        }
    });
    
    const player1Zone = document.getElementById('player1Zone');
    const player2Zone = document.getElementById('player2Zone');
    const deploymentType = document.getElementById('deploymentType')?.value;
    
    if (!deploymentType || !player1Zone || !player2Zone) return;
    
    if (deploymentType === 'pitched' && player1Zone.value) {
        const zoneNumber = player1Zone.value.replace('zone', '');
        // Add player 1's deployment zone
        const img1 = document.createElement('img');
        img1.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p01.png`;
        img1.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
        container.appendChild(img1);
        
        // Add player 2's deployment zone (same zone number but p02)
        const img2 = document.createElement('img');
        img2.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p02.png`;
        img2.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
        container.appendChild(img2);
    } else if (deploymentType === 'asymmetrical') {
        if (player1Zone.value) {
            const zoneNumber = player1Zone.value.replace('zone', '');
            const img1 = document.createElement('img');
            img1.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p01.png`;
            img1.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
            container.appendChild(img1);
        }
        if (player2Zone.value) {
            const zoneNumber = player2Zone.value.replace('zone', '');
            const img2 = document.createElement('img');
            img2.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p02.png`;
            img2.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
            container.appendChild(img2);
        }
    }
}

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM Content Loaded - Starting initialization');
        await loadAllContent();
        setupMissionContent();
        initMissionGenerator();
        console.log('Initialization complete');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Also call createTraitTooltips when sections are expanded
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('section-button')) {
        // Add a small delay to ensure content is expanded
        setTimeout(() => {
            setupAbilities();
            createTraitTooltips();
        }, 100);
    }
});

// Collapsible button functionality
document.addEventListener('DOMContentLoaded', function() {
    var coll = document.getElementsByClassName("collapsible");
    for (var i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
});

document.getElementById('deploymentType').addEventListener('change', function() {
    const player1Zone = document.getElementById('player1Zone');
    const player2Zone = document.getElementById('player2Zone');
    
    // Reset both dropdowns
    player1Zone.disabled = true;
    player2Zone.disabled = true;
    player1Zone.value = '';
    player2Zone.value = '';
    
    // Remove only deployment zone images, preserving objective images
    const container = document.querySelector('.w-full.max-w-xl');
    if (container) {
        const existingImages = container.querySelectorAll('img:not([src*="Mission_TableGrid.png"])');
        existingImages.forEach(img => {
            if (!img.src.includes('Mission_Objectives')) {
                img.remove();
            }
        });
    }
    
    if (this.value === 'pitched') {
        player1Zone.disabled = false;
    } else if (this.value === 'asymmetrical') {
        player1Zone.disabled = false;
        player2Zone.disabled = false;
    }
});

// Add event listeners for zone selection
document.getElementById('player1Zone').addEventListener('change', function() {
    updateDeploymentZoneImages();
});

document.getElementById('player2Zone').addEventListener('change', function() {
    updateDeploymentZoneImages();
});

function updateDeploymentZoneImages() {
    const container = document.querySelector('.w-full.max-w-xl');
    if (!container) return;

    const tableGrid = container.querySelector('img[src*="Mission_TableGrid.png"]');
    if (!tableGrid) return;
    
    // Remove any existing deployment zone images
    const existingImages = container.querySelectorAll('img:not([src*="Mission_TableGrid.png"])');
    existingImages.forEach(img => {
        if (!img.src.includes('Mission_Objectives')) {
            img.remove();
        }
    });
    
    const player1Zone = document.getElementById('player1Zone');
    const player2Zone = document.getElementById('player2Zone');
    const deploymentType = document.getElementById('deploymentType')?.value;
    
    if (!deploymentType || !player1Zone || !player2Zone) return;
    
    if (deploymentType === 'pitched' && player1Zone.value) {
        const zoneNumber = player1Zone.value.replace('zone', '');
        // Add player 1's deployment zone
        const img1 = document.createElement('img');
        img1.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p01.png`;
        img1.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
        container.appendChild(img1);
        
        // Add player 2's deployment zone (same zone number but p02)
        const img2 = document.createElement('img');
        img2.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p02.png`;
        img2.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
        container.appendChild(img2);
    } else if (deploymentType === 'asymmetrical') {
        if (player1Zone.value) {
            const zoneNumber = player1Zone.value.replace('zone', '');
            const img1 = document.createElement('img');
            img1.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p01.png`;
            img1.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
            container.appendChild(img1);
        }
        if (player2Zone.value) {
            const zoneNumber = player2Zone.value.replace('zone', '');
            const img2 = document.createElement('img');
            img2.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p02.png`;
            img2.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
            container.appendChild(img2);
        }
    }
}

// Add event listener for objective setup
document.getElementById('objectiveSetup').addEventListener('change', function() {
    const container = document.querySelector('.w-full.max-w-xl');
    if (!container) return;

    // Remove any existing objective setup images
    const existingImages = container.querySelectorAll('img:not([src*="Mission_TableGrid.png"])');
    existingImages.forEach(img => {
        if (img.src.includes('Mission_Objectives')) {
            img.remove();
        }
    });
    
    if (this.value) {
        const setupNumber = this.value.replace('setup', '');
        const img = document.createElement('img');
        img.src = `/images/mission/Mission_Objectives${setupNumber.padStart(2, '0')}.png`;
        img.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 2;';
        container.appendChild(img);
    }
});

// Add event listener for mission rules
document.getElementById('missionRule').addEventListener('change', function() {
    const missionContent = document.getElementById('missionContent');
    if (this.value) {
        fetch(`/data/missions/${this.value}.json`)
            .then(response => response.json())
            .then(data => {
                missionContent.innerHTML = data.content;
            })
            .catch(error => {
                console.error('Error loading mission content:', error);
                missionContent.innerHTML = '<p class="text-red-500">Error loading mission content</p>';
            });
    } else {
        missionContent.innerHTML = '';
    }
}); 