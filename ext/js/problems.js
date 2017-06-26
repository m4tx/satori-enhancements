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
                this.td = $('<td colspan="6" ' +
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
                if (problemsNum === 0) {
                    this.tr.hide();
                } else {
                    this.tr.show();
                }
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
                tr.hide();
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
                $(tr).toggle(!hiddenProblemsController.problemsHidden);
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
            problemTable.find('tbody > tr:visible:gt(0)')
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

    hideProblemGroups();
    connectGroupHideLinks();
    $('table.results').each((index, table) => processProblemGroup($(table)));
})();
