(function () {
    'use strict';

    let storage = browser.storage.sync || browser.storage.local;
    let logoChooser = $('input[name="logo-chooser"]');
    let styleSelect = $('select#hjsstyle');

    function save_logo() {
        storage.set({
            chosenLogo: logoChooser.filter(':checked').val()
        });
    }

    function restore_options() {
        storage.get({
            chosenLogo: 'tcs',
            highlightJsStyle: 'none'
        }).then(items => {
            let {chosenLogo, highlightJsStyle} = items;
            logoChooser.filter(`[value="${chosenLogo}"]`).prop('checked', true);
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
    $(document).ready(restore_options);
    logoChooser.click(save_logo);
    styleSelect.change(saveStyle);
})();
