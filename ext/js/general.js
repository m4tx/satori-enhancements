(function () {
    'use strict';

    browser.runtime.sendMessage({action: 'enablePageAction'});

    const BANNER_URL = browser.extension.getURL('images/satori_banner.png');
    const TCS_LOGO_URL = browser.extension.getURL('images/tcslogo.svg');
    const ALT_TCS_LOGO_URL = browser.extension.getURL('images/alttcslogo.png');

    let storage = browser.storage.sync || browser.storage.local;

    /** Change the website logo to our custom version. */
    function modifyLogo() {
        $('img[src="/files/satori_banner.png"]').attr('src', BANNER_URL);
    }

    /** Set the tab order for the form fields (if present on current page). */
    function setTabIndex() {
        $('input, select, button', 'div#content form').each(function (index) {
            $(this).attr('tabindex', index + 1);
        });
    }

    /** Add our custom SVG TCS logo to the bottom of the sidebar. */
    function addTCSLogo() {
        storage.get('chosenLogo').then(response => {
            let url = response.chosenLogo === 'alternative' ?
                ALT_TCS_LOGO_URL : TCS_LOGO_URL;
            let logo = $('<img/>').attr('src', url);
            let div = $('<div id="satoriEnhancementsTCSLogo"/>').append(logo);
            $('#navigationPanel').after(div);
        });
    }

    /** Remove EU logos. */
    function removeLogos() {
        $('div.logos').remove();
    }

    modifyLogo();
    addTCSLogo();
    removeLogos();
    setTabIndex();
})();
