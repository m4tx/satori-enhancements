(function () {
    'use strict';

    const contestID = getContestID(document.location.href);

    function addCompareSubmitsButton() {
        const problemID = new URLSearchParams(document.location.search).get('results_filter_problem');
        if (!problemID || !/^\d+$/.test(problemID)) {
            return;
        }
        $(`<a class="button">Submit another</a>`)
            .attr('href', `${SATORI_URL_HTTPS}contest/${contestID}/submit?select=${problemID}`)
            .appendTo('#content .button_bar');
    }

    addCompareSubmitsButton();
    insertProblemLinks(true);
})();
