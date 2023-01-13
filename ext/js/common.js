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

function updateProblemList(column) {
    browser.runtime.sendMessage({
        action: 'getContestProblemList',
        contestID: getContestID(document.location.href),
    }).then((problems) => {
        console.log(getContestID(document.location.href), problems);
        for (const el of $(`table.results > tbody > tr:not(:first-of-type) > td:nth-child(${column})`)) {
            const code = $(el).text();
            const problem = problems[code];
            if (!problem) continue;
            const link = $('<a class="stdlink"></a>');
            link.attr('href', problem.href);
            link.text(`${code} - ${problem.title}`)
            $(el).empty().append(link);
        }
    });
}
