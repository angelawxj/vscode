import React, { useState, useCallback } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { ModelSelector } from './components/ModelSelector';
import { Message, Model, ChatState } from './types';
import './styles/App.css';

const App: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    currentModel: { id: 'deepseek-ai/DeepSeek-V3-0324', name: 'DeepSeek V3', provider: 'Hugging Face', description: 'DeepSeek 最新模型' },
    isLoading: false,
  });

  const [isWritingMode, setIsWritingMode] = useState<boolean>(false); // 控制写作模式

  const availableModels: Model[] = [
    { id: 'deepseek-ai/DeepSeek-V3-0324', name: 'DeepSeek V3', provider: 'Hugging Face', description: 'DeepSeek 最新模型' },
    { id: 'meta-llama/Meta-Llama-3-70B-Instruct', name: 'Llama 3 70B', provider: 'Hugging Face', description: 'Meta Llama 3 70B 模型' },
    { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B', provider: 'Hugging Face', description: 'Mistral 7B 指令调优模型' }
  ];

  const handleModelChange = useCallback((model: Model) => {
    setChatState(prev => ({ ...prev, currentModel: model }));
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    // 创建助手消息的初始状态，并显示波浪式加载动画
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: 'thinking', // 特殊标记，表示正在思考 
      role: 'assistant',
      timestamp: new Date(),
      isThinking: true, // 添加标记表示正在思考状态 
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage, assistantMessage],
      isLoading: true
    }));

    try {
      const apiKey = ""; 
      if (!apiKey) throw new Error("API Key is missing");//hf_JuHheWuHykKiBBkCEnct

      const payload = {
        model: chatState.currentModel.id,//thaUIONKhYpgrA
        messages: [
          ...chatState.messages.map(msg => ({ role: msg.role, content: msg.content })),
          { role: "user", content }
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
          msg.id === assistantMessageId ? { ...msg, content: 'Sorry, an error occurred. Please try again later.', isThinking: false } : msg
        ),
        isLoading: false
      }));
    }
  }, [chatState.messages, chatState.currentModel.id]);

const handleWriteToGitHub = useCallback(async (content: string) => {
  const token = ''; // 替换为你的GitHub Token
  const repoOwner = 'angelawxj'; // 替换为你的GitHub仓库所有者ghp_qEBZSUFfADi9
  const repoName = 'vscode'; // 替换为你的GitHub仓库名称tZz9yHpZNMTZ3Mn8Ni1sI50V
  const filePath = 'write.txt'; // 文件路径
  const branch = 'dev'; // 分支名称

  try {
    // 1. 获取文件的现有内容
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
    const sha = fileData.sha; // 需要的SHA值
    const existingContentBase64 = fileData.content; // 文件内容（Base64 编码）

    // 2. 解码现有内容（使用 TextDecoder）
    const decodedExistingContent = decodeBase64(existingContentBase64);

    // 3. 将新内容追加到现有内容之后
    const updatedContent = decodedExistingContent + '\n' + content;

    // 4. 将更新后的内容重新编码为Base64
    const encodedContent = encodeBase64(updatedContent);

    // 5. 更新文件内容
    const updateResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: 'Append new content to document',
        content: encodedContent, // 重新编码后的内容
        sha: sha, // 提供文件的SHA值
        branch: branch,
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`GitHub update failed: ${updateResponse.status}`);
    }

    console.log('GitHub文档更新成功!');
  } catch (error) {
    console.error('Error updating GitHub document:', error);
    console.log('更新失败');
  }
}, [chatState.messages]);

// 解码Base64（使用 TextDecoder）
const decodeBase64 = (base64: string): string => {
  const byteArray = new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(byteArray);
};

// 编码为Base64
const encodeBase64 = (str: string): string => {
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(str);
  return btoa(String.fromCharCode(...uint8Array));
};



  const clearMessages = useCallback(() => {
    setChatState(prev => ({ ...prev, messages: [] }));
  }, []);

  const handleToggleWritingMode = () => {
    setIsWritingMode(prev => !prev); // 切换写作模式
  };



  return (
    <div className="ai-chat-app">
      <div className="app-header">
        <div className="header-left">
          <h1>AI助手</h1>
          <ModelSelector models={availableModels} currentModel={chatState.currentModel} onModelChange={handleModelChange} />
        </div>
        <div className="header-right">
          <button
            className={`write-btn ${isWritingMode ? 'active' : ''}`} // 动态添加 active 类
            onClick={handleToggleWritingMode}
          >
            写作
          </button>
          <button className="clear-btn" onClick={clearMessages} disabled={chatState.messages.length === 0}>清空</button>
        </div>
      </div>
      <div className="app-content">
        <ChatContainer
          messages={chatState.messages}
          onSendMessage={isWritingMode ? handleWriteToGitHub : handleSendMessage} // 根据状态切换方法
          isLoading={chatState.isLoading}
          currentModel={chatState.currentModel}
        />
      </div>
    </div>
  );
};

export default App;
