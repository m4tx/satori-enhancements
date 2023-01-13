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

function updateProblemList(isResultList) {
    const column = isResultList ? 2 : 3;
    browser.runtime.sendMessage({
        action: 'getContestProblemList',
        contestID: getContestID(document.location.href),
    }).then((problems) => {
        for (const el of $(`table.results > tbody > tr:not(:first-of-type) > td:nth-child(${column})`)) {
            const code = $(el).text();
            const problem = problems[code];
            if (!problem) continue;
            const statementHref = problem.href || problem.pdfHref;
            if (!statementHref) {
                $(el).text(`${code} - ${problem.title}`);
                return;
            }
            const link = $('<a class="stdlink"></a>');
            link.attr('href', statementHref);
            link.text(`${code} - ${problem.title}`);
            $(el).empty().append(link);
        }
    });
}
