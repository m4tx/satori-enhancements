(function () {
    'use strict';

    $('#content table tr:nth-child(1) th').text('Problem:');
    $('#content table tr:nth-child(2) th').text('File:');
    $('#content table').append(
        '<tr><th>Code:</th><td colspan="2"><textarea id="code-textarea"></textarea><td></tr>'
    );

    const problemSelect = $('#id_problem');
    const filePicker = $('#id_codefile');
    const codeTextarea = $('#code-textarea');
    const form = $('#content form');

    const updatePickers = () => {
        const fileSelected = filePicker.val() !== '';
        const textEntered = codeTextarea.val() !== '';
        codeTextarea.attr('disabled', fileSelected);
        filePicker.attr('disabled', textEntered);
    }

    filePicker.on('change', updatePickers);
    codeTextarea.on('input', updatePickers);
    updatePickers();

    let loading = false;

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
        try {
            const response = await fetch(form.attr('action'), {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                alert("Bład: " + response.status)
                console.log(await response.text());
                loading = false;
                return;
            }
            window.location = response.url;
        } catch (error) {
            alert("Błąd: " + error.message);
            console.error(error);
        }
        loading = false;
    });
})();
