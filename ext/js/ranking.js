(function () {
    'use strict';

    const NUMBER_REGEX = /-?(\d+\.?\d+|\d*\.?\d+)/;
    const TABLE_FOOTER_LABELS = ['Rank', 'Name', 'Score'];

    // Table height is calculated as viewport height - this value
    const PAGE_CONTENT_HEIGHT = 165;
    const MIN_TABLE_HEIGHT = 250;

    let table = $('div.ranking table');

    // Check if there's a ranking footer inside <tbody> by checking if the last
    // table row has specific labels
    let footerLabels = $.map(table.find('tbody > tr:last > td'), (elem) =>
        $(elem).text(),
    );
    if (TABLE_FOOTER_LABELS.every((x) => footerLabels.indexOf(x) !== -1)) {
        // ...if so, create a <tfoot>
        let tr = table.find('tr:last');
        let tfoot = $('<tfoot/>').append(tr.clone());
        // Don't remove the last row as some custom CSS stylesheets expect it
        // to be there (like: "don't include person number in the last row")
        tr.hide();
        table.append(tfoot);
    }

    // Move "Total" line, if present (indicated by <strong>), to
    // newly-created <tfoot>
    const footer = $('tbody tr td:first-child strong', table)
        .parents('tr')
        .remove();
    table.append($('<tfoot>').append(footer));

    // Remove colgroup as it messes with FixedColumns on Firefox, doesn't change
    // the table behavior very much and is obsolete since HTML5
    $('colgroup', table).remove();

    // Add data-order attributes to provide valid sorting data for DataTable
    function findPointNumber(text) {
        // console.log(text);
        if (text === '-') {
            // Treat "-" as the lowest possible number of points
            return -Infinity;
        }
        let num = text.match(NUMBER_REGEX);
        if (!num || num.length === 0 || isNaN(parseFloat(num[0]))) {
            return null;
        }

        let maxNumberPos = text.indexOf('(' + num[0] + ')');
        if (
            maxNumberPos !== -1 &&
            // Don't match "0.00 (1.00)"
            maxNumberPos + 1 === text.indexOf(num[0])
        ) {
            // e.g. "(1.0)" - indicates number of points granted for solving
            // problem (but not the actual number of points one has got)
            return parseFloat(num[0]) - 1000;
        }
        return parseFloat(num[0]);
    }

    $.each($('div.ranking table tbody td'), function (index, node) {
        let val = findPointNumber($(node).text());
        if (val !== null) {
            // We're using negative value to reverse the default sorting order
            $(node).attr('data-order', -val);
        }
    });

    // Initialize DataTable
    const columnDefs = [];
    const nameColIndex = $('thead th:contains("Name")', table).index();
    columnDefs.push({
        // Ensure "Name" column can be properly filtered with diacritics
        type: 'string',
        targets: nameColIndex,
    });

    $.fn.dataTable.ext.order.intl('pl');
    let dt = table.DataTable({
        dom: 'i<"#table-search-container">t',
        scrollY:
            Math.max(
                $(window).height() - PAGE_CONTENT_HEIGHT,
                MIN_TABLE_HEIGHT,
            ) + 'px',
        scrollX: true,

        columnDefs: columnDefs,

        scrollCollapse: true,
        paging: false,
        fixedColumns: {
            leftColumns: 2,
            heightMatch: 'auto',
        },
    });
    let dtElem = $('.dataTables_wrapper');
    $('#table-search-container').append(
        $('<input type="search" id="table-search-input" placeholder="Search">'),
    );

    // Highlight on hover (not using :hover in CSS because we have two tables
    // - main one and the left hand one with fixed column)
    $('tbody', dtElem).on('mouseenter', 'tr', function () {
        const trIndex = $(this).index();
        $('tbody', dtElem).find(`tr:eq(${trIndex})`).addClass('highlight');
    });
    $('tbody', dtElem).on('mouseleave', 'tr', function () {
        const trIndex = $(this).index();
        $('tbody', dtElem).find(`tr:eq(${trIndex})`).removeClass('highlight');
    });

    // Remove accented characters from search input
    $('#table-search-input').on('input', function () {
        dt.search($.fn.DataTable.ext.type.search.string(this.value)).draw();
    });
})();
