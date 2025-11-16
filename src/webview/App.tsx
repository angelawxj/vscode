import React, { useState, useEffect, useRef } from 'react';
import TopSection from './components/TopSection';
import TaskListSection from './components/TaskListSection';

interface Task {
    id: number;
    title: string;
    status: 'completed' | 'in-progress' | 'timeout';
}

const App: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isTaskListCollapsed, setIsTaskListCollapsed] = useState<boolean>(false);
    const taskListRef = useRef<HTMLDivElement>(null);

    // 模拟获取任务数据
    const fetchTasks = async (pageNum: number, search: string = '', isSearch: boolean = false) => {
        if (isSearch) {
            setSearchLoading(true);
        } else {
            setLoading(true);
        }
        
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const newTasks: Task[] = Array.from({ length: 20 }, (_, index) => {
            const taskId = (pageNum - 1) * 20 + index + 1;
            const statuses: ('completed' | 'in-progress' | 'timeout')[] = ['completed', 'in-progress', 'timeout'];
            
            return {
                id: taskId,
                title: search ? `搜索任务 ${taskId} - ${search}` : `代码审查任务 ${taskId}`,
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
        setSearchLoading(false);
    };

    // 初始加载和页面变化时获取数据
    useEffect(() => {
        fetchTasks(1);
    }, []);

    // 处理搜索
    const handleSearch = () => {
        if (searchLoading) return;
        
        setPage(1);
        setHasMore(true);
        fetchTasks(1, searchTerm, true);
    };

    // 处理回车键搜索
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // 处理滚动加载
    const handleScroll = () => {
        if (!taskListRef.current || loading || !hasMore) return;

        const { scrollTop, scrollHeight, clientHeight } = taskListRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

        if (isAtBottom) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchTasks(nextPage, searchTerm);
        }
    };

    // 删除任务
    const handleDeleteTask = (taskId: number) => {
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        setTasks(updatedTasks);
    };

    // 查看结果
    const handleViewResult = (taskId: number) => {
        alert(`查看代码审查任务 ${taskId} 的结果`);
    };

    // 重试任务
    const handleRetryTask = (taskId: number) => {
        alert(`重试代码审查任务 ${taskId}`);
        setTasks(prev => prev.map(task => 
            task.id === taskId ? { ...task, status: 'in-progress' } : task
        ));
    };

    // 切换任务列表折叠状态
    const toggleTaskListCollapse = () => {
        setIsTaskListCollapsed(!isTaskListCollapsed);
    };

    return (
        <div className="app-container">
            {/* 上方动态内容区域 */}
            <TopSection />
            
            {/* 下方任务列表区域 */}
            <TaskListSection
                tasks={tasks}
                loading={loading}
                searchLoading={searchLoading}
                hasMore={hasMore}
                searchTerm={searchTerm}
                isTaskListCollapsed={isTaskListCollapsed}
                taskListRef={taskListRef}
                onSearchTermChange={setSearchTerm}
                onSearch={handleSearch}
                onKeyPress={handleKeyPress}
                onScroll={handleScroll}
                onDeleteTask={handleDeleteTask}
                onViewResult={handleViewResult}
                onRetryTask={handleRetryTask}
                onToggleCollapse={toggleTaskListCollapse}
            />
        </div>
    );
};

export default App;