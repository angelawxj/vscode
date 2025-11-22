import * as vscode from 'vscode';
import { ChatViewProvider } from './provider/ChatViewProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log("Chat UI extension activated");

    // 创建 Provider 实例，传入 extensionUri 和 context
    const provider = new ChatViewProvider(context.extensionUri, context);
    
    // 注册 Webview 视图提供者
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, provider)
    );

    // 注册命令：设置 Hugging Face Token
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-chat.setHuggingFaceToken', async () => {
            const token = await vscode.window.showInputBox({
                prompt: '请输入 Hugging Face Token',
                password: true,
                ignoreFocusOut: true,
                placeHolder: '输入您的 Hugging Face API Token'
            });
            
            if (token) {
                await provider.updateApiKey('huggingface', token);
                vscode.window.showInformationMessage('Hugging Face Token 已安全保存');
            }
        })
    );

    // 注册命令：设置 GitHub Token
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-chat.setGitHubToken', async () => {
            const token = await vscode.window.showInputBox({
                prompt: '请输入 GitHub Personal Access Token',
                password: true,
                ignoreFocusOut: true,
                placeHolder: '输入您的 GitHub Token',
                validateInput: (value) => {
                    if (!value) {
                        return 'Token 不能为空';
                    }
                    return null;
                }
            });
            
            if (token) {
                await provider.updateApiKey('github', token);
                vscode.window.showInformationMessage('GitHub Token 已安全保存');
            }
        })
    );

    // 注册命令：清除所有 Token
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-chat.clearTokens', async () => {
            const choice = await vscode.window.showWarningMessage(
                '确定要清除所有保存的 API 密钥吗？此操作不可撤销。',
                { modal: true },
                '确定'
            );
            
            if (choice === '确定') {
                await provider.clearAllSecrets();
                vscode.window.showInformationMessage('所有 API 密钥已清除');
            }
        })
    );

    // 注册命令：快速打开聊天界面
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-chat.showChat', () => {
            vscode.commands.executeCommand(`${ChatViewProvider.viewType}.focus`);
        })
    );

    // 注册命令：显示 Token 状态
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-chat.showTokenStatus', async () => {
            const huggingfaceToken = await context.secrets.get('huggingface');
            const githubToken = await context.secrets.get('github');
            
            const status = [
                `Hugging Face Token: ${huggingfaceToken ? '✓ 已设置' : '✗ 未设置'}`,
                `GitHub Token: ${githubToken ? '✓ 已设置' : '✗ 未设置'}`
            ].join('\n');
            
            vscode.window.showInformationMessage(status, { modal: true });
        })
    );

    // 注册命令：一键设置所有 Token
    context.subscriptions.push(
        vscode.commands.registerCommand('ai-chat.setupAllTokens', async () => {
            // 设置 Hugging Face Token
            const hfToken = await vscode.window.showInputBox({
                prompt: '第一步：设置 Hugging Face Token',
                password: true,
                ignoreFocusOut: true,
                placeHolder: '输入 Hugging Face Token'
            });
            
            if (hfToken) {
                await provider.updateApiKey('huggingface', hfToken);
                
                // 设置 GitHub Token
                const ghToken = await vscode.window.showInputBox({
                    prompt: '第二步：设置 GitHub Token',
                    password: true,
                    ignoreFocusOut: true,
                    placeHolder: '输入 GitHub Token'
                });
                
                if (ghToken) {
                    await provider.updateApiKey('github', ghToken);
                    vscode.window.showInformationMessage('所有 API 密钥已设置完成！');
                } else {
                    vscode.window.showInformationMessage('Hugging Face Token 已设置，GitHub Token 未设置');
                }
            }
        })
    );

    console.log('AI Chat 扩展已成功激活，所有命令已注册');
}

export function deactivate() {
    console.log("Chat UI extension deactivated");
}