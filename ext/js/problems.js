(function () {
    'use strict';

    /**
     * Set up "Hide problem" feature to given problem group.
     * @param {jQuery} problemTable problem table element
     */
    function processProblemGroup(problemTable) {
        /**
         * @type {HiddenProblemsController}
         */
        let hiddenProblemsController;
        /**
         * List of hidden problem table rows.
         * @type {Array}
         */
        let hiddenProblemTrs = [];

        /**
         * Element added as top table row that contains "n problem hidden" text
         * as well as "hide" / "unhide" link that allow to quickly reveal
         * or hide problems marked as hidden.
         */
        class HiddenProblemsController {
            /**
             * @param toggleHiddenCallback function that should be called when
             *  "hide" / "unhide" link is clicked
             */
            constructor(toggleHiddenCallback) {
                this.toggleProblemsHiddenCallback = toggleHiddenCallback;
                // true if "unhide" link wasn't clicked yet
                this._problemsHidden = true;

                // Create HTML
                this.hiddenProblemsNumEl = $('<span/>');
                this.showLink = $('<a class="stdlink"/>')
                    .click(this._toggleProblemsHidden.bind(this));
                this.textSpan = $('<span/>');
                this.td = $('<td colspan="7" ' +
                    'class="satoriEnhancementsProblemHide"/>')
                    .append(this.hiddenProblemsNumEl)
                    .append(this.textSpan)
                    .append(this.showLink);
                this.tr = $('<tr/>')
                    .append(this.td);

                // Update text contents
                this.updateHiddenProblemsNum();
                this._updateTexts();
            }

            /**
             * @returns {boolean} whether or not the problems are currently
             *  hidden
             */
            get problemsHidden() {
                return this._problemsHidden;
            }

            /**
             * @returns {jQuery} jQuery element with a table row that is
             *  supposed to be added to the problem table.
             */
            get element() {
                return this.tr;
            }

            /**
             * Update the displayed number of hidden problems. Also, hide
             * the table row if there are no hidden problems.
             * @param {number} problemsNum updated number of hidden problems
             */
            updateHiddenProblemsNum(problemsNum) {
                this.hiddenProblemsNumEl.text(problemsNum);
                setTrVisibility(this.tr, problemsNum !== 0);
            }

            /**
             * Update displayed texts after toggling problems (clicking
             * "unhide" / "can be hidden").
             * @see _toggleProblemsHidden
             * @private
             */
            _updateTexts() {
                this.textSpan.text(
                    this._problemsHidden ? " problems hidden, " : " problems ");
                this.showLink.text(
                    this._problemsHidden ? "unhide" : "can be hidden");
            }

            /**
             * Toggle whether the problems marked as hidden are displayed
             * temporarily. This function calls toggleProblemsHiddenCallback.
             * @private
             */
            _toggleProblemsHidden() {
                this._problemsHidden = !this._problemsHidden;
                this._updateTexts();
                this.toggleProblemsHiddenCallback();
            }
        }

        function setTrVisibility(tr, visible) {
            tr.toggleClass('satori-enhancements-collapsed', !visible);
        }

        /**
         * Toggle whether given problem is hidden and call modifyContestItemList
         * in the background page to save that information.
         * @param {jQuery} tr table row element to toggle
         * @param {boolean} initial if true, then the function only applies
         *  loaded data (so it does not toggle problem visibility, but rather
         *  hides it if it is already marked). Also, does not call
         *  modifyContestItemList.
         */
        function toggleProblemHidden(tr, initial = false) {
            let elem = tr.get(0);
            let hide = hiddenProblemTrs.indexOf(elem) === -1;
            if (initial) {
                hide = !hide;
            } else {
                if (hide) {
                    hiddenProblemTrs.push(elem);
                } else {
                    hiddenProblemTrs.splice(hiddenProblemTrs.indexOf(elem), 1);
                }
            }
            if (hide && hiddenProblemsController.problemsHidden) {
                setTrVisibility(tr, false);
            }
            tr.find('td > a.satori_enhancements_hide_btn')
                .text(hide ? "Show" : "Hide");

            hiddenProblemsController
                .updateHiddenProblemsNum(hiddenProblemTrs.length);

            if (!initial) {
                browser.runtime.sendMessage({
                    action: 'modifyContestItemList',
                    listName: 'hiddenProblems',
                    value: tr.find('td').first().text(),
                    add: hide
                });
            }
        }

        /**
         * Hide/unhide problems stored in hiddenProblemTrs list.
         *
         * Called when "hide" / "unhide" link is clicked.
         */
        function toggleProblemsHidden() {
            for (let tr of hiddenProblemTrs) {
                setTrVisibility($(tr), !hiddenProblemsController.problemsHidden);
            }
            updateEvenTrs();
        }

        /**
         * Add 'odd' and 'even' classes to table rows
         *
         * It's necessary since we only hide the rows and do not remove them,
         * thus nth-child fails on matching visible rows (and :nth-match is
         * not yet supported in any browser).
         */
        function updateEvenTrs() {
            problemTable
                .find('tbody > tr:not(.satori-enhancements-collapsed):gt(0)')
                .each((index, element) => {
                    $(element)
                        .toggleClass('satoriEnhancementsOdd', index % 2 === 1)
                        .toggleClass('satoriEnhancementsEven', index % 2 === 0);
                });
        }

        problemTable.find('tbody > tr:first').find('th').last().before('<th/>');

        browser.runtime.sendMessage({
            action: 'getContestItemList',
            listName: 'hiddenProblems'
        }).then(function (response) {
            hiddenProblemsController =
                new HiddenProblemsController(toggleProblemsHidden);

            // Add "Hide" button to each table row
            problemTable
                .find('tbody > tr > td:nth-child(1)')
                .each(function () {
                    if (response.indexOf($(this).text()) !== -1) {
                        hiddenProblemTrs.push($(this).parent().get(0));
                    }

                    let btn = $(
                        '<a class="button button_small ' +
                        'satori_enhancements_hide_btn"/>');
                    btn.click(() => {
                        toggleProblemHidden($(this).parent());
                        updateEvenTrs();
                    });
                    let td = $('<td class="centered small"/>').append(btn);

                    $(this).parent().find('td:last').before(td);
                    toggleProblemHidden($(this).parent(), true);
                });

            problemTable
                .find('tbody > tr:nth-child(1)')
                .after(hiddenProblemsController.element);
            updateEvenTrs();
        });
    }

    /**
     * Restore "hidden" state of groups, using values stored in extension's
     * storage.
     *
     * Should be called once, after loading the page.
     */
    function hideProblemGroups() {
        browser.runtime.sendMessage({
            action: 'getContestItemList',
            listName: 'hiddenGroups'
        }).then(response => {
            for (let id of response) {
                $('#' + id).removeClass('unhidden').addClass('hidden');
            }
        });
    }

    /**
     * Add or remove problem group from extension's list.
     * @param {string} id id of the group that is toggled
     */
    function toggleProblemGroup(id) {
        // onClick is executed before href, so if our div has unhidden class,
        // then it is being hidden now
        let hidden = $('#' + id).hasClass('unhidden');
        browser.runtime.sendMessage({
            action: 'modifyContestItemList',
            listName: 'hiddenGroups',
            value: id,
            add: hidden
        });
    }

    /**
     * Add our own "click" listeners to problem group "Hide" links so we can
     * store which groups have been hidden.
     */
    function connectGroupHideLinks() {
        $('div#content > form > h4 > a[href^="javascript:unhide"]')
            .click(function () {
                let href = $(this).attr('href');
                toggleProblemGroup(
                    href.substring(href.indexOf("'") + 1, href.lastIndexOf("'"))
                );
            });
    }

    // "Results" constants
    const contestID = getContestID(document.location.href);
    const resultsURL = `${SATORI_URL_HTTPS}contest/${contestID}/results`;

    function saveProblemList() {
        const problems = Object.fromEntries($.find('#content table.results tr:not(:first-of-type)').map((el) => [
            $(el).find('td:nth-child(1)').text(),
            {
                title:      $(el).find('td:nth-child(2)').text(),
                href:       $(el).find('td:nth-child(2) a').attr('href'),
                pdfHref:    $(el).find('td:nth-child(3) a').attr('href'),
                submitHref: $(el).find('td:nth-child(5) a').attr('href'),
            }
        ]));
        browser.runtime.sendMessage({
            action: 'saveContestProblemList',
            contestID,
            problems,
        });
    }

    saveProblemList();
    hideProblemGroups();
    connectGroupHideLinks();
    const table = $('table.results');
    table.each((index, table) => processProblemGroup($(table)));

    // "Results" button
    const submitUrlRegex = /submit\?select=(\d+)/;
    const pdfUrlRegex = /view\/ProblemMapping\/(\d+)\//;

    table
        .find('tbody > tr > td:nth-child(1)')
        .each(function () {
            // Get the elements needed
            const tr = $(this).parent();
            const submitUrl = $('td:last-child a', tr).attr('href');
            const pdfUrl = $('td:nth-child(3) a', tr).attr('href');

            const newTd = $('<td class="centered small"/>');

            // Try to find problem ID in submit URL or PDF URL
            let problemId;
            if (submitUrl !== undefined) {
                problemId = submitUrl.match(submitUrlRegex)[1];
            } else if (pdfUrl !== undefined) {
                problemId = pdfUrl.match(pdfUrlRegex)[1];
            }
            if (problemId != null) {
                // Create "Results" button
                const resultsUrl =
                    `${resultsURL}?results_filter_problem=${problemId}`;

                const btn = $(
                    `<a href="${resultsUrl}" class="button button_small">
                    Results
                 </a>`);
                newTd.append(btn);
            }

            tr.find('td:last').before(newTd);
        });
    table.find('tbody > tr:first-child th:last-child').before('<th/>');


    // Highlighting solved tasks
    const STATUS_ERR = 4;
    const STATUS_INT = 3;
    const STATUS_OK = 2;
    const STATUS_QUE = 1;
    const STATUS_NONE = 1000;
    const STATUS_MAP = {
        [STATUS_ERR]: 'err',
        [STATUS_INT]: 'int',
        [STATUS_OK]: 'ok',
        [STATUS_QUE]: 'que',
        [STATUS_NONE]: 'none',
    };

    const TEST_NUMBER_REGEX = /^(\d+) \/ \1$/;
    const ACCURACY_REGEX = /^\d\.\d+$/;

    const statusesStorageKey = `statuses-${contestID}`;

    function parseResultsStatuses(html) {
        const trs = $('table.results tbody tr', $.parseHTML(html));
        const statuses = {};
        for (const tr of trs) {
            const problemName = $('td:eq(1)', tr).text();
            if (problemName.trim() === '') {
                continue;
            }

            const status = $('td.status', tr).text().trim();
            let statusInt = STATUS_NONE;
            if (status.search('QUE') !== -1) {
                statusInt = STATUS_QUE;
            } else if (status.startsWith('100') ||
                status.search('OK') !== -1 ||
                TEST_NUMBER_REGEX.test(status) ||
                ACCURACY_REGEX.test(status)) {
                statusInt = STATUS_OK;
            } else if (status.search('INT') !== -1) {
                statusInt = STATUS_INT;
            } else {
                statusInt = STATUS_ERR;
            }

            statuses[problemName] = Math.min(
                statuses[problemName] || STATUS_NONE, statusInt);

            // Store the statuses in local storage so they can be retrieved
            // immediately on next page refresh
            // We are not using storage.sync because status data can be easily
            // retrieved again so there's no need to sync it
            browser.storage.local.set({ [statusesStorageKey]: statuses });
        }
        return statuses;
    }

    function annotateProblems(statuses) {
        const tableTds = $('table.results tbody tr td:nth-child(1)');
        for (const problemName in statuses) {
            const cssClassSuffix = STATUS_MAP[statuses[problemName]];
            tableTds
                .filter(function () {
                    return $(this).text().trim() === problemName;
                })
                .addClass(`satori-enhancements-status-${cssClassSuffix}`);
        }
    }

    browser.storage.local.get(statusesStorageKey).then(
        (result) => annotateProblems(result[statusesStorageKey]));
    $.ajax({
        type: 'GET',
        url: resultsURL + '?results_limit=10000',
        success: (html) => annotateProblems(parseResultsStatuses(html))
    });
})();
