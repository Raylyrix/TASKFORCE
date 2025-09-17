'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';

interface LLMProvider {
  id: string;
  name: string;
  description: string;
  website: string;
  pricing: string;
  features: string[];
  recommended: boolean;
}

const providers: LLMProvider[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access to multiple AI models from various providers',
    website: 'https://openrouter.ai',
    pricing: 'Pay per use',
    features: ['Multiple models', 'Cost effective', 'Easy setup'],
    recommended: true
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5 Turbo, and other OpenAI models',
    website: 'https://openai.com',
    pricing: 'Per token',
    features: ['GPT-4', 'GPT-3.5', 'DALL-E', 'Whisper'],
    recommended: false
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.5 Sonnet and other Anthropic models',
    website: 'https://anthropic.com',
    pricing: 'Per token',
    features: ['Claude 3.5', 'Long context', 'High quality'],
    recommended: false
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini Pro and other Google AI models',
    website: 'https://ai.google.dev',
    pricing: 'Per request',
    features: ['Gemini Pro', 'Multimodal', 'Google integration'],
    recommended: false
  }
];

export function LLMProviderSettings() {
  const [selectedProvider, setSelectedProvider] = useState('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load current settings
    if (window.electronAPI) {
      window.electronAPI.getUserSettings().then(settings => {
        setUserSettings(settings);
        setSelectedProvider(settings.llmProvider || 'openrouter');
        setApiKey(settings[`${settings.llmProvider || 'openrouter'}ApiKey`] || '');
      });
    }
  }, []);

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    setApiKey(userSettings?.[`${providerId}ApiKey`] || '');
    setTestResult(null);
  };

  const testConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey
        })
      });

      const result = await response.json();
      setTestResult({
        success: result.success,
        message: result.message || result.error || 'Connection test completed'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection. Please check your network and try again.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveSettings = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key' });
      return;
    }

    setIsSaving(true);

    try {
      if (window.electronAPI) {
        await window.electronAPI.saveUserSettings({
          llmProvider: selectedProvider,
          [`${selectedProvider}ApiKey`]: apiKey
        });
      }

      // Also save to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/settings/llm-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResult({ success: true, message: 'Settings saved successfully!' });
      } else {
        setTestResult({ success: false, message: result.error || 'Failed to save settings' });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to save settings. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedProviderInfo = providers.find(p => p.id === selectedProvider);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Provider Settings</h1>
        <p className="text-gray-600">
          Configure your preferred AI provider for smart email features and automation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Provider Selection */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Provider</h2>
            <div className="space-y-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedProvider === provider.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleProviderChange(provider.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-900">{provider.name}</h3>
                        {provider.recommended && (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                      <div className="flex items-center mt-2">
                        <span className="text-sm text-gray-500 mr-4">Pricing: {provider.pricing}</span>
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Website
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {provider.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-4">
                      <input
                        type="radio"
                        name="provider"
                        value={provider.id}
                        checked={selectedProvider === provider.id}
                        onChange={() => handleProviderChange(provider.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration</h2>
            
            {selectedProviderInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">How to get your API key:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Visit {selectedProviderInfo.name} website</li>
                      <li>Sign up or log in to your account</li>
                      <li>Navigate to API keys or settings section</li>
                      <li>Create a new API key</li>
                      <li>Copy the key and paste it below</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${selectedProviderInfo?.name} API key`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your API key is encrypted and stored securely
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={testConnection}
                  disabled={isTesting || !apiKey.trim()}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Key className="w-4 h-4 mr-2" />
                  )}
                  Test Connection
                </button>
                <button
                  onClick={saveSettings}
                  disabled={isSaving || !apiKey.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Save Settings
                </button>
              </div>

              {testResult && (
                <div className={`p-4 rounded-lg flex items-start ${
                  testResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                  )}
                  <div className="text-sm">
                    <p className={`font-medium ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.success ? 'Success!' : 'Error'}
                    </p>
                    <p className={`${
                      testResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {testResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Current Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Provider</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedProviderInfo?.name || 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Key</span>
                <span className="text-sm font-medium text-gray-900">
                  {apiKey ? '••••••••' : 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    apiKey ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900">
                    {apiKey ? 'Configured' : 'Not configured'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
