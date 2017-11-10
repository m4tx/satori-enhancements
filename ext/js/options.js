(function () {
    'use strict';

    let storage = browser.storage.sync || browser.storage.local;
    let logoChoosers = {
        primary: $('input[name="primary-logo-chooser"]'),
        secondary: $('input[name="secondary-logo-chooser"]'),
    };
    let styleSelect = $('select#hjsstyle');

    function saveLogo(chooserName) {
        storage.set({
            [`chosenLogo_${chooserName}`]: logoChoosers[chooserName].filter(':checked').val()
        });
    }

    function restoreOptions() {
        storage.get(DEFAULT_SETTINGS).then(items => {
            const {highlightJsStyle} = items;
            for (let chooserName in logoChoosers) {
                let varName = `chosenLogo_${chooserName}`;
                logoChoosers[chooserName].filter(`[value="${items[varName]}"]`).prop('checked', true);
            }
            styleSelect.val(highlightJsStyle);
        });
    }

    function addHighlightJsStyles() {
        for (let style of HIGHLIGHT_JS_STYLES) {
            let option = $('<option>');
            option.attr('value', style);
            option.append(style);
            styleSelect.append(option);
        }
    }

    function saveStyle() {
        storage.set({
            highlightJsStyle: styleSelect.val()
        });
    }

    $(document).ready(addHighlightJsStyles);
    $(document).ready(restoreOptions);
    for (let chooserName in logoChoosers) {
        logoChoosers[chooserName].click(() => saveLogo(chooserName));
    }
    styleSelect.change(saveStyle);
})();
