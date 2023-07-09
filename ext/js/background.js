(function () {
    'use strict';

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

    const contestProblemList = {};

    function displayStatusNotification(submitID, problemCode, status) {
        browser.notifications.create({
            type: 'basic',
            title: "Submit " + submitID + " (" + problemCode + ") status",
            message: "New problem status: " + status,
            iconUrl: 'icon48.png'
        });
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
        browser.pageAction.onClicked.addListener(
            () => browser.runtime.openOptionsPage());
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
                if (typeof lastContestID === 'undefined' ||
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
     * Add highlight.js CSS to the page using the selected style.
     */
    function injectHighlightJsCss(tab) {
        storage.get({
            [HIGHLIGHT_JS_STYLE_KEY]: DEFAULT_SETTINGS[HIGHLIGHT_JS_STYLE_KEY]
        }).then(response => {
            let style = response.highlightJsStyle;
            if (style !== 'none') {
                browser.tabs.insertCSS(tab.id, {
                    file: `vendor/bower/hjsstyles/${style}.css`
                });
            }
        });
    }

    const satoriDomain = new URL(SATORI_URL_HTTPS).hostname;

    function getKeepSignedInDuration() {
        return storage.get({
            [KEEP_SIGNED_IN_DURATION_KEY]: DEFAULT_SETTINGS[KEEP_SIGNED_IN_DURATION_KEY],
        }).then((response) => {
            const duration = response[KEEP_SIGNED_IN_DURATION_KEY];
            if (duration === 'none') {
                return null;
            }
            return parseInt(duration, 10);
        });
    }

    function updateCookie(cookie) {
        return getKeepSignedInDuration()
            .then((duration) => {
                if (duration === null) {
                    return;
                }
                const newCookie = {
                    expirationDate: Math.round(Date.now() / 1000) + duration * 24 * 60 * 60,
                    httpOnly: cookie.httpOnly,
                    name: cookie.name,
                    path: cookie.path,
                    sameSite: cookie.sameSite,
                    secure: cookie.secure,
                    storeId: cookie.storeId,
                    value: cookie.value,
                    url: SATORI_URL_HTTPS,
                };
                return browser.cookies.set(newCookie);
            });
    }

    function getTokenCookies() {
        return browser.cookies.getAll({
            domain: satoriDomain,
            name: 'satori_token',
            path: '/'
        });
    }

    function updateExistingCookie() {
        return getTokenCookies().then((cookies) => {
            if (cookies.length === 0) {
                return;
            }
            if (cookies.length > 1) {
                console.warn('Too many satori_token cookies');
                return;
            }
            const [cookie] = cookies;
            if (
                cookie.expirationDate === undefined && cookie.value !== ''
            ) return updateCookie(cookie);
        });
    }

    function setUpSessionCookies() {
        updateExistingCookie().catch(console.error);
        browser.cookies.onChanged.addListener(({removed, cookie}) => {
            if (
                !removed &&
                cookie.domain === satoriDomain &&
                cookie.name === 'satori_token' &&
                cookie.path === '/'
            ) updateExistingCookie().catch(console.error);
        });
    }

    function saveContestProblemList(contestID, problems) {
        contestProblemList[contestID] = problems;
    }

    async function getProblemList(contestID) {
        if (!contestProblemList[contestID]) {
            try {
                const response = await fetch(`${SATORI_URL_HTTPS}contest/${contestID}/problems`);
                if (!response.ok) {
                    throw new Error(`HTTP Status ${response.status}`);
                }
                contestProblemList[contestID] = parseProblemList($.parseHTML(await response.text()));
            } catch (error) {
                console.error(error);
            }
        }
        return contestProblemList[contestID] ?? {};
    }

    /**
     * Save joined contest list in Storage
     * @param {array} contestList contest list
     */
    function saveJoinedContestList(contestList) {
        storage.set({ contestList });
    }

    /**
     * Save joined contest list in Storage
     * @return {array} contest list
     */
    async function getJoinedContestList() {
        return (await storage.get('contestList')).contestList ?? [];
    }

    retrieveLastContestID();
    setUpLastContestRedirect();
    setUpSessionCookies();

    browser.runtime.onMessage.addListener((request, sender) => {
        if (request.action === 'enablePageAction') {
            enablePageAction(sender.tab);
        } else if (request.action === 'saveLastContestID') {
            saveLastContestID(getContestID(sender.url));
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
        } else if (request.action === 'injectHighlightJsCss') {
            injectHighlightJsCss(sender.tab);
        } else if (request.action === 'saveContestProblemList') {
            saveContestProblemList(request.contestID, request.problems);
        } else if (request.action === 'getContestProblemList') {
            return getProblemList(request.contestID);
        } else if (request.action === 'setJoinedContestList') {
            saveJoinedContestList(request.contestList);
        } else if (request.action === 'getJoinedContestList') {
            return getJoinedContestList();
        }
        return new Promise(resolve => resolve(null));
    });
})();
