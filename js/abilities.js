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

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM Content Loaded - Starting initialization');
        await loadAbilities();
        await loadTraitData();
        setupAbilities();
        createTraitTooltips();
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