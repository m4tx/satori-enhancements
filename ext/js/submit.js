(function () {
    'use strict';

    $('#content table tr:nth-child(1) th').text('Problem:');
    $('#content table tr:nth-child(2) th').text('File:');
    $('#content table').append(
        '<tr><th>Code:</th><td colspan="2"><textarea id="code-textarea" tabindex="3"></textarea><td></tr>'
    );

    const problemSelect = $('#id_problem');
    const filePicker = $('#id_codefile');
    const codeTextarea = $('#code-textarea');
    const form = $('#content form');
    const submitButton = $('#content form input[type=submit]');

    submitButton.attr('tabindex', '4');

    let loading = false;

    const updatePickers = () => {
        const fileSelected = filePicker.val() !== '';
        const textEntered = codeTextarea.val() !== '';
        codeTextarea.attr('disabled', fileSelected);
        filePicker.attr('disabled', textEntered);
        submitButton.attr('disabled', loading || !problemSelect.val() || !(textEntered || fileSelected));
    }

    problemSelect.on('change', updatePickers);
    filePicker.on('change', updatePickers);
    codeTextarea.on('input', updatePickers);
    updatePickers();

    form.on('submit', async (event) => {
        event.preventDefault();
        if (loading) return;
        const formData = new FormData();
        formData.set('problem', problemSelect.val());
        if (filePicker.val() !== '') {
            formData.set('codefile', filePicker[0].files[0]);
        } else if (codeTextarea.val() !== '') {
            const blob = new Blob([codeTextarea.val()], {
                type: "text/plain",
            });
            formData.set('codefile', blob, 'code.cpp');
        } else return;
        loading = true;
        updatePickers();
        try {
            const response = await fetch(form.attr('action'), {
                method: 'POST',
                body: formData,
            });
            if (response.ok) {
                window.location = response.url;
                return;
            }
            alert("Bład: " + response.status);
        } catch (error) {
            alert("Błąd: " + error.message);
            console.error(error);
        }
        loading = false;
        updatePickers();
    });
})();
