import { Brain, Zap, Shield, Layers, Target, Workflow } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Multi-AI Intelligence',
    description: 'Harness OpenAI, Gemini, and Claude simultaneously for deeper, more accurate collective-thinking analysis.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Get expert-level feedback in minutes instead of hours of manual work.',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Enterprise-grade encryption with privacy controls and BYOK (Bring Your Own Keys) support.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Layers,
    title: 'Multi-Step Pipeline',
    description: 'Cross-provider validation and synthesis for maximum accuracy and a minimum bias.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Target,
    title: 'Precision Analysis',
    description: 'Domain-specific analysis for UI/UX design, smart contracts security and efficiency, and more to come use-cases!',
    gradient: 'from-red-500 to-rose-500',
  },
  {
    icon: Workflow,
    title: 'Seamless Integration',
    description: 'Upload UI screenshots or provide smart contract codes, and get actionable insights.',
    gradient: 'from-indigo-500 to-blue-500',
  },
] as const;

export default function Features() {
  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to analyze, optimize, and enhance your projects with AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-800 hover:scale-105"
            >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold ml-2 text-gray-900 dark:text-gray-100">
                    {feature.title}
                  </h3>
                </div>
              
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
