import React, { useState, useCallback } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { ModelSelector } from './components/ModelSelector';
import { Message, Model, ChatState } from './types';
import './styles/App.css';

const App: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    currentModel: {
      id: 'deepseek-ai/DeepSeek-V3-0324',
      name: 'DeepSeek V3',
      provider: 'Hugging Face',
      description: 'DeepSeek 最新模型'
    },
    isLoading: false
  });

  const availableModels: Model[] = [
    {
      id: 'deepseek-ai/DeepSeek-V3-0324',
      name: 'DeepSeek V3',
      provider: 'Hugging Face',
      description: 'DeepSeek 最新模型'
    },
    {
      id: 'meta-llama/Meta-Llama-3-70B-Instruct',
      name: 'Llama 3 70B',
      provider: 'Hugging Face',
      description: 'Meta Llama 3 70B 模型'
    },
    {
      id: 'mistralai/Mistral-7B-Instruct-v0.3',
      name: 'Mistral 7B',
      provider: 'Hugging Face',
      description: 'Mistral 7B 指令调优模型'
    }
  ];

  const handleModelChange = useCallback((model: Model) => {
    setChatState(prev => ({
      ...prev,
      currentModel: model
    }));
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    // 创建助手消息的初始状态，并显示波浪式加载动画
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: 'thinking', // 特殊标记，表示正在思考
      role: 'assistant',
      timestamp: new Date(),
      isThinking: true // 添加标记表示正在思考状态
    };

    // 更新状态，添加用户消息和助手消息
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage, assistantMessage],
      isLoading: true
    }));

    try {
      const apiKey = "";
      if (!apiKey) throw new Error("API Key is missing");

      const payload = {
        model: chatState.currentModel.id,
        messages: [
          ...chatState.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: "user",
            content
          }
        ],
        stream: true, // Stream response
        max_tokens: 2048
      };

      const response = await fetch(
        "https://router.huggingface.co/v1/chat/completions",
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6);
                if (dataStr === '[DONE]') {
                  break;
                }
                try {
                  const parsedData = JSON.parse(dataStr);
                  const token = parsedData.choices?.[0]?.delta?.content || '';
                  if (token) {
                    accumulatedContent += token;
                    // 更新助手消息的内容，移除思考状态
                    setChatState(prev => ({
                      ...prev,
                      messages: prev.messages.map(msg =>
                        msg.id === assistantMessageId
                          ? {
                              ...msg,
                              content: accumulatedContent,
                              isThinking: false // 移除思考状态
                            }
                          : msg
                      )
                    }));
                  }
                } catch (e) {
                  console.warn('Error parsing data block:', e, 'Raw data:', dataStr);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error handling stream:', error);
        } finally {
          setChatState(prev => ({
            ...prev,
            isLoading: false
          }));
          reader.releaseLock();
        }
      };

      processStream();
    } catch (error) {
      console.error('Message sending failed:', error);
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: 'Sorry, an error occurred. Please try again later.',
                isThinking: false // 移除思考状态
              }
            : msg
        ),
        isLoading: false
      }));
    }
  }, [chatState.messages, chatState.currentModel.id]);

  const clearMessages = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      messages: []
    }));
  }, []);

  return (
    <div className="ai-chat-app">
      <div className="app-header">
        <div className="header-left">
          <h1>AI助手</h1>
          <ModelSelector
            models={availableModels}
            currentModel={chatState.currentModel}
            onModelChange={handleModelChange}
          />
        </div>
        <div className="header-right">
          <button
            className="clear-btn"
            onClick={clearMessages}
            disabled={chatState.messages.length === 0}
          >
            清空对话
          </button>
        </div>
      </div>
      <div className="app-content">
        <ChatContainer
          messages={chatState.messages}
          onSendMessage={handleSendMessage}
          isLoading={chatState.isLoading}
          currentModel={chatState.currentModel}
        />
      </div>
    </div>
  );
};

export default App;