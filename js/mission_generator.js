function initMissionGenerator() {
    const deploymentType = document.getElementById('deploymentType');
    const zonesDiv = document.getElementById('deploymentZones');

    if (deploymentType && zonesDiv) {
        deploymentType.addEventListener('change', function() {
            const type = this.value;
            zonesDiv.innerHTML = '';
            
            if (type === 'pitched') {
                zonesDiv.style.display = 'block';
                zonesDiv.innerHTML = `
                    <div class='mb-4'>
                        <label for='pitchedZone' class='block mb-2'>Deployment Zone:</label>
                        <select id='pitchedZone' class='w-full p-2 border rounded'>
                            <option value=''>Select Zone</option>
                            <option value='zone1'>Zone 1</option>
                            <option value='zone2'>Zone 2</option>
                            <option value='zone3'>Zone 3</option>
                            <option value='zone4'>Zone 4</option>
                            <option value='zone5'>Zone 5</option>
                            <option value='zone6'>Zone 6</option>
                        </select>
                    </div>`;
            } else if (type === 'asymmetrical') {
                zonesDiv.style.display = 'block';
                zonesDiv.innerHTML = `
                    <div class='mb-4'>
                        <label for='player1Zone' class='block mb-2'>Player 1 Deployment Zone:</label>
                        <select id='player1Zone' class='w-full p-2 border rounded'>
                            <option value=''>Select Zone</option>
                            <option value='zone1'>Zone 1</option>
                            <option value='zone2'>Zone 2</option>
                            <option value='zone3'>Zone 3</option>
                            <option value='zone4'>Zone 4</option>
                            <option value='zone5'>Zone 5</option>
                            <option value='zone6'>Zone 6</option>
                        </select>
                    </div>
                    <div class='mb-4'>
                        <label for='player2Zone' class='block mb-2'>Player 2 Deployment Zone:</label>
                        <select id='player2Zone' class='w-full p-2 border rounded'>
                            <option value=''>Select Zone</option>
                            <option value='zone1'>Zone 1</option>
                            <option value='zone2'>Zone 2</option>
                            <option value='zone3'>Zone 3</option>
                            <option value='zone4'>Zone 4</option>
                            <option value='zone5'>Zone 5</option>
                            <option value='zone6'>Zone 6</option>
                        </select>
                    </div>`;
            } else {
                zonesDiv.style.display = 'none';
            }
        });
    }
}

// Initialize when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMissionGenerator);
} else {
    initMissionGenerator();
} 