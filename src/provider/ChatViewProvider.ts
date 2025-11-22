import * as vscode from 'vscode';
import * as path from 'path';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aiChatView';

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _context: vscode.ExtensionContext
    ) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri,
                vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview')
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // 设置消息处理器
        this._setWebviewMessageListener(webviewView.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'webview.js')
        );

        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'webview.css')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; script-src 'nonce-${nonce}'; connect-src 'self' https://router.huggingface.co https://api.github.com;">
                <link rel="stylesheet" href="${styleUri}">
                <title>AI 助手</title>
                <style>
                    body {
                        padding: 0;
                        margin: 0;
                        background: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        font-family: var(--vscode-font-family);
                    }
                    #root {
                        height: 100vh;
                        overflow: hidden;
                    }
                </style>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}">
                    // 创建 VSCode API
                    const vscode = acquireVsCodeApi();
                    
                    // 设置全局变量供 React 应用使用
                    window.acquireVsCodeApi = () => vscode;
                    
                    // 初始状态
                    const initialState = vscode.getState() || {};
                    window.initialState = initialState;
                </script>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            async (message: any) => {
                const command = message.command;

                switch (command) {
                    case 'getSecrets':
                        // 从 Secret Storage 获取密钥
                        const secrets: any = {};
                        for (const key of message.keys) {
                            secrets[key] = await this._context.secrets.get(key) || '';
                        }
                        webview.postMessage({
                            command: 'secretsData',
                            secrets: secrets
                        });
                        break;

                    case 'setSecret':
                        // 保存密钥到 Secret Storage
                        await this._context.secrets.store(message.key, message.value);
                        webview.postMessage({
                            command: 'secretSaved',
                            key: message.key
                        });
                        break;

                    case 'showInformationMessage':
                        vscode.window.showInformationMessage(message.text);
                        break;

                    case 'showErrorMessage':
                        vscode.window.showErrorMessage(message.text);
                        break;

                    case 'saveState':
                        // 保存 Webview 状态
                        webview.postMessage({
                            command: 'stateSaved'
                        });
                        break;

                    case 'alert':
                        vscode.window.showWarningMessage(message.text);
                        break;
                }
            },
            undefined
        );
    }

    // 公共方法：从扩展程序侧更新密钥
    public async updateApiKey(key: string, value: string) {
        await this._context.secrets.store(key, value);
    }

    // 公共方法：清除所有密钥
    public async clearAllSecrets() {
        await this._context.secrets.delete('huggingface');
        await this._context.secrets.delete('github');
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}