// dateHelper.js

const formatDate = (isoDateString) => {
    const date = new Date(isoDateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });
};

module.exports = { formatDate };
