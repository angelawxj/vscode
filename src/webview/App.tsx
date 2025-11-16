import React, { useState, useEffect, useRef } from 'react';

interface Task {
    id: number;
    title: string;
    status: 'completed' | 'in-progress' | 'timeout';
}

const App: React.FC = () => {
    const [activeButton, setActiveButton] = useState<string>('home');
    const [dynamicText, setDynamicText] = useState<string>('欢迎使用代码审查界面！');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const taskListRef = useRef<HTMLDivElement>(null);

    // 模拟动态文本内容
    const buttonContents = {
        home: {
            text: '欢迎来到代码审查首页！这里展示最新的审查任务。',
            title: '首页'
        },
        review: {
            text: '当前有待审查的代码提交，请及时处理。',
            title: '代码审查'
        },
        history: {
            text: '查看历史审查记录和统计信息。',
            title: '历史记录'
        },
        settings: {
            text: '系统设置：审查规则配置。',
            title: '设置'
        }
    };

    // 模拟获取任务数据
    const fetchTasks = async (pageNum: number) => {
        setLoading(true);
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const newTasks: Task[] = Array.from({ length: 10 }, (_, index) => {
            const taskId = (pageNum - 1) * 10 + index + 1;
            const statuses: ('completed' | 'in-progress' | 'timeout')[] = ['completed', 'in-progress', 'timeout'];
            
            return {
                id: taskId,
                title: `代码审查任务 ${taskId}`,
                status: statuses[Math.floor(Math.random() * statuses.length)]
            };
        });

        if (pageNum === 1) {
            setTasks(newTasks);
        } else {
            setTasks(prev => [...prev, ...newTasks]);
        }

        // 模拟数据结束条件
        setHasMore(pageNum < 5);
        setLoading(false);
    };

    // 初始加载和页面变化时获取数据
    useEffect(() => {
        fetchTasks(1);
    }, []);

    // 处理按钮点击
    const handleButtonClick = (buttonName: string) => {
        setActiveButton(buttonName);
        setDynamicText(buttonContents[buttonName as keyof typeof buttonContents].text);
    };

    // 处理滚动加载
    const handleScroll = () => {
        if (!taskListRef.current || loading || !hasMore) return;

        const { scrollTop, scrollHeight, clientHeight } = taskListRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

        if (isAtBottom) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchTasks(nextPage);
        }
    };

    // 删除任务
    const handleDeleteTask = (taskId: number) => {
        setTasks(prev => prev.filter(task => task.id !== taskId));
    };

    // 查看结果
    const handleViewResult = (taskId: number) => {
        alert(`查看代码审查任务 ${taskId} 的结果`);
        // 这里可以添加查看审查结果的逻辑
    };

    // 重试任务
    const handleRetryTask = (taskId: number) => {
        alert(`重试代码审查任务 ${taskId}`);
        // 这里可以添加重试任务的逻辑
        // 例如：更新任务状态为进行中
        setTasks(prev => prev.map(task => 
            task.id === taskId ? { ...task, status: 'in-progress' } : task
        ));
    };

    // 获取状态图标和颜色
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'completed':
                return {
                    icon: '✓',
                    color: '#10b981',
                    text: '已完成',
                    bgColor: 'rgba(16, 185, 129, 0.1)'
                };
            case 'in-progress':
                return {
                    icon: '⟳',
                    color: '#3b82f6',
                    text: '进行中',
                    bgColor: 'rgba(59, 130, 246, 0.1)'
                };
            case 'timeout':
                return {
                    icon: '⚠',
                    color: '#ef4444',
                    text: '超时',
                    bgColor: 'rgba(239, 68, 68, 0.1)'
                };
            default:
                return {
                    icon: '?',
                    color: '#6b7280',
                    text: '未知',
                    bgColor: 'rgba(107, 114, 128, 0.1)'
                };
        }
    };

    // 根据任务状态渲染操作按钮
    const renderActionButtons = (task: Task) => {
        switch (task.status) {
            case 'completed':
                return (
                    <>
                        <button 
                            className="btn-view-result"
                            onClick={() => handleViewResult(task.id)}
                        >
                            查看结果
                        </button>
                        <button 
                            className="btn-delete"
                            onClick={() => handleDeleteTask(task.id)}
                        >
                            删除
                        </button>
                    </>
                );
            case 'in-progress':
                return (
                    <button 
                        className="btn-delete"
                        onClick={() => handleDeleteTask(task.id)}
                    >
                        删除
                    </button>
                );
            case 'timeout':
                return (
                    <>
                        <button 
                            className="btn-retry"
                            onClick={() => handleRetryTask(task.id)}
                        >
                            重试
                        </button>
                        <button 
                            className="btn-delete"
                            onClick={() => handleDeleteTask(task.id)}
                        >
                            删除
                        </button>
                    </>
                );
            default:
                return (
                    <button 
                        className="btn-delete"
                        onClick={() => handleDeleteTask(task.id)}
                    >
                        删除
                    </button>
                );
        }
    };

    return (
        <div className="app-container">
            {/* 上方动态内容区域 */}
            <div className="top-section">

                {/* 动态文本内容 */}
                <div className="dynamic-content">
                    <h2>{buttonContents[activeButton as keyof typeof buttonContents].title}</h2>
                    <p>{dynamicText}</p>
                </div>
            </div>

            {/* 下方任务列表区域 */}
            <div className="bottom-section">
                <div className="tasks-header">
                    <h3>审查任务列表</h3>
                    <span className="task-count">
                        共 {tasks.length} 个任务
                    </span>
                </div>
                
                <div 
                    className="task-list"
                    ref={taskListRef}
                    onScroll={handleScroll}
                >
                    {tasks.map(task => {
                        const statusInfo = getStatusInfo(task.status);
                        
                        return (
                            <div 
                                key={task.id} 
                                className="task-item"
                            >
                                {/* 左侧：标题 */}
                                <div className="task-left">
                                    <h4 className="task-title">{task.title}</h4>
                                </div>

                                {/* 右侧：状态和操作按钮 */}
                                <div className="task-right">
                                    {/* 状态显示 */}
                                    <div 
                                        className="status-indicator"
                                        style={{
                                            color: statusInfo.color,
                                            backgroundColor: statusInfo.bgColor
                                        }}
                                    >
                                        <span className="status-icon">{statusInfo.icon}</span>
                                        <span className="status-text">{statusInfo.text}</span>
                                    </div>

                                    {/* 操作按钮 */}
                                    <div className="action-buttons">
                                        {renderActionButtons(task)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* 加载状态 */}
                    {loading && (
                        <div className="loading-indicator">
                            <div className="spinner"></div>
                            <span>加载中...</span>
                        </div>
                    )}
                    
                    {/* 无更多数据提示 */}
                    {!hasMore && (
                        <div className="no-more-data">
                            <span>没有更多任务了</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;