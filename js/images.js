// Function to update deployment zone images
async function updateDeploymentZoneImages() {
    const deploymentZone = document.getElementById('deploymentType');
    const player1Zone = document.getElementById('player1Zone');
    const player2Zone = document.getElementById('player2Zone');
    
    if (!deploymentZone) {
        console.warn('Deployment zone select not found');
        return;
    }

    const selectedValue = deploymentZone.value;
    if (!selectedValue) {
        console.warn('No deployment zone selected');
        return;
    }

    try {
        // Find or create the container for images
        let container = document.querySelector('.w-full.max-w-xl');
        if (!container) {
            console.warn('Image container not found');
            return;
        }

        // Remove existing deployment zone images
        const existingImages = container.querySelectorAll('img:not([src*="Mission_TableGrid.png"])');
        existingImages.forEach(img => {
            if (!img.src.includes('Mission_Objectives')) {
                img.remove();
            }
        });

        // Map deployment types to their numeric values
        const deploymentTypeMap = {
            'pitched': '01',
            'asymmetrical': '02',
            'flank': '03',
            'corner': '04',
            'diagonal': '05',
            'center': '06'
        };

        // Get the numeric value for the selected deployment type
        const numericValue = deploymentTypeMap[selectedValue] || '01';
        
        // Create and add player 1 deployment zone image
        const zonePath1 = `/images/mission/Mission_DeploymentZone${numericValue}p01.png`;
        const zoneImg1 = document.createElement('img');
        zoneImg1.src = zonePath1;
        zoneImg1.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
        zoneImg1.onload = () => console.log('Player 1 deployment zone image loaded successfully');
        zoneImg1.onerror = () => console.error('Failed to load player 1 deployment zone image');
        container.appendChild(zoneImg1);

        // If deployment type is asymmetrical, add player 2 deployment zone image
        if (selectedValue === 'asymmetrical' && player2Zone && player2Zone.value) {
            const zonePath2 = `/images/mission/Mission_DeploymentZone${numericValue}p02.png`;
            const zoneImg2 = document.createElement('img');
            zoneImg2.src = zonePath2;
            zoneImg2.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
            zoneImg2.onload = () => console.log('Player 2 deployment zone image loaded successfully');
            zoneImg2.onerror = () => console.error('Failed to load player 2 deployment zone image');
            container.appendChild(zoneImg2);
        }
        // If deployment type is pitched battle, sync player 2's zone with player 1's
        else if (selectedValue === 'pitched' && player1Zone && player1Zone.value && player2Zone) {
            player2Zone.value = player1Zone.value;
            const zonePath2 = `/images/mission/Mission_DeploymentZone${numericValue}p02.png`;
            const zoneImg2 = document.createElement('img');
            zoneImg2.src = zonePath2;
            zoneImg2.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1;';
            zoneImg2.onload = () => console.log('Player 2 deployment zone image loaded successfully');
            zoneImg2.onerror = () => console.error('Failed to load player 2 deployment zone image');
            container.appendChild(zoneImg2);
        }

    } catch (error) {
        console.error('Error updating images:', error);
    }
}

// Function to wait for all images to load
async function waitForImages(container) {
    const images = container.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });
    });

    try {
        await Promise.all(imagePromises);
        console.log('All images loaded successfully');
    } catch (error) {
        console.error('Error loading images:', error);
        throw error;
    }
}

// Initialize image handling when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const deploymentZone = document.getElementById('deploymentType');
    const player1Zone = document.getElementById('player1Zone');
    const player2Zone = document.getElementById('player2Zone');
    
    if (deploymentZone) {
        deploymentZone.addEventListener('change', updateDeploymentZoneImages);
    }
    if (player1Zone) {
        player1Zone.addEventListener('change', updateDeploymentZoneImages);
    }
    if (player2Zone) {
        player2Zone.addEventListener('change', updateDeploymentZoneImages);
    }
}); 