import React, { useState, useCallback, useEffect } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { ModelSelector } from './components/ModelSelector';
import { Message, Model, ChatState } from './types';
import './styles/App.css';

// 定义 VSCode API 类型
declare global {
  interface Window {
    acquireVsCodeApi?: () => {
      postMessage: (message: any) => void;
      setState: (state: any) => void;
      getState: () => any;
    };
  }
}

const App: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    currentModel: { id: 'deepseek-ai/DeepSeek-V3-0324', name: 'DeepSeek V3', provider: 'Hugging Face', description: 'DeepSeek 最新模型' },
    isLoading: false,
  });

  const [isWritingMode, setIsWritingMode] = useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<{huggingface?: string, github?: string}>({});
  const [isLoadingKeys, setIsLoadingKeys] = useState<boolean>(true);

  const availableModels: Model[] = [
    { id: 'deepseek-ai/DeepSeek-V3-0324', name: 'DeepSeek V3', provider: 'Hugging Face', description: 'DeepSeek 最新模型' },
    { id: 'meta-llama/Meta-Llama-3-70B-Instruct', name: 'Llama 3 70B', provider: 'Hugging Face', description: 'Meta Llama 3 70B 模型' },
    { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B', provider: 'Hugging Face', description: 'Mistral 7B 指令调优模型' }
  ];

  // 从 VSCode Secret Storage 获取 API Keys
  useEffect(() => {
    const loadApiKeys = () => {
      if (window.acquireVsCodeApi) {
        const vscode = window.acquireVsCodeApi();
        vscode.postMessage({
          command: 'getSecrets',
          keys: ['huggingface', 'github']
        });

        // 监听来自扩展的消息
        const messageHandler = (event: MessageEvent) => {
          const message = event.data;
          if (message.command === 'secretsData') {
            setApiKeys(message.secrets);
            setIsLoadingKeys(false);
          }
        };

        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
      } else {
        // 非 VSCode 环境，从环境变量读取
        setApiKeys({
          huggingface: process.env.REACT_APP_HUGGINGFACE_TOKEN,
          github: process.env.REACT_APP_GITHUB_TOKEN
        });
        setIsLoadingKeys(false);
      }
    };

    loadApiKeys();
  }, []);

  // 保存 API Key 到 Secret Storage
  const saveApiKey = useCallback((keyName: 'huggingface' | 'github', value: string) => {
    if (window.acquireVsCodeApi) {
      const vscode = window.acquireVsCodeApi();
      vscode.postMessage({
        command: 'setSecret',
        key: keyName,
        value: value
      });
      
      // 更新本地状态
      setApiKeys(prev => ({ ...prev, [keyName]: value }));
    } else {
      // 非 VSCode 环境，直接更新状态
      setApiKeys(prev => ({ ...prev, [keyName]: value }));
    }
  }, []);

  const handleModelChange = useCallback((model: Model) => {
    setChatState(prev => ({ ...prev, currentModel: model }));
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (isLoadingKeys) {
      console.error('API keys are still loading');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: 'thinking',
      role: 'assistant',
      timestamp: new Date(),
      isThinking: true,
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage, assistantMessage],
      isLoading: true
    }));

    try {
      const apiKey = apiKeys.huggingface;
      if (!apiKey) {
        throw new Error("Hugging Face API Key is missing. Please configure it in settings.");
      }

      const payload = {
        model: chatState.currentModel.id,
        messages: [
          ...chatState.messages.map(msg => ({ role: msg.role, content: msg.content })),
          { role: "user", content }
        ],
        stream: true,
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
                if (dataStr === '[DONE]') { break; }

                try {
                  const parsedData = JSON.parse(dataStr);
                  const token = parsedData.choices?.[0]?.delta?.content || '';

                  if (token) {
                    accumulatedContent += token;
                    setChatState(prev => ({
                      ...prev,
                      messages: prev.messages.map(msg =>
                        msg.id === assistantMessageId ? { ...msg, content: accumulatedContent, isThinking: false } : msg
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
          setChatState(prev => ({ ...prev, isLoading: false }));
          reader.releaseLock();
        }
      };

      processStream();

    } catch (error) {
      console.error('Message sending failed:', error);
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === assistantMessageId ? { 
            ...msg, 
            content: error instanceof Error ? error.message : 'Sorry, an error occurred. Please try again later.', 
            isThinking: false 
          } : msg
        ),
        isLoading: false
      }));
    }
  }, [chatState.messages, chatState.currentModel.id, apiKeys.huggingface, isLoadingKeys]);

  const handleWriteToGitHub = useCallback(async (content: string) => {
    if (isLoadingKeys) {
      console.error('API keys are still loading');
      return;
    }

    const token = apiKeys.github;
    const repoOwner = 'angelawxj';
    const repoName = 'vscode';
    const filePath = 'write.txt';
    const branch = 'dev';

    if (!token) {
      console.error('GitHub Token is missing. Please configure it in settings.');
      return;
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`, {
        method: 'GET',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }

      const fileData = await response.json();
      const sha = fileData.sha;
      const existingContentBase64 = fileData.content;

      const decodedExistingContent = decodeBase64(existingContentBase64);
      const updatedContent = decodedExistingContent + '\n' + content;
      const encodedContent = encodeBase64(updatedContent);

      const updateResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          message: 'Append new content to document',
          content: encodedContent,
          sha: sha,
          branch: branch,
        })
      });

      if (!updateResponse.ok) {
        throw new Error(`GitHub update failed: ${updateResponse.status}`);
      }

      console.log('GitHub文档更新成功!');
    } catch (error) {
      console.error('Error updating GitHub document:', error);
    }
  }, [apiKeys.github, isLoadingKeys]);

  const decodeBase64 = (base64: string): string => {
    const byteArray = new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(byteArray);
  };

  const encodeBase64 = (str: string): string => {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(str);
    return btoa(String.fromCharCode(...uint8Array));
  };

  const clearMessages = useCallback(() => {
    setChatState(prev => ({ ...prev, messages: [] }));
  }, []);

  const handleToggleWritingMode = () => {
    setIsWritingMode(prev => !prev);
  };

  // 设置 API Key 的组件
  const ApiKeySettings: React.FC = () => {
    const [showSettings, setShowSettings] = useState(false);
    const [tempKeys, setTempKeys] = useState(apiKeys);

    useEffect(() => {
      setTempKeys(apiKeys);
    }, [apiKeys]);

    const handleSave = () => {
      if (tempKeys.huggingface) {
        saveApiKey('huggingface', tempKeys.huggingface);
      }
      if (tempKeys.github) {
        saveApiKey('github', tempKeys.github);
      }
      setShowSettings(false);
    };

    return (
      <div className="api-key-settings">
        <button 
          className="settings-btn"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ 设置
        </button>
        
        {showSettings && (
          <div className="settings-panel">
            <h3>API 密钥设置</h3>
            
            <div className="input-group">
              <label>Hugging Face Token:</label>
              <input
                type="password"
                value={tempKeys.huggingface || ''}
                onChange={(e) => setTempKeys(prev => ({ ...prev, huggingface: e.target.value }))}
                placeholder="输入 Hugging Face Token"
              />
            </div>
            
            <div className="input-group">
              <label>GitHub Token:</label>
              <input
                type="password"
                value={tempKeys.github || ''}
                onChange={(e) => setTempKeys(prev => ({ ...prev, github: e.target.value }))}
                placeholder="输入 GitHub Token"
              />
            </div>
            
            <div className="settings-actions">
              <button onClick={handleSave}>保存</button>
              <button onClick={() => setShowSettings(false)}>取消</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ai-chat-app">
      <div className="app-header">
        <div className="header-left">
          <h1>AI助手</h1>
          <ModelSelector models={availableModels} currentModel={chatState.currentModel} onModelChange={handleModelChange} />
        </div>
        <div className="header-right">
          <ApiKeySettings />
          <button
            className={`write-btn ${isWritingMode ? 'active' : ''}`}
            onClick={handleToggleWritingMode}
          >
            写作
          </button>
          <button className="clear-btn" onClick={clearMessages} disabled={chatState.messages.length === 0}>
            清空
          </button>
        </div>
      </div>
      
      {isLoadingKeys && (
        <div className="loading-keys">正在加载 API 密钥...</div>
      )}
      
      <div className="app-content">
        <ChatContainer
          messages={chatState.messages}
          onSendMessage={isWritingMode ? handleWriteToGitHub : handleSendMessage}
          isLoading={chatState.isLoading}
          currentModel={chatState.currentModel}
        />
      </div>
    </div>
  );
};

export default App;