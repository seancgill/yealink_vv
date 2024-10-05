const express = require('express');
const router = express.Router();
const netsapiensService = require('../services/netsapiensService');
const xmlBuilder = require('../utils/xmlBuilder');
const fs = require('fs');
const path = require('path');

// Corrected log file path
const logFilePath = path.join(__dirname, '../../logs/app.log');

// Function to log messages to app.log
function logToAppLog(message) {
    const timestamp = new Date().toISOString();
    fs.appendFile(logFilePath, `${timestamp} - ${message}\n`, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

// Route to handle requests from Yealink phones
router.get('/yealink_vv', async (req, res) => {
    logToAppLog('Received query parameters: ' + JSON.stringify(req.query));

    const { user_id, domain, folder } = req.query;

    // Validate query parameters
    if (!user_id || !domain) {
        logToAppLog('Missing user_id or domain parameter');
        return res.status(400).send('Missing user_id or domain parameter');
    }

    try {
        if (!folder) {
            logToAppLog('No folder specified, returning folder selection menu.');
            const folderMenuXML = xmlBuilder.createFolderMenuXML(req.headers.host, user_id, domain);
            res.set('Content-Type', 'application/xml; charset=utf-8'); // Set proper content type with charset

            logToAppLog('Sending folder menu XML: ' + folderMenuXML);

            return res.send(folderMenuXML);
        }

        logToAppLog(`Fetching voicemails for folder: ${folder}`);
        const voicemails = await netsapiensService.fetchVoicemails(user_id, domain, folder);

        logToAppLog(`Found ${voicemails.length} voicemails in folder: ${folder}`);

        if (voicemails.length === 0) {
            logToAppLog(`No voicemails found in folder: ${folder}`);
            return res.status(404).send(`No voicemails found in the ${folder} folder`);
        }

        const voicemailListXML = xmlBuilder.createYealinkXML(voicemails);
        res.set('Content-Type', 'application/xml; charset=utf-8'); // Set proper content type with charset

        logToAppLog('Sending voicemail list XML: ' + voicemailListXML);

        res.send(voicemailListXML);
    } catch (error) {
        logToAppLog(`Error fetching voicemails for user ${user_id} in domain ${domain}, folder ${folder}: ${error}`);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
