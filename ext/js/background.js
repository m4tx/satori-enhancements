if (typeof importScripts !== 'undefined') {
    importScripts('../vendor/browser-polyfill.js', 'config.js', 'common.js');
}

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

    /**
     * The offscreen document being currently created, if any.
     */
    let offscreenBeingCreated;

    /**
     * Return the web browser name this extension is running on.
     * @returns {string} 'chrome' or 'firefox' depending on the browser
     */
    function currentBrowser() {
        return browser.runtime.getURL('').startsWith('chrome-extension://')
            ? 'chrome'
            : 'firefox';
    }

    function displayStatusNotification(submitID, problemCode, status) {
        browser.notifications.create({
            type: 'basic',
            title: 'Submit ' + submitID + ' (' + problemCode + ') status',
            message: 'New problem status: ' + status,
            iconUrl: 'icon48.png',
        });
    }

    /**
     * Retrieve the ID of the last visited contest and store it in lastContestID
     * variable.
     * @see setUpLastContestRedirect
     */
    async function retrieveLastContestID() {
        const response = await storage.get('lastContestID');
        lastContestID = response.lastContestID;
    }

    /**
     * Save last contest ID both in Storage and our local variable
     * and update redirect rules.
     * @param {string} contestID last contest ID
     * @see setUpLastContestRedirect
     */
    function saveLastContestID(contestID) {
        storage.set({ lastContestID: contestID });
        lastContestID = contestID;
        updateLastContestRedirectRules();
    }

    /**
     * Display extension's action.
     */
    function enableAction() {
        const listener = () => {
            browser.runtime.openOptionsPage();
        };

        browser.action.onClicked.addListener(listener);
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
        storage
            .get({
                [listName]: {},
            })
            .then((items) => {
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

                storage.set({ [listName]: list });
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
        storage
            .get({
                [listName]: {},
            })
            .then((items) => {
                if (contestID in items[listName]) {
                    sendResponse(items[listName][contestID]);
                } else {
                    sendResponse([]);
                }
            });
    }

    /**
     * Sets up a declarative net request rules to redirect to the last contest
     * if the user just entered Satori webpage.
     */
    function updateLastContestRedirectRules() {
        const addRules = [];
        if (typeof lastContestID !== 'undefined' && lastContestID !== null) {
            addRules.push(
                ...[
                    { id: 1, urlFilter: '||satori.tcs.uj.edu.pl/|' },
                    { id: 2, urlFilter: '||satori.tcs.uj.edu.pl/news' },
                ].map(({ id, urlFilter }) => ({
                    id,
                    condition: {
                        urlFilter,
                        // Redirect only if the user just opened Satori on a given tab
                        excludedTabIds: [...satoriTabs.values()],
                        resourceTypes: ['main_frame'],
                    },
                    action: {
                        type: 'redirect',
                        redirect: {
                            url: SATORI_URL_CONTEST + lastContestID + '/',
                        },
                    },
                })),
            );
        }
        browser.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [1, 2],
            addRules,
        });
    }

    /**
     * Enables the last contest redirect.
     *
     * Also, the function adds webNavigation.onCommitted and tabs.onRemoved
     * listeners to keep the list of Satori tabs.
     */
    function setUpLastContestRedirect() {
        updateLastContestRedirectRules();

        // Store which tabs have Satori open
        browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
            if (
                tab.url &&
                (tab.url.startsWith(SATORI_URL_HTTP) ||
                    tab.url.startsWith(SATORI_URL_HTTPS))
            ) {
                satoriTabs.add(tabId);
            } else {
                satoriTabs.delete(tabId);
            }
            updateLastContestRedirectRules();
        });

        browser.tabs.onRemoved.addListener((tabId) => {
            satoriTabs.delete(tabId);
            updateLastContestRedirectRules();
        });
    }

    /**
     * Add highlight.js CSS to the page using the selected style.
     */
    async function injectHighlightJsCss(tab) {
        await storage
            .get({
                [HIGHLIGHT_JS_STYLE_KEY]:
                    DEFAULT_SETTINGS[HIGHLIGHT_JS_STYLE_KEY],
            })
            .then(async (response) => {
                let style = response.highlightJsStyle;
                if (style !== 'none') {
                    await browser.scripting.insertCSS({
                        files: [`vendor/bower/hjsstyles/${style}.css`],
                        target: { tabId: tab.id },
                    });
                }
            });
    }

    const satoriDomain = new URL(SATORI_URL_HTTPS).hostname;

    function getKeepSignedInDuration() {
        return storage
            .get({
                [KEEP_SIGNED_IN_DURATION_KEY]:
                    DEFAULT_SETTINGS[KEEP_SIGNED_IN_DURATION_KEY],
            })
            .then((response) => {
                const duration = response[KEEP_SIGNED_IN_DURATION_KEY];
                if (duration === 'none') {
                    return null;
                }
                return parseInt(duration, 10);
            });
    }

    function updateCookie(cookie) {
        return getKeepSignedInDuration().then((duration) => {
            if (duration === null) {
                return;
            }
            const newCookie = {
                expirationDate:
                    Math.round(Date.now() / 1000) + duration * 24 * 60 * 60,
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
            path: '/',
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
            if (cookie.expirationDate === undefined && cookie.value !== '') {
                return updateCookie(cookie);
            }
        });
    }

    function setUpSessionCookies() {
        updateExistingCookie().catch(console.error);
        browser.cookies.onChanged.addListener(({ removed, cookie }) => {
            if (
                !removed &&
                cookie.domain === satoriDomain &&
                cookie.name === 'satori_token' &&
                cookie.path === '/'
            ) {
                updateExistingCookie().catch(console.error);
            }
        });
    }

    function saveContestProblemList(contestID, problems) {
        contestProblemList[contestID] = problems;
    }

    async function getProblemList(contestID) {
        if (!contestProblemList[contestID]) {
            try {
                const response = await fetch(
                    `${SATORI_URL_HTTPS}contest/${contestID}/problems`,
                );
                if (!response.ok) {
                    throw new Error(`HTTP Status ${response.status}`);
                }
                const responseText = await response.text();

                if (currentBrowser() === 'chrome') {
                    await setupOffscreenDocument('/html/offscreen.html');
                    const parseResponse = await chrome.runtime.sendMessage({
                        type: 'parseProblemList',
                        target: 'offscreen',
                        data: responseText,
                    });
                    await chrome.offscreen.closeDocument();

                    contestProblemList[contestID] = parseResponse;
                } else {
                    contestProblemList[contestID] =
                        parseProblemList(responseText);
                }
            } catch (error) {
                console.error(error);
            }
        }
        return contestProblemList[contestID] ?? {};
    }

    /**
     * Setup offscreen document for parsing HTML
     * @param path path to the offscreen document
     * @returns {Promise<void>} promise that resolves when the document is ready
     */
    async function setupOffscreenDocument(path) {
        const offscreenUrl = chrome.runtime.getURL(path);
        const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT'],
            documentUrls: [offscreenUrl],
        });

        if (existingContexts.length > 0) {
            return;
        }

        if (offscreenBeingCreated) {
            await offscreenBeingCreated;
        } else {
            offscreenBeingCreated = chrome.offscreen.createDocument({
                url: path,
                reasons: [chrome.offscreen.Reason.DOM_PARSER],
                justification: 'Parse DOM',
            });
            await offscreenBeingCreated;
            offscreenBeingCreated = null;
        }
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

    retrieveLastContestID().then(() => {
        setUpLastContestRedirect();
    });
    setUpSessionCookies();

    browser.runtime.onMessage.addListener(async (request, sender) => {
        if (request.action === 'enableAction') {
            enableAction(sender.tab);
            return new Promise((resolve) => resolve(null));
        } else if (request.action === 'saveLastContestID') {
            saveLastContestID(getContestID(sender.url));
            return new Promise((resolve) => resolve(null));
        } else if (request.action === 'displayStatusNotification') {
            displayStatusNotification(
                request.submitID,
                request.problemCode,
                request.problemStatus,
            );
            return new Promise((resolve) => resolve(null));
        } else if (request.action === 'modifyContestItemList') {
            modifyContestItemList(
                request.listName,
                getContestID(sender.url),
                request.value,
                request.add,
            );
            return new Promise((resolve) => resolve(null));
        } else if (request.action === 'getContestItemList') {
            return new Promise((resolve) => {
                getContestItemList(
                    request.listName,
                    getContestID(sender.url),
                    resolve,
                );
            });
        } else if (request.action === 'injectHighlightJsCss') {
            await injectHighlightJsCss(sender.tab);
            return new Promise((resolve) => resolve(null));
        } else if (request.action === 'saveContestProblemList') {
            saveContestProblemList(request.contestID, request.problems);
            return new Promise((resolve) => resolve(null));
        } else if (request.action === 'getContestProblemList') {
            return getProblemList(request.contestID);
        } else if (request.action === 'setJoinedContestList') {
            saveJoinedContestList(request.contestList);
            return new Promise((resolve) => resolve(null));
        } else if (request.action === 'getJoinedContestList') {
            return getJoinedContestList();
        }

        console.warn(`Unexpected message type received: '${request.action}'.`);
        return false;
    });
})();
