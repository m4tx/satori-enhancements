(function () {
    'use strict';

    let storage = browser.storage.sync || browser.storage.local;
    let logoChooser = $('input[name="logo-chooser"]');

    function save_logo() {
        storage.set({
            chosenLogo: logoChooser.filter(':checked').val()
        });
    }

    function restore_options() {
        storage.get({
            chosenLogo: 'tcs'
        }).then(items => {
            let chosenLogo = items.chosenLogo;
            logoChooser.filter(`[value="${chosenLogo}"]`).prop('checked', true);
        });
    }

    $(document).ready(restore_options);
    logoChooser.click(save_logo);
})();
