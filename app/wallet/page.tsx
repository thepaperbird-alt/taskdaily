import Header from '@/components/Header';
import MobileNav from '@/components/MobileNav';

export default function WalletPage() {
  return (
    <main className="h-[100dvh] flex flex-col bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      {/* Header */}
      <Header activeTab="wallet" />

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-[#F8F9FA] dark:bg-neutral-950 flex flex-col">
          <iframe 
            src="https://expense-track-theta-one.vercel.app/" 
            className="w-full h-full border-none flex-1"
            title="Expense Daily"
            allow="payment; camera; microphone; clipboard-read; clipboard-write; geolocation"
          />
      </div>

      {/* Mobile Nav */}
      <MobileNav activeTab="wallet" />
    </main>
  );
}
