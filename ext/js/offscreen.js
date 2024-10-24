importScripts(
    "../vendor/browser-polyfill.js",
    "config.js",
    "../vendor/bower/jquery.min.js"
);

browser.runtime.onMessage.addListener(handleMessages);

async function handleMessages(message) {
    if (message.target !== 'offscreen') {
        return false;
    }

    if (message.type === 'parseProblemList') {
        parseProblemList(message.data);
    } else {
        console.warn(`Unexpected message type received: '${message.type}'.`);
        return false;
    }
}

function parseProblemList(htmlText) {
    const jqueryHandles = $.parseHTML(htmlText);

    return Object.fromEntries(
        jqueryHandles.flatMap((el) =>
            [
                ...$(el).find('#content table.results tr:not(:first-of-type)'),
            ].map((tr) => [
                $(tr).find('td:nth-child(1)').text(),
                {
                    title: $(tr).find('td:nth-child(2)').text(),
                    href: $(tr).find('td:nth-child(2) a').attr('href'),
                    pdfHref: $(tr).find('td:nth-child(3) a').attr('href'),
                    submitHref: $(tr).find('td:nth-child(5) a').attr('href'),
                },
            ]),
        ),
    );
}

function sendToBackground(type, data) {
    browser.runtime.sendMessage({
        type,
        target: 'background',
        data
    });
}