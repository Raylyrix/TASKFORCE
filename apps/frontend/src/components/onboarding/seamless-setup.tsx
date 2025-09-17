'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, Settings, Key, Mail, Database, Sparkles } from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  autoSetup: boolean;
}

export function SeamlessSetup() {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'supabase',
      title: 'Database Setup',
      description: 'Setting up your secure cloud database automatically',
      icon: <Database className="w-6 h-6" />,
      status: 'pending',
      autoSetup: true
    },
    {
      id: 'google-auth',
      title: 'Google Authentication',
      description: 'Connect your Google account for seamless login',
      icon: <Key className="w-6 h-6" />,
      status: 'pending',
      autoSetup: false
    },
    {
      id: 'email-config',
      title: 'Email Configuration',
      description: 'Configure your email settings for sending',
      icon: <Mail className="w-6 h-6" />,
      status: 'pending',
      autoSetup: false
    },
    {
      id: 'llm-provider',
      title: 'AI Provider Setup',
      description: 'Choose your preferred AI provider for smart features',
      icon: <Sparkles className="w-6 h-6" />,
      status: 'pending',
      autoSetup: false
    }
  ]);

  const [isComplete, setIsComplete] = useState(false);
  const [userSettings, setUserSettings] = useState<any>(null);

  useEffect(() => {
    // Load user settings
    if (window.electronAPI) {
      window.electronAPI.getUserSettings().then(setUserSettings);
    }
  }, []);

  const handleAutoSetup = async (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status: 'in-progress' }
        : step
    ));

    try {
      let result;
      
      switch (stepId) {
        case 'supabase':
          result = await window.electronAPI?.setupSupabaseAutomatically();
          break;
        default:
          result = { success: false, error: 'Auto setup not available' };
      }

      setSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { ...step, status: result.success ? 'completed' : 'error' }
          : step
      ));

      if (result.success) {
        // Move to next step
        setTimeout(() => {
          setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
        }, 1000);
      }
    } catch (error) {
      setSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { ...step, status: 'error' }
          : step
      ));
    }
  };

  const handleGoogleAuth = async () => {
    setSteps(prev => prev.map(step => 
      step.id === 'google-auth' 
        ? { ...step, status: 'in-progress' }
        : step
    ));

    try {
      const result = await window.electronAPI?.handleGoogleOAuth();
      
      if (result.success) {
        // Listen for authentication completion
        window.electronAPI?.onUserAuthenticated((event: any, data: any) => {
          setSteps(prev => prev.map(step => 
            step.id === 'google-auth' 
              ? { ...step, status: 'completed' }
              : step
          ));
          
          // Move to next step
          setTimeout(() => {
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
          }, 1000);
        });
      }
    } catch (error) {
      setSteps(prev => prev.map(step => 
        step.id === 'google-auth' 
          ? { ...step, status: 'error' }
          : step
      ));
    }
  };

  const handleEmailConfig = async (config: any) => {
    setSteps(prev => prev.map(step => 
      step.id === 'email-config' 
        ? { ...step, status: 'in-progress' }
        : step
    ));

    try {
      const result = await window.electronAPI?.testEmailConfiguration(config);
      
      setSteps(prev => prev.map(step => 
        step.id === 'email-config' 
          ? { ...step, status: result.success ? 'completed' : 'error' }
          : step
      ));

      if (result.success) {
        // Save settings
        await window.electronAPI?.saveUserSettings({
          smtpConfigured: true,
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort,
          smtpUser: config.smtpUser,
          smtpPass: config.smtpPass
        });

        // Move to next step
        setTimeout(() => {
          setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
        }, 1000);
      }
    } catch (error) {
      setSteps(prev => prev.map(step => 
        step.id === 'email-config' 
          ? { ...step, status: 'error' }
          : step
      ));
    }
  };

  const handleLLMProvider = async (provider: string, apiKey: string) => {
    setSteps(prev => prev.map(step => 
      step.id === 'llm-provider' 
        ? { ...step, status: 'in-progress' }
        : step
    ));

    try {
      // Save LLM provider settings
      await window.electronAPI?.saveUserSettings({
        llmProvider: provider,
        [`${provider}ApiKey`]: apiKey
      });

      setSteps(prev => prev.map(step => 
        step.id === 'llm-provider' 
          ? { ...step, status: 'completed' }
          : step
      ));

      // Complete setup
      setTimeout(() => {
        setIsComplete(true);
      }, 1000);
    } catch (error) {
      setSteps(prev => prev.map(step => 
        step.id === 'llm-provider' 
          ? { ...step, status: 'error' }
          : step
      ));
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Setup Complete!</h2>
          <p className="text-gray-600 mb-6">
            Your Taskforce Mailer is ready to use. All features are now available.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Start Using Taskforce Mailer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Taskforce Mailer</h1>
          <p className="text-gray-600">
            Let&apos;s set up your enterprise email management system in just a few steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center p-4 rounded-lg border-2 transition-all ${
                index === currentStep
                  ? 'border-blue-500 bg-blue-50'
                  : step.status === 'completed'
                  ? 'border-green-500 bg-green-50'
                  : step.status === 'error'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0 mr-4">
                {getStepStatusIcon(step.status)}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
              <div className="flex-shrink-0">
                {step.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 0 && (
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Setting up your database...</h3>
              <p className="text-gray-600 mb-6">
                We&apos;re automatically configuring your secure cloud database. This will only take a moment.
              </p>
              <button
                onClick={() => handleAutoSetup('supabase')}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start Database Setup
              </button>
            </div>
          )}

          {currentStep === 1 && (
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Connect your Google account</h3>
              <p className="text-gray-600 mb-6">
                This allows you to access your Gmail and Google Calendar seamlessly.
              </p>
              <button
                onClick={handleGoogleAuth}
                className="bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center mx-auto"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <EmailConfigurationStep onComplete={handleEmailConfig} />
          )}

          {currentStep === 3 && (
            <LLMProviderStep onComplete={handleLLMProvider} />
          )}
        </div>
      </div>
    </div>
  );
}

// Email Configuration Component
function EmailConfigurationStep({ onComplete }: { onComplete: (config: any) => void }) {
  const [config, setConfig] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    testEmail: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(config);
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Configure your email settings</h3>
      <p className="text-gray-600 mb-6">
        Set up your SMTP configuration to enable email sending features.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
            <input
              type="text"
              value={config.smtpHost}
              onChange={(e) => setConfig({...config, smtpHost: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
            <input
              type="number"
              value={config.smtpPort}
              onChange={(e) => setConfig({...config, smtpPort: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            value={config.smtpUser}
            onChange={(e) => setConfig({...config, smtpUser: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your-email@gmail.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">App Password</label>
          <input
            type="password"
            value={config.smtpPass}
            onChange={(e) => setConfig({...config, smtpPass: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your Gmail app password"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use Gmail App Password, not your regular password
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Test Email</label>
          <input
            type="email"
            value={config.testEmail}
            onChange={(e) => setConfig({...config, testEmail: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="test@example.com"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Test & Save Configuration
        </button>
      </form>
    </div>
  );
}

// LLM Provider Component
function LLMProviderStep({ onComplete }: { onComplete: (provider: string, apiKey: string) => void }) {
  const [provider, setProvider] = useState('openrouter');
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(provider, apiKey);
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Choose your AI provider</h3>
      <p className="text-gray-600 mb-6">
        Select your preferred AI provider for smart email features and automation.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">AI Provider</label>
          <div className="space-y-2">
            {[
              { id: 'openrouter', name: 'OpenRouter (Recommended)', desc: 'Access to multiple models' },
              { id: 'openai', name: 'OpenAI', desc: 'GPT-4, GPT-3.5 Turbo' },
              { id: 'anthropic', name: 'Anthropic', desc: 'Claude 3.5 Sonnet' }
            ].map((option) => (
              <label key={option.id} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="provider"
                  value={option.id}
                  checked={provider === option.id}
                  onChange={(e) => setProvider(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">{option.name}</div>
                  <div className="text-sm text-gray-500">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your API key"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your API key is stored securely and never shared
          </p>
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Save AI Configuration
        </button>
      </form>
    </div>
  );
}
