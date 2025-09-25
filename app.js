const editor = document.getElementById('editor');
const editorContainer = document.getElementById('editor-container');
// Get the room ID from the browser's URL path
const roomId = window.location.pathname;
const socket = new WebSocket(`ws://localhost:8080${roomId}`);


const remoteCursors = {}; // Store other users' cursors { userId: element }


// A helper function to calculate text dimensions (this is an approximation)
function getCursorPositionPx(text, index) {
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.whiteSpace = 'pre-wrap'; // respect newlines and spaces
    temp.style.font = getComputedStyle(editor).font;
    temp.style.width = editor.clientWidth + 'px';
    
    const before = text.substring(0, index);
    const after = text.substring(index);
    
    temp.innerHTML = `<span>${before}</span><span id="pos"></span><span>${after}</span>`;
    document.body.appendChild(temp);
    
    const posSpan = temp.querySelector('#pos');
    const rect = { top: posSpan.offsetTop, left: posSpan.offsetLeft };
    
    document.body.removeChild(temp);
    return rect;
}


// --- WebSocket Event Handlers ---

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // let currentCursorPosition;

    switch (data.type) {
        case 'initialContent': // New message type from server
        case 'contentChange':
            // currentCursorPosition = getCaretCharacterOffsetWithin(editor);
            editor.textContent = data.content;
            // Highlight the entire block of code
            hljs.highlightElement(editor);
            // Restore cursor position
            // setCaretPosition(editor, currentCursorPosition);
            break;

        case 'cursorChange':
            handleCursorChange(data);
            break;

        case 'userDisconnect':
            if (remoteCursors[data.userId]) {
                remoteCursors[data.userId].remove();
                delete remoteCursors[data.userId];
            }
            break;
    }
};

function handleCursorChange(data) {
    let cursorEl = remoteCursors[data.userId];

    // If we don't have a cursor element for this user yet, create one
    if (!cursorEl) {
        cursorEl = document.createElement('div');
        cursorEl.className = 'remote-cursor';
        cursorEl.style.backgroundColor = data.color;
        cursorEl.setAttribute('data-user', data.userId.substring(0, 6)); // Show short ID
        editorContainer.appendChild(cursorEl);
        remoteCursors[data.userId] = cursorEl;
    }

    // Calculate the pixel position and move the cursor element
    const pos = getCursorPositionPx(editor.textContent, data.position);
    cursorEl.style.top = `${pos.top}px`;
    cursorEl.style.left = `${pos.left}px`;
}


// --- Editor Event Listeners ---

editor.addEventListener('input', () => {
    socket.send(JSON.stringify({
        type: 'contentChange',
        content: editor.textContent //use textContent for pre/code
    }));
});

// We need to listen for both clicks and key presses to track selection
function sendCursorPosition() {
    socket.send(JSON.stringify({
        type: 'cursorChange',
        position: position
    }));
}

// --- Caret position helpers for contenteditable elements ---
// (These are more complex than for a textarea)
// function getCaretCharacterOffsetWithin(element) {
//     // ... complex DOM logic to get cursor position ...
//     // For simplicity, we'll keep our previous approximation for now.
//     // A full implementation is beyond this tutorial's scope.
//     return 0; // Placeholder
// }

// function setCaretPosition(element, offset) {
//     // ... complex DOM logic to set cursor position ...
// }

editor.addEventListener('keyup', sendCursorPosition);
editor.addEventListener('click', sendCursorPosition);