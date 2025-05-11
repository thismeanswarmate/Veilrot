let abilities = {};
let tooltipTimeout = null;
let currentTooltip = null;
let weaponTraits = null;
let armorTraits = null;
let tooltipElements = new Map(); // Store tooltip elements

// Load abilities data
async function loadAbilities() {
    try {
        const response = await fetch('/data/abilities.json');
        const data = await response.json();
        abilities = data.abilities;
        setupAbilities();
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
    } catch (error) {
        console.error('Error loading trait data:', error);
    }
}

// Format ability description with threshold
function formatAbilityDescription(ability) {
    if (!ability) return '';
    return ability.description.replace('X', ability.threshold);
}

// Setup both tooltips and content blocks
function setupAbilities() {
    // Handle tooltips
    document.querySelectorAll('.tooltip[data-ability]').forEach(element => {
        const abilityName = element.getAttribute('data-ability');
        const ability = abilities[abilityName];
        if (ability) {
            const tooltip = document.createElement('div');
            tooltip.className = 'custom-tooltip';
            tooltip.innerHTML = formatAbilityDescription(ability).replace(/\n/g, '<br>');
            document.body.appendChild(tooltip);
            tooltipElements.set(element, tooltip);

            element.addEventListener('mouseenter', () => {
                if (currentTooltip) currentTooltip.style.display = 'none';
                currentTooltip = tooltip;
                tooltipTimeout = setTimeout(() => {
                    tooltip.style.display = 'block';
                    const rect = element.getBoundingClientRect();
                    tooltip.style.left = rect.left + 'px';
                    tooltip.style.top = (rect.bottom + 5) + 'px';
                }, 1000);
            });

            element.addEventListener('mouseleave', () => {
                if (tooltipTimeout) {
                    clearTimeout(tooltipTimeout);
                    tooltipTimeout = null;
                }
                tooltip.style.display = 'none';
            });
        }
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

    // Clear existing tooltip elements
    tooltipElements.forEach(tooltip => tooltip.remove());
    tooltipElements.clear();
    
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
                            
                            // Build tooltip content from all traits
                            let tooltipContent = '';
                            traitNames.forEach((traitName, index) => {
                                if (traitName) {
                                    // Find trait description from weapon_traits.json or armor_traits.json
                                    let traitRow = weaponTraits.content.match(new RegExp(`<tr><td[^>]*>${traitName}</td><td[^>]*>(.*?)</td></tr>`));
                                    if (!traitRow) {
                                        traitRow = armorTraits.content.match(new RegExp(`<tr><td[^>]*>${traitName}</td><td[^>]*>(.*?)</td></tr>`));
                                    }
                                    
                                    if (traitRow) {
                                        if (index > 0) tooltipContent += '<br><br>';
                                        tooltipContent += `<strong>${traitName}:</strong><br>${traitRow[1].replace(/<br>/g, '<br>')}`;
                                    }
                                }
                            });
                            
                            if (tooltipContent) {
                                tooltip.innerHTML = tooltipContent;
                                document.body.appendChild(tooltip);
                                tooltipElements.set(traitCell, tooltip);
                                
                                // Add tooltip behavior
                                traitCell.classList.add('tooltip');
                                
                                const showTooltip = () => {
                                    if (currentTooltip) currentTooltip.style.display = 'none';
                                    currentTooltip = tooltip;
                                    tooltipTimeout = setTimeout(() => {
                                        tooltip.style.display = 'block';
                                        const rect = traitCell.getBoundingClientRect();
                                        tooltip.style.left = `${rect.left}px`;
                                        tooltip.style.top = `${rect.bottom + 5}px`;
                                    }, 1000);
                                };
                                
                                const hideTooltip = () => {
                                    if (tooltipTimeout) {
                                        clearTimeout(tooltipTimeout);
                                        tooltipTimeout = null;
                                    }
                                    tooltip.style.display = 'none';
                                };
                                
                                traitCell.addEventListener('mouseenter', showTooltip);
                                traitCell.addEventListener('mouseleave', hideTooltip);
                            }
                        }
                    }
                }
            });
        }
    });
}

// Load abilities and trait data when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    await loadTraitData();
    loadAbilities();
    createTraitTooltips();
});

// Also call createTraitTooltips when sections are expanded
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('section-button')) {
        setTimeout(createTraitTooltips, 100);
    }
}); 