import { Palette, Code2, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const apps = [
  {
    name: 'UXicAI',
    tagline: 'AI-Powered UI/UX Analysis',
    description: 'Upload screenshots or capture screens to get comprehensive design feedback from multiple AI providers. Analyze visual hierarchy, accessibility, user experience, and design consistency.',
    icon: Palette,
    color: 'from-blue-500 to-purple-500',
    features: [
      'Screenshot analysis with WebRTC capture',
      'Multi-provider AI vision analysis',
      'Design system recommendations',
      'Accessibility compliance checks',
      'Real-time feedback',
    ],
    url: 'https://UXicAI.com',
    status: 'Live',
  },
  {
    name: 'SolidicAI',
    tagline: 'Smart Contract Intelligence',
    description: 'Analyze Solidity smart contracts for security vulnerabilities, gas optimization opportunities, and best practice compliance. Get expert-level code review powered by AI.',
    icon: Code2,
    color: 'from-emerald-500 to-teal-500',
    features: [
      'Security vulnerability detection',
      'Gas optimization analysis',
      'Best practice compliance',
      'Code quality assessment',
      'Automated documentation',
    ],
    url: 'https://SolidicAI.com',
    status: 'Live',
  },
];

export default function AppsShowcase() {
  return (
    <section id="apps" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            AnalyzicAI Apps Family
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Specialized AI-powered analysis tools for different domains
          </p>
        </div>

        <div className="space-y-8">
          {apps.map((app, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 lg:p-12">
                {/* Left side - Info */}
                <div className="flex flex-col justify-center">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${app.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <app.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {app.name}
                      </h3>
                      <p className={`text-sm font-semibold bg-gradient-to-r ${app.color} bg-clip-text text-transparent`}>
                        {app.tagline}
                      </p>
                    </div>
                  </div>

                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {app.description}
                  </p>

                  <div className="flex items-center space-x-3 mb-8">
                    <Link
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group px-6 py-3 bg-gradient-to-r ${app.color} text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center space-x-2`}
                    >
                      <span>Visit {app.name}</span>
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-medium text-sm">
                      {app.status}
                    </span>
                  </div>
                </div>

                {/* Right side - Features */}
                <div className="flex flex-col justify-center">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Key Features
                  </h4>
                  <ul className="space-y-3">
                    {app.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <div className={`mt-1 w-5 h-5 bg-gradient-to-br ${app.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <ArrowRight className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
