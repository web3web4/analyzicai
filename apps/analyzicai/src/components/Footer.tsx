import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    apps: [
      { name: 'UXicAI', href: 'https://UXicAI.com' },
      { name: 'SolidicAI', href: 'https://SolidicAI.com' },
    ],
    otherCompanyApps: [
      { name: 'NearGami', href: 'https://neargami.com' },
      { name: 'TACoSec', href: 'https://tacosec.com' },
    ],
  };

  const socialLinks = [
    { icon: Github, href: 'https://github.com/web3web4/analyzicai', label: 'GitHub' },
    // { icon: Twitter, href: '#', label: 'Twitter' },
    // { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:hello+analyzicai@web3web4.com', label: 'Email' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold text-white ml-2">
                AnalyzicAI
              </span>
            </Link>
            <p className="text-gray-400 mb-4 max-w-md">
              Empowering developers and designers with AI-powered analysis tools for UI/UX, smart contracts, and more.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
                  aria-label={social.label}
                  target="_blank"
                >
                  <social.icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>
          <div></div>
          {/* Apps */}
          <div>
            <h3 className="text-white font-semibold mb-4">AnalyzicAI Apps</h3>
            <ul className="space-y-2">
              {links.apps.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="hover:text-primary-400 transition-colors"
                    target="_blank"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>


          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">More from Web3Web4</h3>
            <ul className="space-y-2">
              {links.otherCompanyApps.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="hover:text-primary-400 transition-colors"
                    target="_blank"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © {currentYear} AnalyzicAI. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 text-sm">
            <Link href="https://web3web4.com" target="_blank" className="hover:text-primary-400 transition-colors">
              Made with ❤️ by Web3Web4.com
            </Link>
            </div>
          </div>
        {/* <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © {currentYear} AnalyzicAI. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 text-sm">
            <Link href="#" className="hover:text-primary-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-primary-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-primary-400 transition-colors">
              Cookies
            </Link>
          </div>
        </div> */}
      </div>
    </footer>
  );
}
