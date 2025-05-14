// Add this at the top of the file
let currentExpandedFaction = null;
let isTransitioning = false; // Add transition state tracking
let clickCount = 0; // Track click count for debugging
let lastClickTime = 0; // Track last click time for debouncing
let factionData = {}; // Store all faction data here

console.log('[DEBUG] buttons.js loaded');

// Function to handle collapsible content
function handleCollapsibleClick(button, content) {
  try {
    if (!button || !content) {
      console.error('🔴 Invalid button or content:', { button, content });
      return;
    }
    
    console.log('🔵 COLLAPSIBLE CLICK:', {
      buttonText: button.textContent,
      hasVisibleClass: content.classList.contains('visible')
    });
    
    // Toggle visibility using classList
    content.classList.toggle('visible');
    button.classList.toggle('expanded');
    
    console.log('🔵 AFTER TOGGLE:', {
      hasVisibleClass: content.classList.contains('visible'),
      hasExpandedClass: button.classList.contains('expanded')
    });
  } catch (error) {
    console.error('🔴 Error in handleCollapsibleClick:', error);
  }
}

// Function to handle right collapsible content
async function handleRightCollapsibleClick(button, section) {
  try {
    console.log('🔵 FACTION BUTTON CLICKED:', {
      sectionTitle: section.title,
      currentExpandedFaction
    });

    const factionContent = document.getElementById('faction-content');
    const mainContainer = document.querySelector('.main-container');
    if (!factionContent) {
      console.error('[ERROR] Faction content container not found');
      return;
    }

    // Check if this is the first click or if container is already expanded
    if (!currentExpandedFaction) {
      console.log('🔵 FIRST CLICK: Opening faction content');
    } else if (currentExpandedFaction === section.title) {
      console.log('🔴 CONTAINER EXPANDED: Clicking same faction again');
      mainContainer.classList.remove('has-faction');
      factionContent.classList.remove('visible');
      factionContent.innerHTML = '';
      currentExpandedFaction = null;
      button.classList.remove('expanded');
      return;
    }

    // Reset all faction buttons
    const allFactionButtons = document.querySelectorAll('.faction-button');
    allFactionButtons.forEach(btn => {
      btn.classList.remove('expanded');
    });

    // Show the faction content
    button.classList.add('expanded');
    currentExpandedFaction = section.title;
    
    const factionName = section.title.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/of_the_/g, '')
      .replace(/of_/g, '');
    
    // Use the pre-loaded faction data
    const data = factionData[factionName];
    if (!data) {
      console.error(`[ERROR] No data found for faction: ${factionName}`);
      factionContent.innerHTML = '<div class="text-red-500">Failed to load faction data. Please refresh the page.</div>';
      return;
    }

    console.log('🔵 DISPLAYING FACTION DATA:', {
      name: data.name,
      hasDescription: !!data.description,
      descriptionLength: data.description ? data.description.length : 0,
      unitsCount: data.units ? data.units.length : 0
    });

    // Create the faction content HTML
    factionContent.innerHTML = `
      <h2 class="text-2xl font-bold mb-4">${data.name}</h2>
      <p class="text-lg mb-6">${data.shortDescription}</p>
      <div class="space-y-4">
        <div class="collapsible-section">
          <button type="button" class="collapsible-button w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Description</button>
          <div class="collapsible-content">
            <p class="p-4 bg-white rounded-lg">${data.description}</p>
          </div>
        </div>
        <div class="collapsible-section">
          <button type="button" class="collapsible-button w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Units</button>
          <div class="collapsible-content">
            <div class="p-4 bg-white rounded-lg space-y-4">${data.units ? data.units.map(unit => `
              <div class="unit-card">
                <h3 class="font-bold">${unit.name}</h3>
                <p class="text-sm text-gray-600">Cost: ${unit.cost}</p>
                <p class="mt-2">${unit.description}</p>
                <div class="mt-2">
                  <h4 class="font-semibold">Abilities:</h4>
                  <ul class="list-disc list-inside">
                    ${unit.abilities.map(ability => `<li>${ability}</li>`).join('')}
                  </ul>
                </div>
                <div class="mt-2">
                  <h4 class="font-semibold">Keywords:</h4>
                  <p>${unit.keywords.join(', ')}</p>
                </div>
                <div class="mt-2 grid grid-cols-2 gap-2">
                  <div>Toughness: ${unit.toughness}</div>
                  <div>Wounds: ${unit.wounds}</div>
                  <div>Grit: ${unit.grit}</div>
                  <div>MS: ${unit.ms}</div>
                  <div>Strength: ${unit.strength}</div>
                  <div>RS: ${unit.rs}</div>
                  <div>Resolve: ${unit.resolve}</div>
                  <div>Movement: ${unit.movement}</div>
                  <div>Claim: ${unit.claim}</div>
                </div>
              </div>
            `).join('') : ''}</div>
          </div>
        </div>
        <div class="collapsible-section">
          <button type="button" class="collapsible-button w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Equipment</button>
          <div class="collapsible-content">
            <div class="p-4 bg-white rounded-lg space-y-4">${data.equipment.map(item => `<div><h3 class="font-bold">${item.name}</h3><p>${item.description}</p></div>`).join('')}</div>
          </div>
        </div>
        <div class="collapsible-section">
          <button type="button" class="collapsible-button w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Branches</button>
          <div class="collapsible-content">
            <div class="p-4 bg-white rounded-lg space-y-4">${data.branches.map(branch => `<div><h3 class="font-bold">${branch.name}</h3><p>${branch.description}</p></div>`).join('')}</div>
          </div>
        </div>
      </div>
    `;
    
    mainContainer.classList.add('has-faction');
    factionContent.classList.add('visible');
    
    // Add click handlers for the collapsible sections
    console.log('🔵 SETTING UP CLICK HANDLERS');
    const buttons = factionContent.querySelectorAll('.collapsible-button');
    console.log('🔵 Found buttons:', buttons.length);
    
    buttons.forEach((button, index) => {
      const content = button.nextElementSibling;
      
      if (!content) {
        console.error('🔴 Missing content for button:', { index, buttonText: button.textContent });
        return;
      }
      
      console.log('🔵 Setting up button:', {
        index,
        buttonText: button.textContent,
        contentExists: !!content
      });
      
      // Remove any existing click handlers
      button.removeEventListener('click', handleCollapsibleClick);
      
      // Add new click handler
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleCollapsibleClick(button, content);
      });
    });
  } catch (error) {
    console.error('🔴 Error in handleRightCollapsibleClick:', error);
  }
}

// Function to load all faction data
async function loadAllFactionData() {
  const factions = [
    'thornbound_choir',
    'moonfall_covenant',
    'carrion_emissaries',
    'orrery_hollow_star',
    'verdigrave_syndicate',
    'hollow_saints',
    'bastion_concord'
  ];

  for (const faction of factions) {
    try {
      // Load main faction data
      const response = await fetch(`/data/factions/${faction}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${faction} data: ${response.status}`);
      }
      factionData[faction] = await response.json();
      console.log(`[DEBUG] Loaded faction data for ${faction}`);

      // Load unit data for Thornbound Choir
      if (faction === 'thornbound_choir') {
        const unitFiles = [
          'gloam_chanterant',
          'chantwrithe',
          'bellowsaint',
          'huskbearers',
          'sporethroat_exalter',
          'cankerblades',
          'jaw_bloomed',
          'seeding_mass'
        ];
        
        factionData[faction].units = [];
        for (const unitFile of unitFiles) {
          const unitResponse = await fetch(`/data/factions/${faction}/units/${unitFile}.json`);
          if (!unitResponse.ok) {
            throw new Error(`Failed to load ${unitFile} data: ${unitResponse.status}`);
          }
          const unitData = await unitResponse.json();
          factionData[faction].units.push(unitData);
        }
        console.log(`[DEBUG] Loaded ${factionData[faction].units.length} units for ${faction}`);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to load ${faction} data:`, error);
    }
  }
}

// Call this when the page loads
loadAllFactionData();

// Function to render a section with its buttons and content
function renderSection(section, container, level = 0) {
  console.log(`[DEBUG] Rendering section: ${section.title} at level ${level}`);
  
  const sectionDiv = document.createElement('div');
  sectionDiv.className = 'section-container';

  // Create the section button
  const button = document.createElement('button');
  button.textContent = section.title;
  button.type = 'button'; // Prevent form submission
  
  // Determine button class based on section type and level
  if (level === 0) {
    button.className = 'top-level-button';
  } else if (level === 1) {
    // Special handling for faction buttons
    if (section.title === "Thornbound Choir" || 
        section.title === "Moonfall Covenant" || 
        section.title === "Carrion Emissaries" || 
        section.title === "Orrery of the Hollow Star" || 
        section.title === "Verdigrave Syndicate" || 
        section.title === "Hollow Saints" || 
        section.title === "Bastion Concord") {
      button.className = 'faction-button';
    } else {
      button.className = 'main-section-button';
    }
  } else if (level === 2) {
    button.className = 'subsection-button';
  } else {
    button.className = 'detail-button';
  }
  
  // Create content wrapper only for non-faction buttons
  let contentWrapper = null;
  if (button.className !== 'faction-button') {
    contentWrapper = document.createElement('div');
    contentWrapper.className = 'collapsible-content';
    
    // Add the section's content if it exists
    if (section.content) {
      const contentDiv = document.createElement('div');
      contentDiv.className = 'content-box';
      contentDiv.innerHTML = section.content;
      contentWrapper.appendChild(contentDiv);
    }
    
    // Add subsections if they exist
    if (Array.isArray(section.sections)) {
      const subsectionsDiv = document.createElement('div');
      subsectionsDiv.className = 'section-buttons';
      for (const subsection of section.sections) {
        renderSection(subsection, subsectionsDiv, level + 1);
      }
      contentWrapper.appendChild(subsectionsDiv);
    }
  }
  
  // Add click handler for the button
  button.addEventListener('click', function(e) {
    try {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('🔵 BUTTON CLICKED:', {
        sectionTitle: section.title,
        buttonClass: button.className,
        isFactionButton: button.className.includes('faction-button')
      });

      // Handle Factions button
      if (level === 0 && section.title === "Factions") {
        console.log('[DEBUG] Entered Factions button branch');
        this.classList.toggle('expanded');
        if (contentWrapper) {
          contentWrapper.classList.toggle('visible');
        }
        const factionContent = document.getElementById('faction-content');
        const mainContainer = document.querySelector('.main-container');
        if (factionContent && factionContent.classList.contains('visible')) {
          mainContainer.classList.remove('has-faction');
          factionContent.classList.remove('visible');
          // Reset all faction buttons
          const allFactionButtons = document.querySelectorAll('.faction-button');
          allFactionButtons.forEach(btn => {
            btn.classList.remove('expanded');
          });
          currentExpandedFaction = null;
          console.log('[DEBUG] Hiding faction content due to Factions button click');
        }
        return;
      }

      // Handle faction buttons
      if (button.className.includes('faction-button')) {
        handleRightCollapsibleClick(this, section);
        return;
      }

      // Handle regular collapsible content
      if (contentWrapper) {
        handleCollapsibleClick(this, contentWrapper);
      }
    } catch (error) {
      console.error('🔴 Error in button click handler:', error);
    }
  });
  
  sectionDiv.appendChild(button);
  if (contentWrapper) {
    sectionDiv.appendChild(contentWrapper);
  }
  container.appendChild(sectionDiv);
}