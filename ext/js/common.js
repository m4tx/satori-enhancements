/**
 * Parse given URL and return the contest ID.
 * @param {string} url URL to parse
 * @returns {string} contest ID
 */
function getContestID(url) {
    return CONTEST_URL_REGEX.exec(url)[1];
}

/**
 * Parse given problem URL and return the contest and problem ID.
 * @param {string} url URL to parse
 * @returns {object} contest and problem ID
 */
function getContestAndProblemID(url) {
    const match = PROBLEM_URL_REGEX.exec(url);
    return {
        contestID: match[1],
        problemID: match[2],
    }
}

if (typeof module !== 'undefined') {
    module.exports = {
        getContestID,
        getContestAndProblemID,
    };
}

function parseProblemList(jqueryHandles) {
    return Object.fromEntries(jqueryHandles.flatMap(
        (el) => [...$(el).find('#content table.results tr:not(:first-of-type)')].map(
            (tr) => [
                $(tr).find('td:nth-child(1)').text(),
                {
                    title: $(tr).find('td:nth-child(2)').text(),
                    href: $(tr).find('td:nth-child(2) a').attr('href'),
                    pdfHref: $(tr).find('td:nth-child(3) a').attr('href'),
                    submitHref: $(tr).find('td:nth-child(5) a').attr('href'),
                }
            ]
        ))
    );
}

async function insertProblemLinks(isResultList) {
    const column = isResultList ? 2 : 3;
    const problems = await browser.runtime.sendMessage({
        action: 'getContestProblemList',
        contestID: getContestID(document.location.href),
    });

    let submitHref;
    for (const el of $(`table.results > tbody > tr:not(:first-of-type) > td:nth-child(${column})`)) {
        const code = $(el).text();
        const problem = problems[code];
        if (!problem) {
            continue;
        }
        if (problem.submitHref) {
            submitHref = problem.submitHref;
        }
        const statementHref = problem.href || problem.pdfHref;
        if (!statementHref) {
            $(el).text(`${code} - ${problem.title}`);
            continue;
        }
        const link = $('<a class="stdlink"></a>');
        link.attr('href', statementHref);
        link.text(`${code} - ${problem.title}`);
        $(el).empty().append(link);
    }
    return submitHref;
}
