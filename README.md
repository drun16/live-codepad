# 🚀 Live CodePad

A real-time collaborative code editor built from scratch in 5 days using Node.js, Express, and WebSockets. This project demonstrates the core principles of real-time multi-user applications.

## Features
- **Real-time Collaboration:** Text changes are instantly synchronized across all users in a session.
- **User Presence:** See other users' cursors move in real-time, each with a unique color and ID.
- **Private Rooms:** Collaboration sessions are isolated by unique URLs, allowing for multiple private documents.
- **Syntax Highlighting:** Code is automatically highlighted for readability using `highlight.js`.

## How It Works
The application uses a central Node.js server to manage WebSocket connections.

1.  **Connection & Routing:** When a user connects, the server inspects the request URL during the HTTP `upgrade` process to assign the user to a specific "room".
2.  **State Management:** Each room's state (its current text content and list of connected clients) is stored in memory on the server.
3.  **Communication:** Client actions (typing, moving the cursor) are encapsulated in JSON objects and sent to the server over the WebSocket.
4.  **Broadcasting:** The server receives a message and broadcasts it to all other clients within the *same room*.
5.  **DOM Updates:** The client's browser receives the message and updates the DOM to reflect the change, either by re-rendering the editor content or moving a cursor element.

## Known Limitations & Future Improvements

This project is a proof-of-concept. For a production-grade application, the following areas must be addressed:

-   **⚠️ Concurrency & Race Conditions:** The current "last-write-wins" model for content changes is not robust. Simultaneous edits can result in lost data.
    -   **Solution:** Integrate a library that implements **Operational Transformation (OT)** like **ShareDB**, or a **Conflict-free Replicated Data Type (CRDT)** like **Y.js**. These libraries are specifically designed to resolve merge conflicts gracefully.

-   **Persistence:** Document content is stored in server memory and is lost upon restart.
    -   **Solution:** Integrate a database (like Redis for speed, or MongoDB for more structured storage) to save document contents.

-   **Authentication:** Rooms are public and accessible to anyone with the link.
    -   **Solution:** Implement a user authentication system (e.g., OAuth, JWT) to control access to documents.