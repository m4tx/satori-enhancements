(function () {
    'use strict';

    const NUMBER_REGEX = /-?(\d+\.?\d+|\d*\.?\d+)/;

    $('div.ranking table').tableHeadFixer({
        left: 2
    }).tablesorter({
        textExtraction: function (node) {
            // Try to find a number
            let text = $(node).text();
            let num = text.match(NUMBER_REGEX);
            if (!num || num.length === 0 || isNaN(parseFloat(num[0]))) {
                return text;
            }
            return num[0];
        }
    });
})();
