(function () {
    'use strict';

    const { contestID, problemID } = getContestAndProblemID(document.location.href);
    const resultsUrl = `${SATORI_URL_HTTPS}contest/${contestID}/results?results_filter_problem=${problemID}`;
    $('<a class="button">Results</a>')
        .attr('href', resultsUrl)
        .appendTo('#content > .buttton_bar');

    function parseResultsPage(html) {
        for (const x of $.parseHTML(html)) {
            const content = $(x).find('#content');
            if (content.length > 0) return content;
        }
    }

    async function loadResults() {
        const response = await fetch(`${resultsUrl}&results_limit=20`);
        if (!response.ok) throw Error(`Results request failed with HTTP status code ${response.status}`);
        const content = parseResultsPage(await response.text());
        const table = content.find('> table.results');
        if (!table) return;
        table.find('td:nth-child(2), th:nth-child(2)').remove();

        if (table.find('tr:not(:first-child)').length === 0) {
            $('<tr><td colspan="3" class="centered">No submissions yet</td></tr>')
                .appendTo(table);
        }

        // Page selector has more than one page - show link to see all submissions
        if (content.find('> .wheel > a.wheelitem').length > 0) {
            const row = $('<tr><td colspan="3" class="centered"><a class="stdlink">See more submissions</a></td></tr>');
            row.find('a').attr('href', resultsUrl);
            table.append(row);
        }

        $(
            '<div id="results-sidebar">' +
            '   <h3>Recent submission results</h3>' +
            '</div>'
        )
            .append(table)
            .insertAfter('#content');
    }

    loadResults().catch((error) => {
        console.error('Failed to load recent submissions', error);
    });
})();
