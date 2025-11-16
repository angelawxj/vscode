import React from 'react';
import { SearchIcon, RefreshIcon, ToggleIcon,TaskIcon } from '../Icon';

interface Task {
    id: number;
    title: string;
    status: 'completed' | 'in-progress' | 'timeout';
}

interface TaskListSectionProps {
    tasks: Task[];
    loading: boolean;
    searchLoading: boolean;
    hasMore: boolean;
    searchTerm: string;
    isTaskListCollapsed: boolean;
    taskListRef: React.RefObject<HTMLDivElement>;
    onSearchTermChange: (term: string) => void;
    onSearch: () => void;
    onKeyPress: (e: React.KeyboardEvent) => void;
    onScroll: () => void;
    onDeleteTask: (taskId: number) => void;
    onViewResult: (taskId: number) => void;
    onRetryTask: (taskId: number) => void;
    onToggleCollapse: () => void;
}

const TaskListSection: React.FC<TaskListSectionProps> = ({
    tasks,
    loading,
    searchLoading,
    hasMore,
    searchTerm,
    isTaskListCollapsed,
    taskListRef,
    onSearchTermChange,
    onSearch,
    onKeyPress,
    onScroll,
    onDeleteTask,
    onViewResult,
    onRetryTask,
    onToggleCollapse
}) => {
    // 获取状态图标和颜色
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'completed':
                return {
                    icon: '✓',
                    color: '#10b981',
                    text: '已完成',
                    bgColor: 'rgba(16, 185, 129, 0.1)',
                    rotating: false
                };
            case 'in-progress':
                return {
                    icon: <RefreshIcon className="refresh-icon" color="rgb(245, 158, 11)" />,
                    color: '#f59e0b',
                    text: '进行中',
                    bgColor: 'rgba(245, 158, 11, 0.1)',
                    borderColor: 'rgba(245, 158, 11, 0.2)',
                    rotating: true
                };
            case 'timeout':
                return {
                    icon: '⚠',
                    color: '#ef4444',
                    text: '超时',
                    bgColor: 'rgba(239, 68, 68, 0.1)',
                    rotating: false
                };
            default:
                return {
                    icon: '?',
                    color: '#6b7280',
                    text: '未知',
                    bgColor: 'rgba(107, 114, 128, 0.1)',
                    rotating: false
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
                            onClick={() => onViewResult(task.id)}
                        >
                            查看结果
                        </button>
                        <button 
                            className="btn-delete"
                            onClick={() => onDeleteTask(task.id)}
                        >
                            删除
                        </button>
                    </>
                );
            case 'in-progress':
                return (
                    <button 
                        className="btn-delete"
                        onClick={() => onDeleteTask(task.id)}
                    >
                        删除
                    </button>
                );
            case 'timeout':
                return (
                    <>
                        <button 
                            className="btn-retry"
                            onClick={() => onRetryTask(task.id)}
                        >
                            重试
                        </button>
                        <button 
                            className="btn-delete"
                            onClick={() => onDeleteTask(task.id)}
                        >
                            删除
                        </button>
                    </>
                );
            default:
                return (
                    <button 
                        className="btn-delete"
                        onClick={() => onDeleteTask(task.id)}
                    >
                        删除
                    </button>
                );
        }
    };

    return (
        <div className="bottom-section">
            <div className="tasks-header">
                {/* 左侧：标题和折叠按钮 */}
                <div className="header-left">
                    <div className="title-with-toggle">
                        <button 
                            className="collapse-toggle"
                            onClick={onToggleCollapse}
                            title={isTaskListCollapsed ? "展开列表" : "折叠列表"}
                        >
                            <span className={`toggle-icon ${isTaskListCollapsed ? 'collapsed' : ''}`}>
                                <ToggleIcon />
                            </span>
                        </button>
                        <span className='tasks-title'>任务列表</span>
                    </div>
                </div>
                
                {/* 右侧：搜索框 */}
                <div className="header-right">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="搜索任务..."
                            value={searchTerm}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                            onKeyPress={onKeyPress}
                            className="search-input"
                            disabled={searchLoading}
                        />
                        <button 
                            onClick={onSearch}
                            className={`search-button ${searchLoading ? 'searching' : ''}`}
                            disabled={searchLoading}
                        >
                            <SearchIcon className="ab" />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* 任务列表 - 根据折叠状态显示/隐藏 */}
            {!isTaskListCollapsed && (
                <div 
                    className="task-list"
                    ref={taskListRef}
                    onScroll={onScroll}
                >
                    {/* 搜索加载状态 */}
                    {searchLoading && (
                        <div className="search-loading-indicator">
                            <div className="search-spinner-large"></div>
                            <span>搜索中...</span>
                        </div>
                    )}
                    
                    {!searchLoading && tasks.map(task => {
                        const statusInfo = getStatusInfo(task.status);
                        
                        return (
                            <div 
                                key={task.id} 
                                className="task-item"
                            >
                                <div className="task-left">
                                    <h4 className="task-title" title={task.title}>{task.title}</h4>
                                </div>

                                <div className="task-right">
                                    <div 
                                        className="status-indicator"
                                        style={{
                                            color: statusInfo.color,
                                            backgroundColor: statusInfo.bgColor
                                        }}
                                    >
                                        <span className={`status-icon ${statusInfo.rotating ? 'rotating' : ''}`}>
                                            {statusInfo.icon}
                                        </span>
                                        <span className="status-text">{statusInfo.text}</span>
                                    </div>

                                    <div className="action-buttons">
                                        {renderActionButtons(task)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* 滚动加载状态 */}
                    {loading && !searchLoading && (
                        <div className="loading-indicator">
                            <div className="spinner"></div>
                            <span>加载更多任务...</span>
                        </div>
                    )}
                    
                    {/* 无更多数据提示 */}
                    {!hasMore && tasks.length > 0 && (
                        <div className="no-more-data">
                            <span>没有更多任务了</span>
                        </div>
                    )}
                    
                    {/* 无数据提示 */}
                    {!searchLoading && tasks.length === 0 && (
                        <div className="no-data">
                            <span>暂无任务数据</span>
                        </div>
                    )}
                </div>
            )}

            {/* 折叠状态提示 */}
            {isTaskListCollapsed && (
                <div className="collapsed-placeholder">
                    <div className="placeholder-content">
                        <span className="placeholder-icon"><TaskIcon /></span>
                        <span className="placeholder-text">任务列表已折叠</span>
                        <button 
                            className="expand-button"
                            onClick={onToggleCollapse}
                        >
                            展开列表
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskListSection;