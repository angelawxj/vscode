import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown'; // Import react-markdown
import { Message } from '../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; // Import syntax highlighter
import { nightOwl  } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Choose a style

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🤖</div>
          <h3>欢迎使用AI助手</h3>
          <p>开始对话吧！我可以帮你解答问题、编写代码、分析问题等。</p>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-avatar">
              {message.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              {message.isThinking ? (
                <div className="thinking-dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
              ) : (
                <div className="message-text">
                  <ReactMarkdown
                    children={message.content}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={nightOwl} // Choose your preferred style
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  />
                </div>
              )}
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};
