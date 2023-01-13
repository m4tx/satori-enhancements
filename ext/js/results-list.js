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

    insertProblemLinks(true);
})();
