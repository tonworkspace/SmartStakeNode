import React from 'react';
import { X, FileText, Shield } from 'lucide-react';

interface LegalModalsProps {
  isOpen: boolean;
  type: 'terms' | 'privacy';
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({ isOpen, type, onClose }) => {
  if (!isOpen) return null;

  const isTerms = type === 'terms';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
              {isTerms ? <FileText size={20} className="text-slate-600" /> : <Shield size={20} className="text-slate-600" />}
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {isTerms ? 'Terms of Service' : 'Privacy Policy'}
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">Last updated: December 2024</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isTerms ? <TermsContent /> : <PrivacyContent />}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-white/5">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

const TermsContent: React.FC = () => (
  <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
    <section>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">1. Acceptance of Terms</h3>
      <p>By accessing and using Smart Stake AI, you accept and agree to be bound by the terms and provision of this agreement.</p>
    </section>

    <section>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">2. Service Description</h3>
      <p>Smart Stake AI is a decentralized staking protocol built on The Open Network (TON) blockchain. We provide staking services with automated reward distribution.</p>
    </section>

    <section>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">3. Risk Disclosure</h3>
      <p>Cryptocurrency staking involves risks including but not limited to market volatility, smart contract risks, and potential loss of funds. Users participate at their own risk.</p>
    </section>

    <section>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">4. User Responsibilities</h3>
      <p>Users are responsible for maintaining the security of their wallets, private keys, and ensuring compliance with local regulations.</p>
    </section>

    <section>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">5. Limitation of Liability</h3>
      <p>Smart Stake AI shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of our services.</p>
    </section>

    <section>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">6. Modifications</h3>
      <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.</p>
    </section>
  </div>
);

const PrivacyContent: React.FC = () => (
  <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
    <section>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">1. Information We Collect</h3>
      <p>We collect wallet addresses, transaction data, and basic usage analytics to provide our staking services effectively.</p>
    </section>

    <section>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">2. How We Use Information</h3>
      <p>Your information is used to process transactions, calculate rewards, prevent fraud, and improve our services.</p>
    </section>

    <section>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">3. Data Security</h3>
      <p>We implement industry-standard security measures to protect your data. However, no system is 100% secure.</p>
    </section>

    <section>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">4. Third-Party Services</h3>
      <p>We may use third-party services for analytics and infrastructure. These services have their own privacy policies.</p>
    </section>

    <section>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">5. Data Retention</h3>
      <p>We retain your data as long as necessary to provide services and comply with legal obligations.</p>
    </section>

    <section>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">6. Your Rights</h3>
      <p>You have the right to access, correct, or delete your personal information. Contact us for data-related requests.</p>
    </section>

    <section>
      <h3 className="font-bold text-slate-900 dark:text-white mb-2">7. Contact Information</h3>
      <p>For privacy-related questions, please contact us through our official channels.</p>
    </section>
  </div>
);