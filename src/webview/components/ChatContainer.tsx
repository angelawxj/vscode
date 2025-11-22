import React from 'react';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { Message, Model } from '../types';

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  currentModel: Model;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  onSendMessage,
  isLoading,
  currentModel
}) => {
  return (
    <div className="chat-container">
      <div className="chat-messages">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>
      <div className="chat-input">
        <InputArea 
          onSendMessage={onSendMessage} 
          isLoading={isLoading}
          currentModel={currentModel}
        />
      </div>
    </div>
  );
};