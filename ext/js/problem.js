(function () {
    'use strict';

    const { contestID, problemID } = getContestAndProblemID(document.location.href);
    $('<a class="button">Results</a>')
        .attr('href', `${SATORI_URL_HTTPS}contest/${contestID}/results?results_filter_problem=${problemID}`)
        .appendTo('#content > .buttton_bar')
})();
