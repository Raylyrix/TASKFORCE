'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  Sparkles, 
  Bot, 
  Zap,
  Clock,
  Send,
  Inbox,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface DashboardStats {
  emailsSent: number;
  emailsReceived: number;
  responseTime: number;
  satisfactionScore: number;
  aiInsights: number;
  scheduledEmails: number;
}

interface AITask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  estimatedTime: string;
}

export function EnhancedDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    emailsSent: 0,
    emailsReceived: 0,
    responseTime: 0,
    satisfactionScore: 0,
    aiInsights: 0,
    scheduledEmails: 0
  });

  const [aiTasks, setAiTasks] = useState<AITask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<any>(null);

  useEffect(() => {
    // Load user settings and stats
    const loadData = async () => {
      if (window.electronAPI) {
        const settings = await window.electronAPI.getUserSettings();
        setUserSettings(settings);
      }
      
      // Load dashboard stats
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/analytics/overview`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
      
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleAITask = async (taskId: string) => {
    setAiTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'in-progress' }
        : task
    ));

    try {
      // Simulate AI task execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAiTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed' }
          : task
      ));
    } catch (error) {
      setAiTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'failed' }
          : task
      ));
    }
  };

  const createAITask = async (type: string) => {
    const newTask: AITask = {
      id: Date.now().toString(),
      title: `AI ${type} Task`,
      description: `Automated ${type.toLowerCase()} processing`,
      status: 'pending',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      estimatedTime: '2-5 min'
    };

    setAiTasks(prev => [newTask, ...prev]);
    await handleAITask(newTask.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Taskforce Mailer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Emails Sent"
            value={stats.emailsSent}
            icon={<Send className="w-5 h-5" />}
            color="blue"
            trend="+12%"
          />
          <StatCard
            title="Emails Received"
            value={stats.emailsReceived}
            icon={<Inbox className="w-5 h-5" />}
            color="green"
            trend="+8%"
          />
          <StatCard
            title="Avg Response Time"
            value={`${stats.responseTime}m`}
            icon={<Clock className="w-5 h-5" />}
            color="yellow"
            trend="-15%"
          />
          <StatCard
            title="Satisfaction Score"
            value={`${stats.satisfactionScore}%`}
            icon={<Star className="w-5 h-5" />}
            color="purple"
            trend="+5%"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Assistant Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Bot className="w-6 h-6 mr-2 text-blue-600" />
                  AI Assistant
                </h2>
                <div className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Active
                </div>
              </div>

              {/* AI Quick Actions */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => createAITask('Email Draft')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Sparkles className="w-5 h-5 text-blue-600 mb-2" />
                  <div className="font-medium text-gray-900">Draft Email</div>
                  <div className="text-sm text-gray-500">AI-powered email composition</div>
                </button>
                <button
                  onClick={() => createAITask('Response')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Zap className="w-5 h-5 text-green-600 mb-2" />
                  <div className="font-medium text-gray-900">Smart Reply</div>
                  <div className="text-sm text-gray-500">Intelligent response suggestions</div>
                </button>
                <button
                  onClick={() => createAITask('Analysis')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <BarChart3 className="w-5 h-5 text-purple-600 mb-2" />
                  <div className="font-medium text-gray-900">Email Analysis</div>
                  <div className="text-sm text-gray-500">Sentiment and priority analysis</div>
                </button>
                <button
                  onClick={() => createAITask('Schedule')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Calendar className="w-5 h-5 text-orange-600 mb-2" />
                  <div className="font-medium text-gray-900">Smart Schedule</div>
                  <div className="text-sm text-gray-500">Optimal send time suggestions</div>
                </button>
              </div>

              {/* AI Tasks List */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Recent AI Tasks</h3>
                <div className="space-y-3">
                  {aiTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          {task.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                          {task.status === 'in-progress' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                          {task.status === 'failed' && <AlertCircle className="w-5 h-5 text-red-500" />}
                          {task.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-500">{task.description}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{task.estimatedTime}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Scheduled Emails */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Scheduled Emails
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium text-gray-900">Weekly Report</div>
                  <div className="text-sm text-gray-500">Tomorrow at 9:00 AM</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-gray-900">Follow-up Email</div>
                  <div className="text-sm text-gray-500">Friday at 2:00 PM</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="font-medium text-gray-900">Meeting Reminder</div>
                  <div className="text-sm text-gray-500">Monday at 8:00 AM</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="font-medium text-gray-900">Compose Email</div>
                  <div className="text-sm text-gray-500">Start a new email</div>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="font-medium text-gray-900">Schedule Email</div>
                  <div className="text-sm text-gray-500">Set up automated sending</div>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="font-medium text-gray-900">View Analytics</div>
                  <div className="text-sm text-gray-500">Check performance metrics</div>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="font-medium text-gray-900">AI Settings</div>
                  <div className="text-sm text-gray-500">Configure AI preferences</div>
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Service</span>
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">AI Provider</span>
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">{userSettings?.llmProvider || 'OpenRouter'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Scheduled Jobs</span>
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">Running</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, trend }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend: string;
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-green-600 flex items-center mt-1">
            <TrendingUp className="w-4 h-4 mr-1" />
            {trend}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
