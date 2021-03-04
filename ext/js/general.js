(function () {
    'use strict';

    browser.runtime.sendMessage({action: 'enablePageAction'});

    const BANNER_URL = browser.extension.getURL('images/satori_banner.png');
    const SHITORI_BANNER_URL = browser.extension.getURL('images/shitori_banner.png');
    const SUSPICIOUS_SATORI_BANNER_URL = browser.extension.getURL('images/suspicious_satori_banner.png');
    const SUSPICIOUS_SHITORI_BANNER_URL = browser.extension.getURL('images/suspicious_shitori_banner.png');
    const TCS_LOGO_URL = browser.extension.getURL('images/tcslogo.svg');
    const TCS_LOGO_WHITE_URL = browser.extension.getURL('images/tcslogo_white.svg');
    const ALT_TCS_LOGO_URL = browser.extension.getURL('images/alttcslogo.png');
    const ALT_TCS_WHITE_LOGO_URL = browser.extension.getURL('images/alttcslogo_white.png');

    let storage = browser.storage.sync || browser.storage.local;

    /** Change the website logo to our custom version. */
    function modifyLogo() {
        storage.get({
            [CHOSEN_LOGO_PRIMARY_KEY]: DEFAULT_SETTINGS[CHOSEN_LOGO_PRIMARY_KEY]
        }).then(response => {
            const newLogoUrl = {
                satoriPremium: BANNER_URL,
                shitoriPremium: SHITORI_BANNER_URL,
                suspiciousSatoriPremium: SUSPICIOUS_SATORI_BANNER_URL,
                suspiciousShitoriPremium: SUSPICIOUS_SHITORI_BANNER_URL,
                tcs: TCS_LOGO_URL,
                tcsWhite: TCS_LOGO_WHITE_URL,
                alternative: ALT_TCS_LOGO_URL,
                alternativeWhite: ALT_TCS_WHITE_LOGO_URL,
            }[response[CHOSEN_LOGO_PRIMARY_KEY]];
            $('img[src="/files/satori_banner.png"]').attr('src', newLogoUrl);
        });
    }

    /** Set the tab order for the form fields (if present on current page). */
    function setTabIndex() {
        $('input, select, button', 'div#content form').each(function (index) {
            $(this).attr('tabindex', index + 1);
        });
    }

    /** Add our custom SVG TCS logo to the bottom of the sidebar. */
    function addTCSLogo() {
        storage.get({
            [CHOSEN_LOGO_SECONDARY_KEY]:
                DEFAULT_SETTINGS[CHOSEN_LOGO_SECONDARY_KEY]
        }).then(response => {
            const chosenLogo = response[CHOSEN_LOGO_SECONDARY_KEY];
            if (chosenLogo === 'none') {
                return;
            }

            const newLogoUrl = {
                tcs: TCS_LOGO_URL,
                tcsWhite: TCS_LOGO_WHITE_URL,
                alternative: ALT_TCS_LOGO_URL,
                alternativeWhite: ALT_TCS_WHITE_LOGO_URL,
            }[chosenLogo];

            const logo = $('<img/>').attr('src', newLogoUrl);
            const div = $('<div id="satoriEnhancementsTCSLogo"/>').append(logo);
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
