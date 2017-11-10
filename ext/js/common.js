/**
 * Parse given URL and return the contest ID.
 * @param {string} url URL to parse
 * @returns {string} contest ID
 */
function getContestID(url) {
    return PROBLEM_URL_REGEX.exec(url)[1];
}

if (typeof module !== 'undefined') {
    module.exports = {
        getContestID
    };
}
