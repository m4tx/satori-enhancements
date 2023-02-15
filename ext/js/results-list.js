(function () {
    'use strict';

    browser.runtime.sendMessage({
        action: 'shouldRedirectToSubmit',
    }).then(shouldRedirect => {
        if (shouldRedirect) {
            document.location = $('div#content table.results tbody > ' +
                'tr:nth-child(2) > td:first > a').attr('href');
        }
    });

    const contestID = getContestID(document.location.href);

    function addCompareSubmitsButton() {
        const problemID = new URLSearchParams(document.location.search).get('results_filter_problem');
        if (!problemID || !/^\d+$/.test(problemID)) {
            return;
        }
        $(`<a class="button">Submit another</a>`)
            .attr('href', `${SATORI_URL_HTTPS}contest/${contestID}/submit?select=${problemID}`)
            .appendTo('#content .button_bar')
    }

    addCompareSubmitsButton();
    insertProblemLinks(true);
})();
