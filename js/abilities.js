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

// Function to get random option from select element
function getRandomOption(select) {
    const options = Array.from(select.options).filter(option => option.value !== '');
    if (options.length === 0) return null;
    return options[Math.floor(Math.random() * options.length)];
}

// Function to randomize mission options
function randomizeMission() {
    const narrativeLayer = document.getElementById('narrativeLayer');
    const objectiveSetup = document.getElementById('objectiveSetup');
    const missionRule = document.getElementById('missionRule');
    const deploymentType = document.getElementById('deploymentType');
    const player1Zone = document.getElementById('player1Zone');
    const player2Zone = document.getElementById('player2Zone');

    // Randomize narrative layer if not locked
    if (!document.getElementById('narrativeLayer_lock').checked) {
        const randomNarrative = getRandomOption(narrativeLayer);
        if (randomNarrative) {
            narrativeLayer.value = randomNarrative.value;
            narrativeLayer.dispatchEvent(new Event('change'));
        }
    }

    // Randomize objective setup if not locked
    if (!document.getElementById('objectiveSetup_lock').checked) {
        const randomSetup = getRandomOption(objectiveSetup);
        if (randomSetup) {
            objectiveSetup.value = randomSetup.value;
            objectiveSetup.dispatchEvent(new Event('change'));
        }
    }

    // Randomize mission rule if not locked
    if (!document.getElementById('missionRule_lock').checked) {
        const randomMission = getRandomOption(missionRule);
        if (randomMission) {
            missionRule.value = randomMission.value;
            missionRule.dispatchEvent(new Event('change'));
        }
    }

    // Randomize deployment type if not locked
    if (!document.getElementById('deploymentType_lock').checked) {
        const randomDeployment = getRandomOption(deploymentType);
        if (randomDeployment) {
            deploymentType.value = randomDeployment.value;
            deploymentType.dispatchEvent(new Event('change'));

            // Randomize deployment zones based on deployment type if not locked
            if (randomDeployment.value === 'pitched' && !document.getElementById('player1Zone_lock').checked) {
                const randomZone = getRandomOption(player1Zone);
                if (randomZone) {
                    player1Zone.value = randomZone.value;
                    player1Zone.dispatchEvent(new Event('change'));
                }
            } else if (randomDeployment.value === 'asymmetrical') {
                if (!document.getElementById('player1Zone_lock').checked) {
                    const randomZone1 = getRandomOption(player1Zone);
                    if (randomZone1) {
                        player1Zone.value = randomZone1.value;
                        player1Zone.dispatchEvent(new Event('change'));
                    }
                }
                if (!document.getElementById('player2Zone_lock').checked) {
                    const randomZone2 = getRandomOption(player2Zone);
                    if (randomZone2) {
                        player2Zone.value = randomZone2.value;
                        player2Zone.dispatchEvent(new Event('change'));
                    }
                }
            }
        }
    }
}

// Update the initMissionGenerator function
function initMissionGenerator() {
    console.log('Starting initMissionGenerator');
    
    // Wait for the mission generator content to be loaded
    const checkForElements = setInterval(() => {
        const deploymentType = document.getElementById('deploymentType');
        const player1Zone = document.getElementById('player1Zone');
        const player2Zone = document.getElementById('player2Zone');
        const objectiveSetup = document.getElementById('objectiveSetup');
        const missionRule = document.getElementById('missionRule');
        const missionContent = document.getElementById('missionContent');
        const narrativeLayer = document.getElementById('narrativeLayer');
        const narrativeContent = document.getElementById('narrativeContent');

        if (deploymentType && player1Zone && player2Zone && objectiveSetup && missionRule && missionContent && narrativeLayer && narrativeContent) {
            clearInterval(checkForElements);
            console.log('All required elements found');

            // Add mission name input
            const nameContainer = document.createElement('div');
            nameContainer.className = 'mb-4';
            nameContainer.innerHTML = `
                <label for="missionName" class="block text-sm font-medium text-gray-700 mb-1">Mission Name</label>
                <input type="text" id="missionName" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Enter mission name">
            `;

            // Add checkboxes to each dropdown
            const dropdowns = [
                { id: 'narrativeLayer', label: 'Narrative Layer' },
                { id: 'objectiveSetup', label: 'Objective Setup' },
                { id: 'missionRule', label: 'Mission Rule' },
                { id: 'deploymentType', label: 'Deployment Type' },
                { id: 'player1Zone', label: 'Player 1 Zone' },
                { id: 'player2Zone', label: 'Player 2 Zone' }
            ];

            dropdowns.forEach(dropdown => {
                const select = document.getElementById(dropdown.id);
                if (!select || !select.parentNode) {
                    console.warn(`Select element ${dropdown.id} not found or has no parent`);
                    return;
                }

                try {
                    // Create wrapper
                    const wrapper = document.createElement('div');
                    wrapper.className = 'flex items-center gap-2 mb-2';
                    
                    // Create checkbox
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `${dropdown.id}_lock`;
                    checkbox.className = 'w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded';
                    
                    // Create label with lock icon
                    const label = document.createElement('label');
                    label.htmlFor = `${dropdown.id}_lock`;
                    label.className = 'text-sm text-gray-600 cursor-pointer';
                    label.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>';
                    
                    // Create a new select element with the same properties
                    const newSelect = document.createElement('select');
                    newSelect.id = select.id;
                    newSelect.className = select.className;
                    newSelect.name = select.name;
                    
                    // Copy all options
                    Array.from(select.options).forEach(option => {
                        newSelect.appendChild(option.cloneNode(true));
                    });
                    
                    // Copy any other attributes
                    Array.from(select.attributes).forEach(attr => {
                        if (attr.name !== 'id' && attr.name !== 'class' && attr.name !== 'name') {
                            newSelect.setAttribute(attr.name, attr.value);
                        }
                    });
                    
                    // Add elements to wrapper
                    wrapper.appendChild(checkbox);
                    wrapper.appendChild(label);
                    wrapper.appendChild(newSelect);
                    
                    // Replace the old select with the new wrapper
                    select.parentNode.replaceChild(wrapper, select);
                } catch (error) {
                    console.error(`Error replacing select element ${dropdown.id}:`, error);
                }
            });

            // Create button container
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex justify-center gap-4 my-4';
            buttonContainer.style.position = 'relative';
            buttonContainer.style.zIndex = '10';

            // Create randomize button
            const randomizeButton = document.createElement('button');
            randomizeButton.className = 'px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2';
            randomizeButton.textContent = 'Randomize Mission';
            randomizeButton.addEventListener('click', randomizeMission);

            // Create download button
            const downloadButton = document.createElement('button');
            downloadButton.className = 'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2';
            downloadButton.textContent = 'Download Mission';
            downloadButton.addEventListener('click', downloadMission);

            // Add buttons to container
            buttonContainer.appendChild(randomizeButton);
            buttonContainer.appendChild(downloadButton);

            // Find the main container that holds both dropdowns and content
            const mainContainer = document.querySelector('.flex.flex-col.gap-4');
            if (mainContainer) {
                // Find the content section (the div with mt-4 class)
                const contentSection = mainContainer.querySelector('.mt-4');
                if (contentSection) {
                    // Insert the name input and buttons before the content section
                    mainContainer.insertBefore(nameContainer, contentSection);
                    mainContainer.insertBefore(buttonContainer, contentSection);
                    console.log('Name input and buttons inserted before content section');
                } else {
                    console.error('Content section not found');
                }
            } else {
                console.error('Main container not found');
            }

            // Setup event listeners after all elements are in place
            const newDeploymentType = document.getElementById('deploymentType');
            const newPlayer1Zone = document.getElementById('player1Zone');
            const newPlayer2Zone = document.getElementById('player2Zone');
            const newObjectiveSetup = document.getElementById('objectiveSetup');
            const newMissionRule = document.getElementById('missionRule');
            const newMissionContent = document.getElementById('missionContent');
            const newNarrativeLayer = document.getElementById('narrativeLayer');
            const newNarrativeContent = document.getElementById('narrativeContent');

            // Load narrative layers first
            loadNarrativeLayers();
            
            // Load narrative layer content
            loadNarrativeLayerContent();

            // Add event listeners only if elements exist
            if (newDeploymentType) {
                newDeploymentType.addEventListener('change', function() {
                    // Reset both dropdowns
                    if (newPlayer1Zone) newPlayer1Zone.disabled = true;
                    if (newPlayer2Zone) newPlayer2Zone.disabled = true;
                    if (newPlayer1Zone) newPlayer1Zone.value = '';
                    if (newPlayer2Zone) newPlayer2Zone.value = '';
                    
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
                        if (newPlayer1Zone) newPlayer1Zone.disabled = false;
                    } else if (this.value === 'asymmetrical') {
                        if (newPlayer1Zone) newPlayer1Zone.disabled = false;
                        if (newPlayer2Zone) newPlayer2Zone.disabled = false;
                    }
                });
            }

            if (newPlayer1Zone) {
                newPlayer1Zone.addEventListener('change', updateDeploymentZoneImages);
            }
            if (newPlayer2Zone) {
                newPlayer2Zone.addEventListener('change', updateDeploymentZoneImages);
            }

            if (newObjectiveSetup) {
                newObjectiveSetup.addEventListener('change', function() {
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
            }

            if (newMissionRule && newMissionContent) {
                newMissionRule.addEventListener('change', async function() {
                    if (!newMissionContent) return;

                    if (this.value) {
                        try {
                            const response = await fetch(`/data/missions/${this.value}.json`);
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            const data = await response.json();
                            if (data && data.content) {
                                newMissionContent.innerHTML = data.content;
                            } else if (data && data.overview) {
                                const content = `
                                    <div class="mission-content">
                                        <h3>${data.name || ''}</h3>
                                        <p><strong>Overview:</strong> ${data.overview}</p>
                                        <p><strong>Primary Objectives:</strong> ${data.primary_objectives}</p>
                                        <p><strong>Secondary Objectives:</strong> ${data.secondary_objectives}</p>
                                        ${data.special_rules ? `<p><strong>Special Rules:</strong> ${data.special_rules}</p>` : ''}
                                    </div>
                                `;
                                newMissionContent.innerHTML = content;
                            }
                        } catch (error) {
                            console.error('Error loading mission content:', error);
                            newMissionContent.innerHTML = '<div class="p-4 text-red-500">Error loading mission content. Please try again later.</div>';
                        }
                    } else {
                        newMissionContent.innerHTML = '';
                    }
                });
            }

            if (newNarrativeLayer && newNarrativeContent) {
                newNarrativeLayer.addEventListener('change', async function() {
                    if (!newNarrativeContent) return;
                    
                    // Clear existing content
                    newNarrativeContent.innerHTML = '<div class="p-4 text-gray-500">Loading narrative content...</div>';
                    
                    if (this.value) {
                        try {
                            const response = await fetch(`/data/narrative/${this.value}.json`);
                            if (!response.ok) {
                                throw new Error(`Failed to load narrative content: ${response.statusText}`);
                            }
                            const data = await response.json();
                            if (data && data.content) {
                                newNarrativeContent.innerHTML = data.content;
                            } else {
                                throw new Error('Invalid narrative content format');
                            }
                        } catch (error) {
                            console.error('Error loading narrative content:', error);
                            newNarrativeContent.innerHTML = '<div class="p-4 text-red-500">Error loading narrative content. Please try again later.</div>';
                        }
                    } else {
                        newNarrativeContent.innerHTML = '';
                    }
                });
            }
        }
    }, 100); // Check every 100ms

    // Clear the interval after 10 seconds to prevent infinite checking
    setTimeout(() => {
        clearInterval(checkForElements);
    }, 10000);
}

// Update the image handling in updateDeploymentZoneImages
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
        img1.onload = () => console.log('Deployment zone image loaded:', img1.src);
        img1.onerror = (e) => console.error('Error loading deployment zone image:', img1.src, e);
        container.appendChild(img1);
        
        // Add player 2's deployment zone (same zone number but p02)
        const img2 = document.createElement('img');
        img2.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p02.png`;
        img2.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
        img2.onload = () => console.log('Deployment zone image loaded:', img2.src);
        img2.onerror = (e) => console.error('Error loading deployment zone image:', img2.src, e);
        container.appendChild(img2);
    } else if (deploymentType === 'asymmetrical') {
        if (player1Zone.value) {
            const zoneNumber = player1Zone.value.replace('zone', '');
            const img1 = document.createElement('img');
            img1.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p01.png`;
            img1.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
            img1.onload = () => console.log('Deployment zone image loaded:', img1.src);
            img1.onerror = (e) => console.error('Error loading deployment zone image:', img1.src, e);
            container.appendChild(img1);
        }
        if (player2Zone.value) {
            const zoneNumber = player2Zone.value.replace('zone', '');
            const img2 = document.createElement('img');
            img2.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p02.png`;
            img2.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
            img2.onload = () => console.log('Deployment zone image loaded:', img2.src);
            img2.onerror = (e) => console.error('Error loading deployment zone image:', img2.src, e);
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
        img1.onload = () => console.log('Deployment zone image loaded:', img1.src);
        img1.onerror = (e) => console.error('Error loading deployment zone image:', img1.src, e);
        container.appendChild(img1);
        
        // Add player 2's deployment zone (same zone number but p02)
        const img2 = document.createElement('img');
        img2.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p02.png`;
        img2.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
        img2.onload = () => console.log('Deployment zone image loaded:', img2.src);
        img2.onerror = (e) => console.error('Error loading deployment zone image:', img2.src, e);
        container.appendChild(img2);
    } else if (deploymentType === 'asymmetrical') {
        if (player1Zone.value) {
            const zoneNumber = player1Zone.value.replace('zone', '');
            const img1 = document.createElement('img');
            img1.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p01.png`;
            img1.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
            img1.onload = () => console.log('Deployment zone image loaded:', img1.src);
            img1.onerror = (e) => console.error('Error loading deployment zone image:', img1.src, e);
            container.appendChild(img1);
        }
        if (player2Zone.value) {
            const zoneNumber = player2Zone.value.replace('zone', '');
            const img2 = document.createElement('img');
            img2.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p02.png`;
            img2.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
            img2.onload = () => console.log('Deployment zone image loaded:', img2.src);
            img2.onerror = (e) => console.error('Error loading deployment zone image:', img2.src, e);
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

// Function to download mission as image
async function downloadMission() {
    const downloadButton = this;
    try {
        // Show loading state
        const originalText = downloadButton.textContent;
        downloadButton.textContent = 'Generating Image...';
        downloadButton.disabled = true;

        // Get the mission name
        const missionName = document.getElementById('missionName').value || 'Unnamed Mission';

        // Get the mission content container
        const missionContainer = document.querySelector('.mt-4');
        if (!missionContainer) {
            throw new Error('Mission content container not found');
        }

        // Create a temporary container for the image
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '-9999px';
        tempContainer.style.width = '800px';
        tempContainer.style.backgroundColor = 'white';
        tempContainer.style.padding = '20px';
        document.body.appendChild(tempContainer);

        // Add mission name to the top
        const nameHeader = document.createElement('h2');
        nameHeader.textContent = missionName;
        nameHeader.style.fontSize = '24px';
        nameHeader.style.fontWeight = 'bold';
        nameHeader.style.marginBottom = '20px';
        nameHeader.style.textAlign = 'center';
        tempContainer.appendChild(nameHeader);

        // Clone the mission content
        const contentClone = missionContainer.cloneNode(true);
        tempContainer.appendChild(contentClone);

        // Wait for all images to load
        const images = tempContainer.getElementsByTagName('img');
        for (const img of images) {
            if (!img.complete) {
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    // Set a timeout of 5 seconds
                    setTimeout(() => reject(new Error('Image load timeout')), 5000);
                });
            }
        }

        // Use html2canvas to capture the content
        const canvas = await html2canvas(tempContainer, {
            scale: 2,
            backgroundColor: 'white',
            logging: true,
            useCORS: true,
            allowTaint: true
        });

        // Convert canvas to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));

        // Create download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `mission_${new Date().toISOString().slice(0,10)}_${missionName.replace(/\s+/g, '_').toLowerCase()}.jpg`;
        link.click();

        // Cleanup
        URL.revokeObjectURL(link.href);
        tempContainer.remove();

        // Reset button state
        downloadButton.textContent = originalText;
        downloadButton.disabled = false;
    } catch (error) {
        console.error('Error generating mission image:', error);
        
        // Reset button state
        downloadButton.textContent = 'Download Mission';
        downloadButton.disabled = false;

        // Show more specific error message
        if (error.message.includes('timeout')) {
            alert('Failed to generate image: Some images took too long to load. Please try again.');
        } else {
            alert('Failed to generate image: ' + error.message);
        }
    }
} 