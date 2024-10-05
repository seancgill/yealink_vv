const axios = require('axios');
const config = require('../../config/default'); // Ensure that the Bearer token is in your config file

// Function to fetch voicemails from Netsapiens API for a specific folder
exports.fetchVoicemails = async (user_id, domain, folder = 'new') => {
    const url = `https://sgdemo-core-031-mci.sgdemo.ucaas.run/ns-api/v2/domains/${domain}/users/${user_id}/voicemails/${folder}`;

    // Define headers, including the Bearer token
    const headers = {
        'accept': 'application/json',
        'authorization': `Bearer ${config.apiToken}`, // Make sure your token is stored in config
    };

    try {
        // Send the GET request to the Netsapiens API
        const response = await axios.get(url, { headers });

        // Log and return the response data
        console.log('Netsapiens API response:', response.data);
        return response.data;
    } catch (error) {
        // Log and return an empty array if there's an error
        console.error('Error fetching voicemail data from Netsapiens API:', error);
        return [];
    }
};
