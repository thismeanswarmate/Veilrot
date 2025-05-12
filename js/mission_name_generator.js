// Mission name generator
class MissionNameGenerator {
    constructor() {
        this.wordLists = null;
    }

    async initialize() {
        try {
            const response = await fetch('/data/mission_names.json');
            if (!response.ok) {
                throw new Error(`Failed to load mission names: ${response.statusText}`);
            }
            this.wordLists = await response.json();
        } catch (error) {
            console.error('Error loading mission names:', error);
            throw error;
        }
    }

    pickRandom(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    generateMissionName() {
        if (!this.wordLists) {
            throw new Error('Mission name generator not initialized');
        }

        const pattern = Math.floor(Math.random() * 4);

        switch (pattern) {
            case 0:
                // Verb + Adjective + Object
                return `${this.pickRandom(this.wordLists.verbs)} the ${this.pickRandom(this.wordLists.adjectives)} ${this.pickRandom(this.wordLists.objects)}`;
            
            case 1:
                // Object of Concept
                return `${this.pickRandom(this.wordLists.objects)} of ${this.pickRandom(this.wordLists.concepts)}`;
            
            case 2:
                // When the Object Fell
                return `When the ${this.pickRandom(this.wordLists.objects)} Fell`;
            
            case 3:
                // The Concept Engine
                return `The ${this.pickRandom(this.wordLists.concepts)} Engine`;
            
            default:
                // Fallback
                return `${this.pickRandom(this.wordLists.verbs)} the ${this.pickRandom(this.wordLists.objects)}`;
        }
    }
}

// Create a singleton instance
const missionNameGenerator = new MissionNameGenerator();

// Initialize the generator when the script loads
missionNameGenerator.initialize().catch(error => {
    console.error('Failed to initialize mission name generator:', error);
}); 