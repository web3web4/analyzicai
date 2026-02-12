import { Upload, Brain, CheckCircle2, Sparkles } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Select & Configure',
    description: 'Choose the specialized tool that fits your needs, share your work, and configure your preferred AI providers and analysis settings.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Brain,
    title: 'Parallel Processing',
    description: 'Each AI provider independently applies its unique analytical framework, generating diverse perspectives concurrently.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Sparkles,
    title: 'Cross-Validation Layer',
    description: 'Providers examine alternative viewpoints, identifying consensus areas and resolving discrepancies through comparative analysis, idea pollination and rethinking based on other models feedback.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: CheckCircle2,
    title: 'Synthesis & Delivery',
    description: 'A unified synthesis emerges, combining validated insights with prioritized recommendations from all analytical streams.',
    color: 'from-green-500 to-emerald-500',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Simple, powerful, and intelligent - our multi-step AI pipeline delivers results
          </p>
        </div>

        <div className="relative">
          {/* Connection lines for desktop */}
          <div className="hidden lg:block absolute top-10 left-0 right-0 px-20 z-0">
            <div className="h-1 bg-gradient-to-r from-primary-300 via-secondary-300 to-primary-300 dark:from-primary-800 dark:via-secondary-800 dark:to-primary-800 rounded-full shadow-lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step number for mobile/tablet */}
                <div className="flex lg:flex-col items-center lg:items-center mb-4 lg:mb-0">
                  <div className={`relative z-20 w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-xl mb-0 lg:mb-6 ring-4 ring-white dark:ring-gray-900`}>
                    <step.icon className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                  </div>
                  
                  {/* Step number badge */}
                  <div className={`lg:absolute lg:-top-3 lg:right-1/2 lg:transform lg:translate-x-1/2 ml-4 lg:ml-0 w-8 h-8 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-lg z-30 ring-2 ring-white dark:ring-gray-900`}>
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                </div>

                <div className="text-center relative z-10">
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-16 p-8 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border border-primary-100 dark:border-gray-600">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Advanced Multi-Step Pipeline
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                Our unique approach combines the strengths of multiple AI providers, with cross-validation and synthesis to deliver the most accurate and comprehensive analysis.
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-2 px-6 py-3 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  3-Step Validation
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
