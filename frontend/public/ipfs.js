/**
 * IPFS Upload Module for DroneSecure
 * Integrates with Pinata API for uploading mission metadata to IPFS
 */

class IPFSUploader {
    constructor(apiKey = '', apiSecret = '') {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.pinataEndpoint = 'https://api.pinata.cloud';
    }

    /**
     * Set Pinata API credentials
     */
    setCredentials(apiKey, apiSecret) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    /**
     * Check if credentials are set
     */
    hasCredentials() {
        return this.apiKey && this.apiSecret;
    }

    /**
     * Upload JSON metadata to IPFS via Pinata
     */
    async uploadJSON(metadata) {
        if (!this.hasCredentials()) {
            throw new Error('Pinata API credentials not set');
        }

        const url = `${this.pinataEndpoint}/pinning/pinJSONToIPFS`;

        const data = {
            pinataContent: metadata,
            pinataMetadata: {
                name: `DroneSecure_${metadata.name || 'Mission'}_${Date.now()}.json`
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': this.apiKey,
                    'pinata_secret_api_key': this.apiSecret
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload to IPFS');
            }

            const result = await response.json();
            return result.IpfsHash; // CID of the uploaded content
        } catch (error) {
            console.error('IPFS upload error:', error);
            throw error;
        }
    }

    /**
     * Upload a file to IPFS via Pinata
     */
    async uploadFile(file) {
        if (!this.hasCredentials()) {
            throw new Error('Pinata API credentials not set');
        }

        const url = `${this.pinataEndpoint}/pinning/pinFileToIPFS`;
        const formData = new FormData();
        formData.append('file', file);

        const metadata = JSON.stringify({
            name: `DroneSecure_${file.name}_${Date.now()}`
        });
        formData.append('pinataMetadata', metadata);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'pinata_api_key': this.apiKey,
                    'pinata_secret_api_key': this.apiSecret
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload file to IPFS');
            }

            const result = await response.json();
            return result.IpfsHash;
        } catch (error) {
            console.error('IPFS file upload error:', error);
            throw error;
        }
    }

    /**
     * Create mission metadata in the correct format
     */
    createMissionMetadata(data) {
        return {
            name: data.name || 'Mission',
            type: data.type || 'Standard',
            value: data.value || 'Niveau 1',
            hash: data.flightPlanHash || '',
            previousOwners: [],
            createdAt: Math.floor(Date.now() / 1000).toString(),
            lastTransferAt: Math.floor(Date.now() / 1000).toString(),
            attributes: {
                weight: data.weight || '',
                range: data.range || '',
                priority: data.priority || 'normal',
                departureCity: data.departureCity || '',
                destinationCity: data.destinationCity || '',
                estimatedDuration: data.estimatedDuration || '',
                cargo: data.cargo || ''
            },
            flightPlan: {
                waypoints: data.waypoints || [],
                altitude: data.altitude || '',
                speed: data.speed || ''
            }
        };
    }

    /**
     * Validate IPFS CID format
     */
    isValidCID(cid) {
        // Basic validation for IPFS CID
        // CIDv0 starts with Qm and is 46 characters
        // CIDv1 can start with various characters
        return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|z[1-9A-HJ-NP-Za-km-z]{48})$/.test(cid);
    }

    /**
     * Get IPFS gateway URL for a CID
     */
    getGatewayURL(cid, gateway = 'ipfs.io') {
        return `https://${gateway}/ipfs/${cid}`;
    }

    /**
     * Fetch metadata from IPFS
     */
    async fetchMetadata(cid) {
        try {
            const url = this.getGatewayURL(cid);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch metadata from IPFS');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching IPFS metadata:', error);
            throw error;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IPFSUploader;
}
