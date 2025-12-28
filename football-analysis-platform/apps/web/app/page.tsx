import Link from "next/link";
import { 
  LineChart, 
  BrainCircuit, 
  Wallet, 
  ArrowRight, 
  CheckCircle2, 
  Menu 
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      
      {/* --- Navbar --- */}
      <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <LineChart className="w-5 h-5 text-slate-950" strokeWidth={3} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Ball-Insights
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium hover:text-white transition-colors">
              Login
            </Link>
            <Link 
              href="/register" 
              className="bg-white text-slate-950 px-5 py-2 rounded-full text-sm font-bold hover:bg-emerald-400 transition-all duration-300"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Icon */}
          <button className="md:hidden text-slate-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-16">
        
        {/* --- Hero Section --- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center py-20 lg:py-32 relative overflow-hidden">
          
          {/* Background Glow Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] -z-10" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-semibold mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live AI Engine v2.0 is Online
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 max-w-4xl">
            Beat the Bookies with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              AI & Live Stats
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
            Stop guessing. Start winning. Get real-time pressure graphs, AI-powered predictions, 
            and high-value opportunities funded directly via USDT.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/register" 
              className="group flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 px-8 py-4 rounded-xl text-lg font-bold hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/demo" 
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold text-white border border-slate-800 hover:bg-slate-900 transition-colors"
            >
              View Live Demo
            </Link>
          </div>
        </section>

        {/* --- Features Grid --- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1: AI */}
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-emerald-500/50 transition-colors group">
              <div className="bg-slate-950 w-12 h-12 rounded-lg flex items-center justify-center border border-slate-800 mb-6 group-hover:border-emerald-500/50">
                <BrainCircuit className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Advanced AI Engine</h3>
              <p className="text-slate-400 leading-relaxed">
                Our Machine Learning models are trained on over 10 years of historical match data to predict outcomes with high accuracy.
              </p>
            </div>

            {/* Feature 2: Pressure */}
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-emerald-500/50 transition-colors group">
              <div className="bg-slate-950 w-12 h-12 rounded-lg flex items-center justify-center border border-slate-800 mb-6 group-hover:border-emerald-500/50">
                <LineChart className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Pressure Graphs</h3>
              <p className="text-slate-400 leading-relaxed">
                Visualize dominance in real-time. See which team is pushing for a goal before the odds change.
              </p>
            </div>

            {/* Feature 3: Crypto */}
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-emerald-500/50 transition-colors group">
              <div className="bg-slate-950 w-12 h-12 rounded-lg flex items-center justify-center border border-slate-800 mb-6 group-hover:border-emerald-500/50">
                <Wallet className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Crypto Payments</h3>
              <p className="text-slate-400 leading-relaxed">
                Seamless and anonymous access. Pay instantly with USDT (TRC20/BEP20) and unlock premium features automatically.
              </p>
            </div>

          </div>
        </section>

        {/* --- Social Proof / Trust --- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center border-t border-slate-900 mt-12">
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-widest mb-8">Trusted by 2,000+ Pro Bettors</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Mock Logos - You can replace these later */}
            <div className="text-2xl font-bold text-slate-300">BET<span className="text-emerald-500">PRO</span></div>
            <div className="text-2xl font-bold text-slate-300">ODDS<span className="text-blue-500">MASTER</span></div>
            <div className="text-2xl font-bold text-slate-300">SCORE<span className="text-purple-500">LAB</span></div>
          </div>
        </section>

      </main>

      {/* --- Footer --- */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1 rounded">
              <LineChart className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="font-semibold text-slate-300">Ball-Insights</span>
          </div>
          
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} Ball-Insights Analytics. All rights reserved.
          </p>

          <div className="flex gap-6">
            <a href="#" className="text-slate-500 hover:text-emerald-500 text-sm">Terms</a>
            <a href="#" className="text-slate-500 hover:text-emerald-500 text-sm">Privacy</a>
            <a href="#" className="text-slate-500 hover:text-emerald-500 text-sm">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}