// Add this at the top of the file
let currentExpandedFaction = null;
let isTransitioning = false; // Add transition state tracking
let clickCount = 0; // Track click count for debugging
let lastClickTime = 0; // Track last click time for debouncing

console.log('[DEBUG] buttons.js loaded');

// Function to render a section with its buttons and content
function renderSection(section, container, level = 0) {
  console.log(`[DEBUG] Rendering section: ${section.title} at level ${level}`);
  
  const sectionDiv = document.createElement('div');
  sectionDiv.className = 'section-container';

  // Create the section button
  const button = document.createElement('button');
  button.textContent = section.title;
  
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
    console.log(`[DEBUG] Button clicked: ${section.title}`);
    console.log('[DEBUG] Event:', e);
    console.log('[DEBUG] Click context:', {
      level,
      sectionTitle: section.title,
      buttonClass: button.className,
      thisClass: this.className,
      currentExpandedFaction
    });
    // Log all faction buttons and their classes
    const allFactionButtons = document.querySelectorAll('.faction-button');
    allFactionButtons.forEach((btn, idx) => {
      console.log(`[DEBUG] Faction button [${idx}]: text='${btn.textContent}', classes='${btn.className}'`);
    });

    // Explicitly branch for Factions button
    if (level === 0 && section.title === "Factions") {
      console.log('[DEBUG] Entered Factions button branch');
      this.classList.toggle('expanded');
      if (contentWrapper) contentWrapper.classList.toggle('visible');
      const factionContent = document.getElementById('faction-content');
      const mainContainer = document.querySelector('.main-container');
      if (factionContent && factionContent.classList.contains('visible')) {
        mainContainer.classList.remove('has-faction');
        factionContent.classList.remove('visible');
        console.log('[DEBUG] Hiding faction content due to Factions button click');
      }
      return;
    }

    // Explicitly branch for faction buttons
    if (button.className.includes('faction-button')) {
      // Add prominent debug log for faction match check at the very start
      console.log('🔍 FACTION MATCH CHECK:', {
        currentExpandedFaction,
        clickedFaction: section.title,
        isMatch: currentExpandedFaction === section.title,
        buttonClasses: this.className
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
        this.classList.remove('expanded');
        return;
      }

      // Show the faction content
      this.classList.add('expanded');
      currentExpandedFaction = section.title;
      
      const factionName = section.title.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/of_the_/g, '')
        .replace(/of_/g, '');
      
      fetch(`data/factions/${factionName}.json`)
        .then(response => response.json())
        .then(data => {
          factionContent.innerHTML = `
            <h2 class=\"text-2xl font-bold mb-4\">${data.name}</h2>
            <p class=\"text-lg mb-6\">${data.shortDescription}</p>
            <div class=\"space-y-4\">
              <button class=\"w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors\">Full Description<span class=\"float-right\">→</span></button>
              <div class=\"collapsible-content\"><p class=\"p-4 bg-white rounded-lg\">${data.description}</p></div>
              <button class=\"w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors\">Units<span class=\"float-right\">→</span></button>
              <div class=\"collapsible-content\"><div class=\"p-4 bg-white rounded-lg space-y-4\">${data.units.map(unit => `<div><h3 class=\\\"font-bold\\\">${unit.name}</h3><p>${unit.description}</p></div>`).join('')}</div></div>
              <button class=\"w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors\">Equipment<span class=\"float-right\">→</span></button>
              <div class=\"collapsible-content\"><div class=\"p-4 bg-white rounded-lg space-y-4\">${data.equipment.map(item => `<div><h3 class=\\\"font-bold\\\">${item.name}</h3><p>${item.description}</p></div>`).join('')}</div></div>
              <button class=\"w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors\">Branches<span class=\"float-right\">→</span></button>
              <div class=\"collapsible-content\"><div class=\"p-4 bg-white rounded-lg space-y-4\">${data.branches.map(branch => `<div><h3 class=\\\"font-bold\\\">${branch.name}</h3><p>${branch.description}</p></div>`).join('')}</div></div>
            </div>
          `;
          
          mainContainer.classList.add('has-faction');
          factionContent.classList.add('visible');
          
          // Add click handlers for collapsible sections
          const collapsibleButtons = factionContent.querySelectorAll('button');
          collapsibleButtons.forEach(btn => {
            if (!btn) return;
            const content = btn.nextElementSibling;
            if (!content) return;
            content.style.display = 'none';
            btn.addEventListener('click', function(e) {
              e.stopPropagation();
              if (content.style.display === 'none') {
                content.style.display = 'block';
                if (this && this.classList) {
                  this.classList.add('expanded');
                }
              } else {
                content.style.display = 'none';
                if (this && this.classList) {
                  this.classList.remove('expanded');
                }
              }
            });
          });
        })
        .catch(error => {
          console.error('[ERROR] Failed to load faction data:', error);
          factionContent.innerHTML = '<div class=\"text-red-500\">Failed to load faction data. Please try again.</div>';
        });
      return;
    }

    // Regular button behavior
    if (this && this.classList) {
      this.classList.toggle('expanded');
    }
    if (contentWrapper && contentWrapper.classList) {
      contentWrapper.classList.toggle('visible');
    }
  });
  
  sectionDiv.appendChild(button);
  if (contentWrapper) {
    sectionDiv.appendChild(contentWrapper);
  }
  container.appendChild(sectionDiv);
}

// Initialize button functionality when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Add click handlers for all collapsible content
  document.querySelectorAll('.collapsible-content').forEach(content => {
    if (!content) return;
    
    const button = content.previousElementSibling;
    if (!button || button.tagName !== 'BUTTON') return;
    
    // Skip if button is already handled
    if (button.hasAttribute('data-handled')) return;
    
    // Mark button as handled
    button.setAttribute('data-handled', 'true');
    
    // Hide content initially
    content.style.display = 'none';
    
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Toggle content visibility
      if (content.style.display === 'none') {
        content.style.display = 'block';
        if (button && button.classList) {
          button.classList.add('expanded');
        }
      } else {
        content.style.display = 'none';
        if (button && button.classList) {
          button.classList.remove('expanded');
        }
      }
    });
  });
}); 