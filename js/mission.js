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
            <p><strong>Overview:</strong> ${missionData.overview}</p>
            <p><strong>Primary Objectives:</strong> ${missionData.primary_objectives}</p>
            <p><strong>Secondary Objectives:</strong> ${missionData.secondary_objectives}</p>
            ${missionData.special_rules ? `<p><strong>Special Rules:</strong> ${missionData.special_rules}</p>` : ''}
        </div>
    `;
    element.innerHTML = content;
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

// Initialize mission generator
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

            // Create button container
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex justify-center gap-2 w-full mb-2';

            // Create randomize button
            const randomizeButton = document.createElement('button');
            randomizeButton.className = 'px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-medium';
            randomizeButton.textContent = 'Randomize';
            randomizeButton.addEventListener('click', randomizeMission);

            // Create download button
            const downloadButton = document.createElement('button');
            downloadButton.className = 'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm font-medium';
            downloadButton.textContent = 'Download';
            downloadButton.addEventListener('click', downloadMission);

            // Add buttons to container
            buttonContainer.appendChild(randomizeButton);
            buttonContainer.appendChild(downloadButton);

            // Create name input
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.id = 'missionName';
            nameInput.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-2';
            nameInput.placeholder = 'Enter mission name';

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

                // Add columns to dropdowns wrapper
                dropdownsWrapper.appendChild(leftColumn);
                dropdownsWrapper.appendChild(rightColumn);

                // Create wrapper for buttons and input
                const controlsWrapper = document.createElement('div');
                controlsWrapper.className = 'w-full flex flex-col gap-2';
                controlsWrapper.style.margin = '0';
                controlsWrapper.style.padding = '0';

                // Add buttons and input to controls wrapper
                controlsWrapper.appendChild(buttonContainer);
                controlsWrapper.appendChild(nameInput);

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
                                        // Remove any h3 elements from the content
                                        const tempDiv = document.createElement('div');
                                        tempDiv.innerHTML = data.content;
                                        const h3Elements = tempDiv.getElementsByTagName('h3');
                                        while (h3Elements.length > 0) {
                                            h3Elements[0].remove();
                                        }
                                        newMissionContent.innerHTML = tempDiv.innerHTML;
                                    } else if (data && data.overview) {
                                        const content = `
                                            <div class="mission-content">
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
                } else {
                    console.error('Content section not found');
                }
            }
        }
    }, 100); // Check every 100ms

    // Clear the interval after 10 seconds to prevent infinite checking
    setTimeout(() => {
        clearInterval(checkForElements);
    }, 10000);
}

// Initialize mission generator when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initMissionGenerator();
}); 