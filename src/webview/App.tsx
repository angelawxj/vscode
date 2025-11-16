import React, { useState } from 'react';

interface Message {
    id: number;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

const App: React.FC = () => {
    return (
        <div className="chat-container">
            <header className="chat-header">
                <h1>Chat UI</h1>
            </header>
        </div>
    );
};

export default App;