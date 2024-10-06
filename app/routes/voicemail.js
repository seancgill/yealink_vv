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

    // Store user_id and domain in session if they are present
    if (req.query.user_id) {
        req.session.user_id = req.query.user_id;
    }
    if (req.query.domain) {
        req.session.domain = req.query.domain;
    }

    // Retrieve user_id and domain from session if they are not provided in the query
    const user_id = req.query.user_id || req.session.user_id;
    const domain = req.query.domain || req.session.domain;
    const { folder } = req.query;

    // Validate user_id and domain
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

        // Pass session variables to the XML builder
        const voicemailListXML = xmlBuilder.createYealinkXML(voicemails, req.session.user_id, req.session.domain);
        res.set('Content-Type', 'application/xml; charset=utf-8'); // Set proper content type with charset

        logToAppLog('Sending voicemail list XML: ' + voicemailListXML);
        res.send(voicemailListXML);
    } catch (error) {
        logToAppLog(`Error fetching voicemails for user ${user_id} in domain ${domain}, folder ${folder}: ${error}`);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/yealink_vv/voicemail_detail', async (req, res) => {
    try {
        logToAppLog('Received request for voicemail detail with query parameters: ' + JSON.stringify(req.query));
        const { user_id, domain, file } = req.query;

        // Validate the presence of user_id, domain, and file
        if (!user_id || !domain || !file) {
            logToAppLog('Missing user_id, domain, or file parameter');
            return res.status(400).send('Missing user_id, domain, or file parameter');
        }

        // Fetch voicemail details
        const voicemail = await netsapiensService.fetchVoicemailDetail(user_id, domain, file);

        if (!voicemail) {
            logToAppLog(`Voicemail not found for file: ${file}`);
            return res.status(404).send('Voicemail not found');
        }

        // Log voicemail details
        logToAppLog(`Fetched voicemail details: ${JSON.stringify(voicemail)}`);

        // Send the voicemail detail XML
        const voicemailDetailXML = xmlBuilder.createVoicemailDetailXML(voicemail);
        res.set('Content-Type', 'application/xml; charset=utf-8');
        
        // Log the XML being sent
        logToAppLog('Sending voicemail detail XML: ' + voicemailDetailXML);

        return res.send(voicemailDetailXML);
    } catch (error) {
        // Log the error details
        logToAppLog('Error occurred: ' + error.stack || error);
        return res.status(500).send('Internal Server Error');
    }
});

module.exports = router;




/* // Route to play voicemail
router.get('/yealink_vv/play_voicemail', (req, res) => {
    const { user_id, domain, folder, filename } = req.query;

    if (!user_id || !domain || !folder || !filename) {
        return res.status(400).send('Missing parameters');
    }

    // Redirect the user to the URL that plays the voicemail
    res.redirect(`https://sgdemo-core-031-mci.sgdemo.ucaas.run/ns-api/?object=audio&action=play&domain=${domain}&user=${user_id}&type=vmail&file=${filename}`);
});

// Route to delete voicemail
router.get('/yealink_vv/delete_voicemail', async (req, res) => {
    const { user_id, domain, folder, filename } = req.query;

    if (!user_id || !domain || !folder || !filename) {
        return res.status(400).send('Missing parameters');
    }

    try {
        const deleteUrl = `https://sgdemo-core-031-mci.sgdemo.ucaas.run/ns-api/v2/domains/${domain}/users/${user_id}/voicemails/${folder}/${filename}`;

        // Send DELETE request to the NetSapiens API to delete the voicemail
        const deleteResponse = await netsapiensService.deleteVoicemail(deleteUrl);

        if (deleteResponse.code === 202) {
            res.status(202).send('Voicemail deleted successfully');
        } else {
            res.status(500).send('Failed to delete voicemail');
        }
    } catch (error) {
        res.status(500).send('Error deleting voicemail');
    }
});

// New route for the Options Menu
router.get('/options-menu', async (req, res) => {
    const { voicemail, folder, user_id, domain } = req.query;

    const optionsMenuXML = xmlBuilder.createOptionsMenuXML(voicemail, folder, user_id, domain);
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(optionsMenuXML);
});

// New route for Voicemail Actions screen
router.get('/voicemail-actions', async (req, res) => {
    const { voicemail, folder, user_id, domain } = req.query;

    const voicemailDetailsXML = xmlBuilder.createVoicemailDetailsXML(voicemail, folder, user_id, domain);
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(voicemailDetailsXML);
});

// New route for Delete Confirmation
router.get('/delete-confirmation', async (req, res) => {
    const { voicemail, folder, user_id, domain } = req.query;

    const deleteConfirmationXML = xmlBuilder.createDeleteConfirmationXML(voicemail, folder, user_id, domain);
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(deleteConfirmationXML);
});

module.exports = router; */
