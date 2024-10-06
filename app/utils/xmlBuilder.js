const { Builder } = require('xml2js');
const { formatDate } = require('../helpers/dateHelper');


// Function to create Yealink-compatible XML for folder selection
exports.createFolderMenuXML = (host, user_id, domain) => {
    const builder = new Builder({ headless: false }); // Let the builder handle the XML declaration

    const xmlObject = {
        YealinkIPPhoneTextMenu: {
            Title: "Select Voicemail Folder",
            MenuItem: [
                { Prompt: "New Voicemails", URI: `http://${host}/yealink_vv?user_id=${user_id}&domain=${domain}&folder=new` },
                { Prompt: "Saved Voicemails", URI: `http://${host}/yealink_vv?user_id=${user_id}&domain=${domain}&folder=saved` },
                { Prompt: "Trash Voicemails", URI: `http://${host}/yealink_vv?user_id=${user_id}&domain=${domain}&folder=trash` }
            ]
        }
    };

    // The builder will automatically add the XML declaration, so we don't need to add it manually
    return builder.buildObject(xmlObject);
};


// Function to create Yealink-compatible XML for the voicemail list
exports.createYealinkXML = (voicemails, user_id, domain) => {
    // Log that the function was hit
    console.log(voicemails + 'createYealinkXML')
    const builder = new Builder({ headless: false });

    const xmlObject = {
        YealinkIPPhoneTextMenu: {
            Title: "Voicemail List",
            MenuItem: voicemails.map((vm, index) => ({
                Prompt: `${index + 1}. ${vm['voicemail-from-name']} (${vm['voicemail-from-caller-id-number']}) - ${formatDate(vm['created-datetime'])}`,
                // Use session variables for user_id and domain in the URI
                URI: `http://192.168.1.157:5000/yealink_vv/voicemail_detail?user_id=${user_id}&domain=${domain}&file=${vm.filename}`
            }))
        }
    };

    return builder.buildObject(xmlObject);
};



// Options Menu
exports.createOptionsMenuXML = (voicemail, folder, user_id, domain) => {
    const builder = new Builder({ headless: false });

    const xmlObject = {
        YealinkIPPhoneTextMenu: {
            Title: "Options",
            MenuItem: [
                { Prompt: "Mark as New", URI: `https://server/ns-api/v2/domains/${domain}/users/${user_id}/voicemails/${folder}/${voicemail}/mark-new` },
                { Prompt: "Forward as Voicemail", URI: `https://server/ns-api/v2/domains/${domain}/users/${user_id}/voicemails/${folder}/${voicemail}/forward` },
                { Prompt: "Add to Contacts", URI: `https://server/add-to-contacts?caller=${voicemail.voicemail_from_caller_id_number}` },
                { Prompt: "Delete", URI: `https://server/ns-api/v2/domains/${domain}/users/${user_id}/voicemails/${folder}/${voicemail}/delete` }
            ]
        }
    };

    return builder.buildObject(xmlObject);
};

// Function to create Yealink-compatible XML for voicemail details with play and delete options
// Function to create Yealink-compatible XML for voicemail details with play, stop, and delete options
exports.createVoicemailDetailXML = (voicemail) => {
    const builder = new Builder({ headless: false });

    const xmlObject = {
        YealinkIPPhoneFormattedTextScreen: {
            $: {
                doneAction: voicemail['file-access-url '].trim(),
                Beep: "no",
                Timeout: "0",
                LockIn: "no"
            },
            Line: [
                {
                    _: `Voicemail from: ${voicemail['voicemail-from-name']} (${voicemail['voicemail-from-caller-id-number']})`,
                    $: { Size: "normal", Align: "left", Color: "black" }
                },
                {
                    _: `Received: ${formatDate(voicemail['created-datetime'])}`,
                    $: { Size: "normal", Align: "left", Color: "black" }
                }
            ],
            Scroll: {
                Line: [
                    {
                        _: `Duration: ${voicemail['file-duration-seconds']} seconds`,
                        $: { Size: "normal", Align: "left", Color: "black" }
                    }
                ]
            },
            SoftKey: [
                {
                    $: { index: "1" },
                    Label: "Play",
                    URI: `http://192.168.1.157:5000/yealink_vv/execute_play?url=${voicemail['file-access-url '].trim()}`
                },
                {
                    $: { index: "2" },
                    Label: "Stop",
                    URI: "http://192.168.1.157:5000/yealink_vv/execute_stop" // Adjust the route to handle stop functionality
                },
                {
                    $: { index: "3" },
                    Label: "Delete",
                    URI: `http://192.168.1.157:5000/yealink_vv/delete_voicemail?user_id=${voicemail['voicemail-from-user']}&domain=${voicemail['voicemail-from-host']}&file=${voicemail.filename}`
                }
            ]
        }
    };

    return builder.buildObject(xmlObject);
};


// Function to create the XML for executing the play command
exports.createExecutePlayXML = (url) => {
    const builder = new Builder({ headless: false });

    const xmlObject = {
        YealinkIPPhoneExecute: {
            $: { Beep: "no" },
            ExecuteItem: [
                { URI: `Wav.Play:${url}` }
            ]
        }
    };

    return builder.buildObject(xmlObject);
};


// Function to create the XML for executing the stop command
exports.createExecuteStopXML = () => {
    const builder = new Builder({ headless: false });

    const xmlObject = {
        YealinkIPPhoneExecute: {
            $: { Beep: "no" },
            ExecuteItem: [
                { URI: "Wav.Stop" }
            ]
        }
    };

    return builder.buildObject(xmlObject);
};







// Delete Confirmation Screen
exports.createDeleteConfirmationXML = (voicemail, folder, user_id, domain) => {
    const builder = new Builder({ headless: false });

    const xmlObject = {
        YealinkIPPhoneTextScreen: {
            Title: "Delete Voicemail?",
            Text: "Are you sure you want to delete this voicemail?",
            SoftKey: [
                { Label: "OK", URI: `https://server/ns-api/v2/domains/${domain}/users/${user_id}/voicemails/${folder}/${voicemail}/delete` },
                { Label: "Cancel", URI: `https://server/ns-api/v2/domains/${domain}/users/${user_id}/voicemails/${folder}` }
            ]
        }
    };

    return builder.buildObject(xmlObject);
};

// Function to create a menu for voicemail actions (Play/Delete)
exports.createVoicemailActionsMenuXML = (host, user_id, domain, folder, filename) => {
    const builder = new Builder({ headless: false });

    const xmlObject = {
        YealinkIPPhoneTextMenu: {
            Title: "Voicemail Options",
            MenuItem: [
                {
                    Prompt: "Play Voicemail",
                    URI: `http://${host}/yealink_vv/play_voicemail?user_id=${user_id}&domain=${domain}&folder=${folder}&filename=${filename}`
                },
                {
                    Prompt: "Delete Voicemail",
                    URI: `http://${host}/yealink_vv/delete_voicemail?user_id=${user_id}&domain=${domain}&folder=${folder}&filename=${filename}`
                }
            ]
        }
    };

    return builder.buildObject(xmlObject);
};