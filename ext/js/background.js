(function () {
    'use strict';

    const PROBLEM_URL_REGEX =
        /https:\/\/satori\.tcs\.uj\.edu\.pl\/contest\/(\d+)\//;

    const SATORI_URL = 'satori.tcs.uj.edu.pl/';
    const SATORI_URL_HTTP = 'http://' + SATORI_URL;
    const SATORI_URL_HTTPS = 'https://' + SATORI_URL;
    const SATORI_URL_CONTEST = SATORI_URL_HTTPS + 'contest/';

    let storage = browser.storage.sync || browser.storage.local;

    let lastContestID;
    /**
     * A set that stores information about which tabs have Satori open. It is
     * used to redirect the user to the last contest (if they are already
     * browsing the website, then we shouldn't redirect).
     * @type {Set}
     */
    let satoriTabs = new Set();
    /**
     * A set used to store IDs of contests where we should redirect to the
     * latest submit. Most of the time this object should be empty, as we'll
     * add an ID after submit and then almost immediately remove it when
     * browser gets the results page.
     * @type {Set}
     */
    let contestResultsRedirects = new Set();

    function displayStatusNotification(submitID, problemCode, status) {
        browser.notifications.create({
            type: 'basic',
            title: "Submit " + submitID + " (" + problemCode + ") status",
            message: "New problem status: " + status,
            iconUrl: 'icon48.png'
        });
    }

    /**
     * Parse given URL and return the contest ID.
     * @param {string} url URL to parse
     * @returns {string} contest ID
     */
    function getContestID(url) {
        return PROBLEM_URL_REGEX.exec(url)[1];
    }

    /**
     * Retrieve the ID of the last visited contest and store it in lastContestID
     * variable.
     * @see setUpLastContestRedirect
     */
    function retrieveLastContestID() {
        storage.get('lastContestID').then(response => {
            lastContestID = response.lastContestID;
        });
    }

    /**
     * Save last contest ID both in Storage and our local variable.
     * @param {string} contestID last contest ID
     * @see setUpLastContestRedirect
     */
    function saveLastContestID(contestID) {
        storage.set({lastContestID: contestID});
        lastContestID = contestID;
    }

    /**
     * Display extension's page action.
     * @param tab tab object
     */
    function enablePageAction(tab) {
        browser.pageAction.show(tab.id);
    }

    /**
     * Add or remove a value to given list bound of a specified contest.
     * @param {string} listName name of the list to look for in the storage
     * @param {string} contestID ID of the contest to modify its list
     * @param {string} value value to add or remove
     * @param {boolean} add whether to add or remove given element
     * @see getContestItemList
     */
    function modifyContestItemList(listName, contestID, value, add) {
        storage.get({
            [listName]: {}
        }).then(items => {
            let list = items[listName];
            if (!(contestID in list)) {
                list[contestID] = [];
            }

            let s = new Set(list[contestID]);
            if (add) {
                s.add(value);
            } else {
                s.delete(value);
            }
            list[contestID] = [...s];

            storage.set({[listName]: list});
        });
    }

    /**
     * Retrieve a list bound to given contest.
     *
     * This function is used e.g. to store the list of problem hidden in for a
     * contest.
     *
     * @param {string} listName name of the list to get
     * @param {string} contestID ID of the contest to get the list for
     * @param {function} sendResponse function to call with the data retrieved
     * @see modifyContestItemList
     */
    function getContestItemList(listName, contestID, sendResponse) {
        storage.get({
            [listName]: {}
        }).then(items => {
            if (contestID in items[listName]) {
                sendResponse(items[listName][contestID]);
            } else {
                sendResponse([]);
            }
        });
    }

    /**
     * Check whether we should redirect to the latest submit for given contest
     * ID (and mark it as "redirected", so we won't redirect again).
     * @param {string} contestID ID of the contest to check
     * @returns {boolean} whether or not we should redirect
     */
    function shouldRedirectToSubmit(contestID) {
        return contestResultsRedirects.delete(contestID);
    }

    /**
     * Add an onBeforeRequest listener that redirects to the last contest
     * if the user just entered Satori webpage.
     *
     * Also, the function adds webNavigation.onCommitted and tabs.onRemoved
     * listeners to keep the list of Satori tabs.
     */
    function setUpLastContestRedirect() {
        // Store which tabs have Satori open
        browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
            if (tab.url && (tab.url.startsWith(SATORI_URL_HTTP) ||
                tab.url.startsWith(SATORI_URL_HTTPS))) {
                satoriTabs.add(tabId);
            } else {
                satoriTabs.delete(tabId);
            }
        });

        browser.tabs.onRemoved.addListener(tabId => satoriTabs.delete(tabId));

        browser.webRequest.onBeforeRequest.addListener(
            function (details) {
                if (typeof lastContestID == 'undefined' ||
                    lastContestID === null || satoriTabs.has(details.tabId)) {
                    // If we haven't saved any contest yet, then do nothing
                    // Also, don't redirect if the user is already browsing
                    // Satori
                    return;
                }

                return {redirectUrl: SATORI_URL_CONTEST + lastContestID + '/'};
            },
            {
                urls: [
                    '*://satori.tcs.uj.edu.pl/',
                    '*://satori.tcs.uj.edu.pl/news'
                ],
                types: ['main_frame']
            },
            ['blocking']
        );
    }

    /**
     * Add an onCompleted listener that looks for submit POST requests and
     * stores contest IDs of them (so we know we should redirect the user to
     * their latest submit).
     */
    function setUpSubmitRedirect() {
        browser.webRequest.onBeforeRedirect.addListener(
            function (details) {
                if (details.method !== 'POST') {
                    return;
                }

                let redirectURL;
                for (let header of details.responseHeaders) {
                    if (header.name.toLowerCase() == 'location') {
                        redirectURL = header.value;
                        break;
                    }
                }

                if (typeof redirectURL != 'undefined' && redirectURL !== null) {
                    contestResultsRedirects.add(getContestID(redirectURL));
                }
            },
            {
                urls: ['*://satori.tcs.uj.edu.pl/contest/*/submit*'],
                types: ['main_frame']
            },
            ['responseHeaders']
        );
    }

    retrieveLastContestID();
    setUpLastContestRedirect();
    setUpSubmitRedirect();

    browser.runtime.onMessage.addListener((request, sender) => {
        if (request.action === 'enablePageAction') {
            enablePageAction(sender.tab);
        } else if (request.action === 'saveLastContestID') {
            saveLastContestID(getContestID(sender.url));
        } else if (request.action === 'shouldRedirectToSubmit') {
            return shouldRedirectToSubmit(getContestID(sender.url));
        } else if (request.action === 'displayStatusNotification') {
            displayStatusNotification(request.submitID, request.problemCode,
                request.problemStatus);
        } else if (request.action === 'modifyContestItemList') {
            modifyContestItemList(
                request.listName, getContestID(sender.url),
                request.value, request.add);
        } else if (request.action === 'getContestItemList') {
            return new Promise(resolve => {
                getContestItemList(
                    request.listName, getContestID(sender.url), resolve);
            });
        }
        return new Promise(resolve => resolve(null));
    });
})();
