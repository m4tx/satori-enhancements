(function () {
    'use strict';

    const NUMBER_REGEX = /-?(\d+\.?\d+|\d*\.?\d+)/;
    const TABLE_FOOTER_LABELS = ["Rank", "Name", "Score"];

    let table = $('div.ranking table');

    // Check if there's a ranking footer inside <tbody> by checking if the last
    // table row has specific labels
    let footerLabels = $.map(
        table.find('tbody > tr:last > td'),
        elem => $(elem).text()
    );
    if (TABLE_FOOTER_LABELS.every(x => footerLabels.indexOf(x) !== -1)) {
        // ...if so, create a <tfoot>
        let tr = table.find('tr:last').detach();
        let tfoot = $('<tfoot/>').append(tr);
        table.append(tfoot);
    }

    table.tableHeadFixer({
        left: 2
    }).tablesorter({
        textExtraction: function (node) {
            // Try to find a number
            let text = $(node).text();
            let num = text.match(NUMBER_REGEX);
            if (!num || num.length === 0 || isNaN(parseFloat(num[0]))) {
                return text;
            }
            if (text.indexOf('(' + num[0] + ')') !== -1) {
                // e.g. "(1.0)" - indicates number of points granted for solving
                // problem (but not the actual number of points one has got)
                return (parseFloat(num[0]) - 1000).toString();
            }
            return num[0];
        }
    });
})();
