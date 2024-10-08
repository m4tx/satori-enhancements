(function () {
    'use strict';

    const contestID = getContestID(document.location.href);

    $('#content table tr:nth-child(1) th').text('Problem:');
    $('#content table tr:nth-child(2) th').text('File:');
    $('#content table')
        .append(
            '<tr><th>Code:</th><td colspan="2"><textarea id="code-textarea" tabindex="4"></textarea><td></tr>',
        )
        .append(
            '<tr><th>Filename:</th><td colspan="2">' +
            '   <div class="input-row" id="code-filename-row">' +
            '       <input type="text" id="code-filename" tabindex="5" />' +
            '       <input type="text" id="code-filename-auto" value="" disabled />' +
            '   </div>' +
            '<td></tr>',
        );

    const problemSelect = $('#id_problem');
    const filePicker = $('#id_codefile');
    const codeTextarea = $('#code-textarea');
    const codeFilenameRow = $('#code-filename-row');
    const codeFilename = $('#code-filename');
    const codeFilenameAuto = $('#code-filename-auto');
    const form = $('#content form');
    const submitButton = $('#content form input[type=submit]');

    codeFilename.val(
        new URLSearchParams(window.location.search).get('filename') ||
            'program.cpp',
    );

    ['c', 'cpp', 'py', 'asm', 'sql'].forEach((ext) => {
        $('<button class="set-ext-button" />')
            .text(`.${ext}`)
            .appendTo(codeFilenameRow)
            .on('click', (event) => {
                event.preventDefault();
                const filename = codeFilename.val().trim();
                codeFilename.val(
                    `${filename.split('.')[0] || 'program'}.${ext}`,
                );
            });
    });
    const setExtButtons = $('.set-ext-button');

    filePicker.wrap('<div class="input-row"></div>');
    const clearButton = $('<button tabindex="3">Clear</button>').insertAfter(
        filePicker,
    );
    submitButton.attr('tabindex', '6');

    let loading = false;

    const updatePickers = () => {
        const fileSelected = filePicker.val() !== '';
        const textEntered = codeTextarea.val() !== '';
        const filenameEntered = codeFilename.val().trim() !== '';

        // disable one type if the other one is filled,
        // but don't disable in case somehow both are filled
        codeTextarea.attr('disabled', fileSelected && !textEntered);
        filePicker.attr('disabled', textEntered && !fileSelected);

        const showAutoFilename = fileSelected && !textEntered;
        codeFilename.toggleClass('hidden', showAutoFilename);
        setExtButtons.attr('disabled', showAutoFilename);
        codeFilenameAuto.toggleClass('hidden', !showAutoFilename);
        codeFilenameAuto.val(filePicker[0]?.files[0]?.name ?? '');

        clearButton.toggleClass('hidden', !fileSelected);

        submitButton.attr(
            'disabled',
            loading ||
                !problemSelect.val() ||
                // NXOR - disable submit if somehow both file and text are set:
                textEntered === fileSelected ||
                (textEntered && !filenameEntered),
        );
    };

    problemSelect.on('change', updatePickers);
    filePicker.on('change', updatePickers);
    codeTextarea.on('input', updatePickers);
    updatePickers();

    /**
     * Parse given HTML and return URL of the results page of the latest submit.
     *
     * @param {string} html HTML to parse
     * @returns {string} Latest submit result URL
     */
    function parseResultListHTML(html) {
        for (let x of $.parseHTML(html)) {
            let resultsLink = $(x).find(
                'div#content table.results tbody > ' +
                    'tr:nth-child(2) > td:first > a',
            );
            if (resultsLink.length) {
                return resultsLink.attr('href');
            }
        }
        throw new Error('Last submit result URL not found');
    }

    const getLatestSubmit = async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }
        return parseResultListHTML(await response.text());
    };

    form.on('submit', async (event) => {
        event.preventDefault();
        if (loading) {
            return;
        }
        const formData = new FormData();
        const problemID = problemSelect.val();
        formData.set('problem', problemID);

        if (filePicker.val() !== '') {
            formData.set('codefile', filePicker[0].files[0]);
        } else if (codeTextarea.val() !== '') {
            const filename = codeFilename.val().trim();
            if (filename === '') {
                return;
            }
            const blob = new Blob([codeTextarea.val()], {
                type: 'text/plain',
            });
            formData.set('codefile', blob, filename);
        } else {
            return;
        }

        loading = true;
        updatePickers();
        try {
            const response = await fetch(
                `${SATORI_URL_HTTPS}${form.attr('action')}`,
                {
                    method: 'POST',
                    body: formData,
                    redirect: 'manual',
                },
            );
            if (response.type === 'opaqueredirect') {
                try {
                    window.location = await getLatestSubmit(
                        `${SATORI_URL_HTTPS}contest/${contestID}/results?results_limit=1&results_filter_problem=${problemID}`,
                    );
                } catch (error) {
                    console.error(error);
                    window.location = response.url;
                }
                return;
            }
            alert('Error: HTTP Status ' + response.status);
        } catch (error) {
            alert('Error: ' + error.message);
            console.error(error);
        }
        loading = false;
        updatePickers();
    });

    clearButton.on('click', (event) => {
        event.preventDefault();
        filePicker.val('');
        updatePickers();
    });
})();
