(function () {
    'use strict';

    const REFRESH_INTERVAL = 5000;
    const TABLE = $('table.results');
    const THROBBER = $(
        '<div class="sk-three-bounce satoriEnhancementsSpinner">' +
        '<div class="sk-child sk-bounce1"></div>' +
        '<div class="sk-child sk-bounce2"></div>' +
        '<div class="sk-child sk-bounce3"></div>' +
        '</div>'
    );

    let tr = TABLE.find('tbody > tr:last');
    let submitID = tr.find('td:first').text();
    let problemCode = tr.find('td:nth-child(3)').text();
    let problemStatus = tr.find('td:last').text();

    let url = document.location.href;

    /**
     * Parse given HTML and return problem status code if it's found.
     *
     * @param {string} html HTML to parse
     * @returns {string|undefined} status code or undefined if it wasn't found
     */
    function parseStatusHTML(html) {
        for (let x of $.parseHTML(html)) {
            let statusTd = $(x).find('table.results tr:last > td:last');
            if (statusTd.length) {
                return statusTd.text();
            }
        }
    }

    /**
     * Make an AJAX request to the submit results page and check if the status
     * is still QUE. If not, display a notification and reload the page.
     */
    function checkStatus() {
        $.ajax({
            type: 'GET',
            url: url,
            success: function (html) {
                let status = parseStatusHTML(html);
                if (typeof status != 'undefined' && status !== 'QUE') {
                    browser.runtime.sendMessage({
                        action: 'displayStatusNotification',
                        submitID: submitID,
                        problemCode: problemCode,
                        problemStatus: status
                    });
                    location.reload();
                } else {
                    setTimeout(checkStatus, REFRESH_INTERVAL);
                }
            },
            error: function () {
                setTimeout(checkStatus, REFRESH_INTERVAL);
            }
        });
    }

    if (problemStatus === 'QUE') {
        tr.find('td:last').append(THROBBER);
        setTimeout(checkStatus, REFRESH_INTERVAL);
    }
})();
