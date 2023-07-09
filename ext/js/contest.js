(function () {
    'use strict';

    async function addContestChangeDialog() {
        const contestList = await browser.runtime.sendMessage({
            action: 'getJoinedContestList',
        });
        if (contestList.length === 0) return;

        const link = $('#header a[href="/contest/select"]');
        const table = $('<table class="results" />');

        contestList.forEach(({ name, href }) => {
            const row = $('<tr><td><a class="stdlink" /></td></tr>');
            row.find('a')
                .text(name)
                .attr('href', href);
            table.append(row);
        });

        const lastRow = $('<tr><td class="centered"><a class="stdlink">See all contests</a></td></tr>');
        lastRow.find('a').attr('href', '/contest/select');
        table.append(lastRow);

        const dialog = $(
            '<dialog id="contest-select-dialog">' +
            '   <h3>Select contest</h3>' +
            '</dialog>'
        )
            .append(table)
            .insertAfter(link);

        $(document).on('pointerdown', function (e) {
            if ($(e.target).closest(dialog).length === 0) dialog[0].close();
        });

        link.on('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            dialog[0].show();
        });
    }

    browser.runtime.sendMessage({action: 'saveLastContestID'});

    addContestChangeDialog().catch(console.error);
})();
