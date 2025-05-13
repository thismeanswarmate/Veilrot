// Function to load primary objective content
async function loadPrimaryObjectiveContent(objectiveId) {
    try {
        const response = await fetch('/data/objectives/primary_objectives.json');
        if (!response.ok) {
            throw new Error(`Failed to load primary objectives: ${response.statusText}`);
        }
        const data = await response.json();
        const selectedObjective = data.primary_objectives.find(obj => obj.id === objectiveId);
        return selectedObjective || null;
    } catch (error) {
        console.error('Error loading primary objective:', error);
        return null;
    }
}

// Function to load secondary objective content
async function loadSecondaryObjectiveContent(objectiveId) {
    try {
        const response = await fetch('/data/objectives/secondary_objectives.json');
        if (!response.ok) {
            throw new Error(`Failed to load secondary objectives: ${response.statusText}`);
        }
        const data = await response.json();
        const selectedObjective = data.secondary_objectives.find(obj => obj.id === objectiveId);
        return selectedObjective || null;
    } catch (error) {
        console.error('Error loading secondary objective:', error);
        return null;
    }
}

// Function to render primary objective content
function renderPrimaryObjectiveContent(element, primaryData, secondaryData) {
    if (!primaryData && !secondaryData) {
        element.innerHTML = '<p>Error loading objective data</p>';
        return;
    }

    // Combine special rules from both objectives, removing duplicates
    const allSpecialRules = [];
    if (primaryData && primaryData.special_rules) {
        primaryData.special_rules.forEach(rule => {
            allSpecialRules.push({
                ...rule,
                objectiveName: primaryData.name
            });
        });
    }
    if (secondaryData && secondaryData.special_rules) {
        secondaryData.special_rules.forEach(rule => {
            // Only add if not already present
            if (!allSpecialRules.some(existingRule => 
                existingRule.name === rule.name && 
                existingRule.description === rule.description
            )) {
                allSpecialRules.push({
                    ...rule,
                    objectiveName: secondaryData.name
                });
            }
        });
    }

    // Helper function to clean and split description
    const cleanAndSplitDescription = (description) => {
        return description
            .replace(/<br><br>/g, '<br>') // Replace double line breaks with single
            .split('<br>')
            .map(line => `<li class="mission-special-rule">${line}</li>`)
            .join('');
    };

    const content = `
        <div class="mission-content">
            ${primaryData ? `
                <div class="flex items-center gap-2 mb-2">
                    <img src="/images/mission/Mission_PrimaryObjective.png" alt="Primary Objective" style="width: 24px; height: 24px;">
                    <p class="m-0"><strong>Primary Objective:</strong></p>
                </div>
                <ul class="mission-special-rules">
                    ${cleanAndSplitDescription(primaryData.description)}
                </ul>
            ` : ''}
            ${secondaryData ? `
                <div class="flex items-center gap-2 mb-2">
                    <img src="/images/mission/Mission_SecondaryObjective.png" alt="Secondary Objective" style="width: 24px; height: 24px;">
                    <p class="m-0"><strong>Secondary Objective:</strong></p>
                </div>
                <ul class="mission-special-rules">
                    ${cleanAndSplitDescription(secondaryData.description)}
                </ul>
            ` : ''}
            ${allSpecialRules.length > 0 ? `
                <p><strong>Special Rules:</strong></p>
                ${allSpecialRules.map(rule => `
                    <p class="mission-rule-name"><strong>${rule.objectiveName}</strong></p>
                    <ul class="mission-special-rules">
                        ${cleanAndSplitDescription(rule.description)}
                    </ul>
                `).join('')}
            ` : ''}
        </div>
    `;
    element.innerHTML = content;

    // Add CSS styles for the bullet points
    const style = document.createElement('style');
    style.textContent = `
        .mission-content ul {
            list-style-type: disc !important;
            list-style-position: inside !important;
        }
        .mission-content li {
            line-height: 1 !important;
        }
        .mission-content .mission-rule-name {
            margin-top: 1em !important;
            margin-bottom: 0.5em !important;
            margin-left: 1em !important;
        }
    `;
    document.head.appendChild(style);
}

// Function to get random option from select element
function getRandomOption(select) {
    const options = Array.from(select.options).filter(option => option.value !== '');
    if (options.length === 0) return null;
    return options[Math.floor(Math.random() * options.length)];
}

// Function to randomize mission options
async function randomizeMission() {
    const narrativeLayer = document.getElementById('narrativeLayer');
    const objectiveSetup = document.getElementById('objectiveSetup');
    const primaryObjective = document.getElementById('missionRule');
    const secondaryObjective = document.getElementById('secondaryObjective');
    const deploymentType = document.getElementById('deploymentType');
    const player1Zone = document.getElementById('player1Zone');
    const player2Zone = document.getElementById('player2Zone');
    const missionName = document.getElementById('missionName');

    // Generate a random mission name if not locked
    if (!document.getElementById('missionName_lock').checked) {
        try {
            const generatedName = missionNameGenerator.generateMissionName();
            if (missionName) {
                missionName.value = generatedName;
            }
        } catch (error) {
            console.error('Error generating mission name:', error);
        }
    }

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

    // Randomize primary objective if not locked
    if (!document.getElementById('missionRule_lock').checked) {
        const randomObjective = getRandomOption(primaryObjective);
        if (randomObjective) {
            primaryObjective.value = randomObjective.value;
            primaryObjective.dispatchEvent(new Event('change'));
        }
    }

    // Randomize secondary objective if not locked
    if (!document.getElementById('secondaryObjective_lock').checked) {
        const randomSecondary = getRandomOption(secondaryObjective);
        if (randomSecondary) {
            secondaryObjective.value = randomSecondary.value;
            secondaryObjective.dispatchEvent(new Event('change'));
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

        // Add narrative layer content if it exists
        const narrativeContent = document.getElementById('narrativeContent');
        if (narrativeContent) {
            const narrativeClone = narrativeContent.cloneNode(true);
            narrativeClone.style.marginBottom = '20px';
            tempContainer.appendChild(narrativeClone);
        }

        // Add battlefield image if it exists
        const battlefieldContainer = document.querySelector('.w-full.max-w-xl');
        if (battlefieldContainer) {
            const battlefieldClone = battlefieldContainer.cloneNode(true);
            battlefieldClone.style.width = '100%';
            battlefieldClone.style.height = 'auto';
            battlefieldClone.style.marginBottom = '20px';
            tempContainer.appendChild(battlefieldClone);
        }

        // Clone the primary objective content
        const missionContent = document.getElementById('missionContent');
        if (missionContent) {
            const contentClone = missionContent.cloneNode(true);
            tempContainer.appendChild(contentClone);
        }

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
        link.download = `${missionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
        link.click();

        // Cleanup
        URL.revokeObjectURL(link.href);
        tempContainer.remove();

        // Reset button state
        downloadButton.textContent = originalText;
        downloadButton.disabled = false;
    } catch (error) {
        console.error('Error generating image:', error);
        
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

// Function to load primary objectives
async function loadPrimaryObjectives() {
    try {
        const response = await fetch('/data/objectives/primary_objectives.json');
        if (!response.ok) {
            throw new Error(`Failed to load primary objectives: ${response.statusText}`);
        }
        const data = await response.json();
        const missionRule = document.getElementById('missionRule');
        if (!missionRule) return;

        // Clear ALL existing options
        missionRule.innerHTML = '';

        // Add the default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.text = 'Select Primary Objective';
        missionRule.appendChild(defaultOption);

        // Add primary objectives as options
        if (data.primary_objectives && Array.isArray(data.primary_objectives)) {
            data.primary_objectives.forEach(objective => {
                const option = document.createElement('option');
                option.value = objective.id;
                option.text = objective.name;
                missionRule.appendChild(option);
            });
        }

        // Update the label
        const missionRuleLabel = document.querySelector('label[for="missionRule"]');
        if (missionRuleLabel) {
            missionRuleLabel.textContent = 'Select Primary Objective';
        }
    } catch (error) {
        console.error('Error loading primary objectives:', error);
    }
}

// Function to load secondary objectives
async function loadSecondaryObjectives() {
    console.log('Starting loadSecondaryObjectives()');
    try {
        const response = await fetch('/data/objectives/secondary_objectives.json');
        if (!response.ok) {
            throw new Error(`Failed to load secondary objectives: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Secondary objectives data loaded:', data);
        
        const secondaryObjective = document.getElementById('secondaryObjective');
        console.log('Secondary objective element found:', secondaryObjective);
        
        if (!secondaryObjective) {
            console.error('Secondary objective dropdown element not found in DOM');
            return;
        }

        // Clear ALL existing options
        secondaryObjective.innerHTML = '';
        console.log('Cleared existing options');

        // Add the default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.text = 'Select Secondary Objective';
        secondaryObjective.appendChild(defaultOption);
        console.log('Added default option');

        // Add secondary objectives as options
        if (data.secondary_objectives && Array.isArray(data.secondary_objectives)) {
            console.log('Adding secondary objectives to dropdown:', data.secondary_objectives.length);
            data.secondary_objectives.forEach(objective => {
                const option = document.createElement('option');
                option.value = objective.id;
                option.text = objective.name;
                secondaryObjective.appendChild(option);
            });
        }

        // Update the label
        const secondaryObjectiveLabel = document.querySelector('label[for="secondaryObjective"]');
        console.log('Secondary objective label found:', secondaryObjectiveLabel);
        if (secondaryObjectiveLabel) {
            secondaryObjectiveLabel.textContent = 'Select Secondary Objective';
        }
    } catch (error) {
        console.error('Error in loadSecondaryObjectives:', error);
    }
}

// Initialize mission generator
function initMissionGenerator() {
    console.log('Starting initMissionGenerator');
    
    // Wait for the mission generator content to be loaded
    const checkForElements = setInterval(() => {
        const deploymentType = document.getElementById('deploymentType');
        const player1Zone = document.getElementById('player1Zone');
        const player2Zone = document.getElementById('player2Zone');
        const objectiveSetup = document.getElementById('objectiveSetup');
        const primaryObjective = document.getElementById('missionRule');
        const missionContent = document.getElementById('missionContent');
        const narrativeLayer = document.getElementById('narrativeLayer');
        const narrativeContent = document.getElementById('narrativeContent');

        console.log('Checking for elements:', {
            deploymentType: !!deploymentType,
            player1Zone: !!player1Zone,
            player2Zone: !!player2Zone,
            objectiveSetup: !!objectiveSetup,
            primaryObjective: !!primaryObjective,
            missionContent: !!missionContent,
            narrativeLayer: !!narrativeLayer,
            narrativeContent: !!narrativeContent
        });

        if (deploymentType && player1Zone && player2Zone && objectiveSetup && primaryObjective && missionContent && narrativeLayer && narrativeContent) {
            clearInterval(checkForElements);
            console.log('All required elements found');

            // Create button container
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex justify-center gap-2 w-full mb-2';

            // Create randomize button
            const randomizeButton = document.createElement('button');
            randomizeButton.className = 'px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium';
            randomizeButton.textContent = 'Randomize';
            randomizeButton.addEventListener('click', randomizeMission);

            // Create download button
            const downloadButton = document.createElement('button');
            downloadButton.className = 'px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium';
            downloadButton.textContent = 'Download';
            downloadButton.addEventListener('click', downloadMission);

            // Add buttons to container
            buttonContainer.appendChild(randomizeButton);
            buttonContainer.appendChild(downloadButton);

            // Find the main container that holds both dropdowns and content
            const mainContainer = document.querySelector('.flex.flex-col.gap-4');
            if (mainContainer) {
                mainContainer.style.padding = '0';
                mainContainer.style.gap = '0';
                mainContainer.style.display = 'flex';
                mainContainer.style.flexDirection = 'column';

                // Create wrapper for all dropdowns
                const dropdownsWrapper = document.createElement('div');
                dropdownsWrapper.className = 'w-full flex flex-row gap-4';
                dropdownsWrapper.style.margin = '0';
                dropdownsWrapper.style.padding = '0';

                // Create wrapper for each column of dropdowns
                const leftColumn = document.createElement('div');
                leftColumn.className = 'w-1/2 flex flex-col gap-2';
                leftColumn.style.margin = '0';
                leftColumn.style.padding = '10px';

                const rightColumn = document.createElement('div');
                rightColumn.className = 'w-1/2 flex flex-col gap-2';
                rightColumn.style.margin = '0';
                rightColumn.style.padding = '10px';

                // Get all existing dropdowns and their wrappers
                const existingDropdowns = mainContainer.querySelectorAll('select');
                const existingWrappers = mainContainer.querySelectorAll('.flex.items-center.gap-1.mb-2');
                
                // Store the IDs and values of existing dropdowns
                const dropdownData = Array.from(existingDropdowns).map(dropdown => ({
                    id: dropdown.id,
                    value: dropdown.value,
                    options: Array.from(dropdown.options).map(opt => ({
                        value: opt.value,
                        text: opt.text,
                        selected: opt.selected
                    }))
                }));

                // Remove all existing dropdowns and their wrappers
                existingDropdowns.forEach(dropdown => dropdown.remove());
                existingWrappers.forEach(wrapper => wrapper.remove());

                // Create new dropdowns based on stored data
                dropdownData.forEach((data, index) => {
                    // Create new wrapper
                    const newWrapper = document.createElement('div');
                    newWrapper.className = 'flex items-center gap-1';
                    newWrapper.style.margin = '0';
                    newWrapper.style.padding = '0';

                    // Create checkbox
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `${data.id}_lock`;
                    checkbox.className = 'w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500';

                    // Create lock icon
                    const lockIcon = document.createElement('i');
                    lockIcon.className = 'fas fa-lock text-gray-400';
                    lockIcon.style.fontSize = '16px';
                    lockIcon.style.marginLeft = '4px';
                    lockIcon.style.marginRight = '4px';

                    // Create new select element
                    const newSelect = document.createElement('select');
                    newSelect.id = data.id;
                    newSelect.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500';

                    // Add options
                    data.options.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt.value;
                        option.text = opt.text;
                        option.selected = opt.selected;
                        newSelect.appendChild(option);
                    });

                    // Add elements to wrapper
                    newWrapper.appendChild(checkbox);
                    newWrapper.appendChild(lockIcon);
                    newWrapper.appendChild(newSelect);

                    // Add to appropriate column based on dropdown type
                    if (data.id === 'deploymentType' || data.id === 'player1Zone' || data.id === 'player2Zone') {
                        rightColumn.appendChild(newWrapper);
                    } else {
                        leftColumn.appendChild(newWrapper);
                    }
                });

                // Create secondary objective dropdown if it doesn't exist
                if (!document.getElementById('secondaryObjective')) {
                    const secondaryWrapper = document.createElement('div');
                    secondaryWrapper.className = 'flex items-center gap-1';
                    secondaryWrapper.style.margin = '0';
                    secondaryWrapper.style.padding = '0';

                    const secondaryCheckbox = document.createElement('input');
                    secondaryCheckbox.type = 'checkbox';
                    secondaryCheckbox.id = 'secondaryObjective_lock';
                    secondaryCheckbox.className = 'w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500';

                    const secondaryLockIcon = document.createElement('i');
                    secondaryLockIcon.className = 'fas fa-lock text-gray-400';
                    secondaryLockIcon.style.fontSize = '16px';
                    secondaryLockIcon.style.marginLeft = '4px';
                    secondaryLockIcon.style.marginRight = '4px';

                    const secondarySelect = document.createElement('select');
                    secondarySelect.id = 'secondaryObjective';
                    secondarySelect.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500';

                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.text = 'Select Secondary Objective';
                    secondarySelect.appendChild(defaultOption);

                    secondaryWrapper.appendChild(secondaryCheckbox);
                    secondaryWrapper.appendChild(secondaryLockIcon);
                    secondaryWrapper.appendChild(secondarySelect);

                    leftColumn.appendChild(secondaryWrapper);
                }

                // Add columns to dropdowns wrapper
                dropdownsWrapper.appendChild(leftColumn);
                dropdownsWrapper.appendChild(rightColumn);

                // Create name input wrapper
                const nameInputWrapper = document.createElement('div');
                nameInputWrapper.className = 'flex items-center gap-1';
                nameInputWrapper.style.margin = '0';
                nameInputWrapper.style.padding = '0';

                // Create checkbox for mission name
                const nameCheckbox = document.createElement('input');
                nameCheckbox.type = 'checkbox';
                nameCheckbox.id = 'missionName_lock';
                nameCheckbox.className = 'w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500';

                // Create lock icon for mission name
                const nameLockIcon = document.createElement('i');
                nameLockIcon.className = 'fas fa-lock text-gray-400';
                nameLockIcon.style.fontSize = '16px';
                nameLockIcon.style.marginLeft = '4px';
                nameLockIcon.style.marginRight = '4px';

                // Create name input
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.id = 'missionName';
                nameInput.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500';
                nameInput.placeholder = 'Enter mission name';

                // Add elements to name input wrapper
                nameInputWrapper.appendChild(nameCheckbox);
                nameInputWrapper.appendChild(nameLockIcon);
                nameInputWrapper.appendChild(nameInput);

                // Create wrapper for buttons and input
                const controlsWrapper = document.createElement('div');
                controlsWrapper.className = 'w-full flex flex-col gap-2';
                controlsWrapper.style.margin = '0';
                controlsWrapper.style.padding = '0';

                // Add buttons and input to controls wrapper
                controlsWrapper.appendChild(buttonContainer);
                controlsWrapper.appendChild(nameInputWrapper);

                // Find the content section (the div with mt-4 class)
                const contentSection = mainContainer.querySelector('.mt-4');
                if (contentSection) {
                    // Remove the title from the content box
                    const titleElement = contentSection.querySelector('h3');
                    if (titleElement) {
                        titleElement.remove();
                    }
                    
                    // Remove any other title elements
                    const allTitleElements = contentSection.querySelectorAll('h3, .mission-content h3');
                    allTitleElements.forEach(el => el.remove());

                    // Remove any existing margins and padding from the content section
                    contentSection.style.margin = '0';
                    contentSection.style.padding = '0';
                    contentSection.classList.remove('mt-4');

                    // Clear the main container and add elements in the correct order
                    mainContainer.innerHTML = '';
                    mainContainer.appendChild(dropdownsWrapper);
                    mainContainer.appendChild(controlsWrapper);
                    mainContainer.appendChild(contentSection);

                    // Setup event listeners after all elements are in place
                    const newDeploymentType = document.getElementById('deploymentType');
                    const newPlayer1Zone = document.getElementById('player1Zone');
                    const newPlayer2Zone = document.getElementById('player2Zone');
                    const newObjectiveSetup = document.getElementById('objectiveSetup');
                    const newPrimaryObjective = document.getElementById('missionRule');
                    const newSecondaryObjective = document.getElementById('secondaryObjective');
                    const newMissionContent = document.getElementById('missionContent');
                    const newNarrativeLayer = document.getElementById('narrativeLayer');
                    const newNarrativeContent = document.getElementById('narrativeContent');

                    // Load narrative layers first
                    loadNarrativeLayers();
                    
                    // Load narrative layer content
                    loadNarrativeLayerContent();

                    // Load primary objectives
                    loadPrimaryObjectives();

                    // Load secondary objectives
                    loadSecondaryObjectives();

                    // Add event listeners only if elements exist
                    if (newDeploymentType) {
                        newDeploymentType.addEventListener('change', function() {
                            // Enable/disable zone dropdowns based on deployment type
                            if (this.value === 'pitched') {
                                if (newPlayer1Zone) newPlayer1Zone.disabled = false;
                                if (newPlayer2Zone) newPlayer2Zone.disabled = true;
                            } else if (this.value === 'asymmetrical') {
                                if (newPlayer1Zone) newPlayer1Zone.disabled = false;
                                if (newPlayer2Zone) newPlayer2Zone.disabled = false;
                            }
                        });
                    }

                    if (newPlayer1Zone) {
                        newPlayer1Zone.addEventListener('change', function() {
                            const container = document.querySelector('.w-full.max-w-xl');
                            if (!container) return;

                            // Remove any existing deployment zone images for player 1
                            const existingImages = container.querySelectorAll('img:not([src*="Mission_TableGrid.png"])');
                            existingImages.forEach(img => {
                                if (img.src.includes('Mission_DeploymentZone') && img.src.includes('p01')) {
                                    img.remove();
                                }
                            });
                            
                            if (this.value) {
                                const zoneNumber = this.value.replace('zone', '');
                                const img = document.createElement('img');
                                img.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p01.png`;
                                img.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 2;';
                                container.appendChild(img);

                                // If in pitched battle mode, update player 2 zone to match
                                if (newDeploymentType && newDeploymentType.value === 'pitched' && newPlayer2Zone) {
                                    newPlayer2Zone.value = this.value;
                                    // Trigger the change event to update the image
                                    newPlayer2Zone.dispatchEvent(new Event('change'));
                                }
                            }
                        });
                    }

                    if (newPlayer2Zone) {
                        newPlayer2Zone.addEventListener('change', function() {
                            const container = document.querySelector('.w-full.max-w-xl');
                            if (!container) return;

                            // Remove any existing deployment zone images for player 2
                            const existingImages = container.querySelectorAll('img:not([src*="Mission_TableGrid.png"])');
                            existingImages.forEach(img => {
                                if (img.src.includes('Mission_DeploymentZone') && img.src.includes('p02')) {
                                    img.remove();
                                }
                            });
                            
                            if (this.value) {
                                const zoneNumber = this.value.replace('zone', '');
                                const img = document.createElement('img');
                                img.src = `/images/mission/Mission_DeploymentZone${zoneNumber.padStart(2, '0')}p02.png`;
                                img.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 2;';
                                container.appendChild(img);
                            }
                        });
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

                    if (newPrimaryObjective && newMissionContent) {
                        newPrimaryObjective.addEventListener('change', async function() {
                            if (!newMissionContent) return;

                            const primaryData = this.value ? await loadPrimaryObjectiveContent(this.value) : null;
                            const secondaryObjective = document.getElementById('secondaryObjective');
                            const secondaryData = secondaryObjective && secondaryObjective.value ? 
                                await loadSecondaryObjectiveContent(secondaryObjective.value) : null;
                            
                            renderPrimaryObjectiveContent(newMissionContent, primaryData, secondaryData);
                        });
                    }

                    if (newNarrativeLayer && newNarrativeContent) {
                        newNarrativeLayer.addEventListener('change', async function() {
                            if (!newNarrativeContent) return;
                            
                            // Clear existing content
                            newNarrativeContent.innerHTML = '<div class="p-4 text-gray-500">Loading narrative content...</div>';
                            
                            if (this.value) {
                                try {
                                    const response = await fetch('/data/narrative.json');
                                    if (!response.ok) {
                                        throw new Error(`Failed to load narrative content: ${response.statusText}`);
                                    }
                                    const data = await response.json();
                                    
                                    // Find the place data that matches the selected name
                                    const placeData = Object.values(data.locations).find(place => place.name === this.value);
                                    
                                    if (placeData && placeData.content) {
                                        newNarrativeContent.innerHTML = placeData.content;
                                    } else {
                                        throw new Error('Narrative content not found');
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

                    // Add event listener for secondary objective dropdown
                    if (newSecondaryObjective && newMissionContent) {
                        newSecondaryObjective.addEventListener('change', async function() {
                            if (!newMissionContent) return;

                            const primaryObjective = document.getElementById('missionRule');
                            const primaryData = primaryObjective && primaryObjective.value ? 
                                await loadPrimaryObjectiveContent(primaryObjective.value) : null;
                            const secondaryData = this.value ? await loadSecondaryObjectiveContent(this.value) : null;
                            
                            renderPrimaryObjectiveContent(newMissionContent, primaryData, secondaryData);
                        });
                    }
                } else {
                    console.error('Content section not found');
                }
            } else {
                console.error('Main container not found');
            }
        }
    }, 100);

    // Clear the interval after 10 seconds to prevent infinite checking
    setTimeout(() => {
        clearInterval(checkForElements);
        console.log('Element check timeout reached');
    }, 10000);
}

// Initialize mission generator when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    initMissionGenerator();

    // Add event listener for primary objective dropdown
    const primaryObjective = document.getElementById('missionRule');
    const missionContent = document.getElementById('missionContent');
    
    if (primaryObjective && missionContent) {
        primaryObjective.addEventListener('change', async function() {
            if (!missionContent) return;

            if (this.value) {
                const objectiveData = await loadPrimaryObjectiveContent(this.value);
                renderPrimaryObjectiveContent(missionContent, objectiveData, null);
            } else {
                missionContent.innerHTML = '';
            }
        });
    }
}); 