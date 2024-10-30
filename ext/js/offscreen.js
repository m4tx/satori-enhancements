browser.runtime.onMessage.addListener(async (request) => {
    if (request.target !== 'offscreen') {
        return false;
    }

    if (request.type === 'parseProblemList') {
        return parseProblemList(request.data);
    }

    console.warn(`Unexpected message type received: '${request.type}'.`);
    return false;
});
