(function () {
    'use strict';

    function storeContestList() {
        const table = $('#content h3:contains("Joined contests:")').next(
            'table.results',
        );
        if (table.length === 0) {
            return;
        }
        const rows = table
            .find('tr:not(:first-child)')
            .map((index, el) => {
                const link = $(el).find('td:nth-child(1) .stdlink');
                return {
                    href: link.attr('href'),
                    name: link.text(),
                    description: $(el).find('td:nth-child(2)').text(),
                };
            })
            .toArray();
        browser.runtime.sendMessage({
            action: 'setJoinedContestList',
            contestList: rows,
        });
    }

    storeContestList();
})();
