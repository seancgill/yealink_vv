const { Builder } = require('xml2js');

// Function to create Yealink-compatible XML for folder selection
exports.createFolderMenuXML = (host, user_id, domain) => {
    const builder = new Builder({ headless: false });

    const xmlObject = {
        YealinkIPPhoneTextMenu: { // Use YealinkIPPhoneTextMenu instead of YealinkIPPhoneMenu
            Title: "Select Voicemail Folder",
            MenuItem: [
                { Prompt: "New Voicemails", URI: `http://${host}/yealink_vv?user_id=${user_id}&domain=${domain}&folder=new` },
                { Prompt: "Saved Voicemails", URI: `http://${host}/yealink_vv?user_id=${user_id}&domain=${domain}&folder=saved` },
                { Prompt: "Trash Voicemails", URI: `http://${host}/yealink_vv?user_id=${user_id}&domain=${domain}&folder=trash` }
            ]
        }
    };

    // Manually add the XML declaration
    const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
    const xmlContent = builder.buildObject(xmlObject);

    // Return the complete XML response
    return xmlDeclaration + '\n' + xmlContent;
};

// Function to create Yealink-compatible XML for the voicemail list
exports.createYealinkXML = (voicemails) => {
    const builder = new Builder({ headless: false });

    const xmlObject = {
        YealinkIPPhoneTextMenu: { // Use YealinkIPPhoneTextMenu
            Title: "Voicemail List",
            MenuItem: voicemails.map((vm, index) => ({
                Prompt: `${index + 1}. ${vm.voicemail_from_name || vm.voicemail_from_caller_id_number || 'Unknown Caller'}`,
                URI: vm["file-access-url "].trim() // Make sure to use the correct URL to play the voicemail
            }))
        }
    };

    const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
    const xmlContent = builder.buildObject(xmlObject);

    return xmlDeclaration + '\n' + xmlContent;
};
