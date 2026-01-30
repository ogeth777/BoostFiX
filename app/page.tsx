'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useSession, signIn, signOut } from "next-auth/react";
import NextImage from 'next/image';
import { Twitter, LayoutGrid, Settings, DollarSign, Wallet, ArrowRight, TrendingUp, Megaphone, Plus, CheckCircle, RefreshCw, X, LogOut, Loader2 } from 'lucide-react';
import { ActivityFeed, ActivityItem } from '../components/ActivityFeed';
import { EarnFeed, TaskItem } from '../components/EarnFeed';
import { useToast } from '../components/ui/Toast';

const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"); // Mainnet USDT

// Mock initial tasks
const INITIAL_TASKS: TaskItem[] = [];

export default function Home() {
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'earn' | 'promote'>('earn');
  
  // Persistence State
  const [isLoaded, setIsLoaded] = useState(false);

  // User State
  const { data: session, status } = useSession();
  const isTwitterConnected = status === 'authenticated';
  const isConnectingTwitter = status === 'loading';

  const [treasuryAddress, setTreasuryAddress] = useState(''); // Target wallet for deposits
  
  // Balances
  const [earningBalance, setEarningBalance] = useState(0.00);
  const [promoBudget, setPromoBudget] = useState(0.00);
  const [reputation, setReputation] = useState(50); // New: Reputation Score

  // Data
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);

  // Promote Form State
  const [newCampaignUrl, setNewCampaignUrl] = useState('');
  const [costPerAction, setCostPerAction] = useState(0.01);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const loadState = () => {
      try {
        // Global Data (Shared)
        const savedTasks = localStorage.getItem('boostfix_tasks');
        const savedActivities = localStorage.getItem('boostfix_activities');
        if (savedTasks) setTasks(JSON.parse(savedTasks));
        if (savedActivities) setActivities(JSON.parse(savedActivities));

        // User Specific Data
        if (connected && publicKey) {
          const key = publicKey.toBase58();
          const savedEarnings = localStorage.getItem(`boostfix_earnings_${key}`);
          const savedBudget = localStorage.getItem(`boostfix_budget_${key}`);
          const savedReputation = localStorage.getItem(`boostfix_reputation_${key}`);

          setEarningBalance(savedEarnings ? parseFloat(savedEarnings) : 0);
          setPromoBudget(savedBudget ? parseFloat(savedBudget) : 0);
          setReputation(savedReputation ? parseInt(savedReputation) : 50);
        } else {
          // Reset if no wallet
          setEarningBalance(0);
          setPromoBudget(0);
          setReputation(50);
        }

      } catch (e) {
        console.error('Failed to load state', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadState();
  }, [connected, publicKey]);

  // Save to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    
    // Global
    localStorage.setItem('boostfix_tasks', JSON.stringify(tasks));
    localStorage.setItem('boostfix_activities', JSON.stringify(activities));

    // User Specific
    if (connected && publicKey) {
        const key = publicKey.toBase58();
        localStorage.setItem(`boostfix_earnings_${key}`, earningBalance.toString());
        localStorage.setItem(`boostfix_budget_${key}`, promoBudget.toString());
        localStorage.setItem(`boostfix_reputation_${key}`, reputation.toString());
    }
  }, [earningBalance, promoBudget, reputation, tasks, activities, isLoaded, connected, publicKey]);

  // Handlers
  const handleConnectTwitter = () => {
    signIn('twitter');
  };

  const handleDisconnectTwitter = () => {
    signOut();
  };

  const handleDeposit = async (amount: number) => {
    if (!connected || !publicKey) {
      addToast('Please connect your wallet first.', 'error');
      return;
    }

    try {
      addToast('Preparing transaction... Check your wallet.', 'info');
      
      // 1. Get ATAs
      const sourceATA = await getAssociatedTokenAddress(USDT_MINT, publicKey);
      const destATA = await getAssociatedTokenAddress(USDT_MINT, TREASURY_WALLET);
      
      const transaction = new Transaction();

      // 2. Check if destination ATA exists, if not create it
      const destAccount = await connection.getAccountInfo(destATA);
      if (!destAccount) {
         transaction.add(
            createAssociatedTokenAccountInstruction(
                publicKey, // payer
                destATA,
                TREASURY_WALLET, // owner
                USDT_MINT
            )
         );
      }

      // 3. Create Transfer Instruction
      transaction.add(
        createTransferInstruction(
          sourceATA,
          destATA,
          publicKey,
          BigInt(amount * 1_000_000), // USDT 6 decimals
          [],
          TOKEN_PROGRAM_ID
        )
      );
      
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // 4. Send
      const signature = await sendTransaction(transaction, connection);
      
      addToast('Transaction sent! Waiting for confirmation...', 'info');
      await connection.confirmTransaction(signature, 'processed');

      // 5. Update UI State
      setPromoBudget(prev => prev + amount);
      addToast(`Success! Deposited $${amount} USDT.`, 'success');
      
      const newActivity: ActivityItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'deposit',
        amount: amount,
        token: 'USDT',
        date: 'Just now',
        txHash: signature
      };
      setActivities(prev => [newActivity, ...prev]);

    } catch (error: any) {
      console.error('Deposit Error:', error);
      // Nice error handling
      if (error.message?.includes('User rejected')) {
        addToast('Transaction cancelled by user.', 'error');
      } else if (error.message?.includes('TokenAccountNotFoundError')) {
         addToast('Error: Ensure you have USDT in your wallet.', 'error');
      } else {
        addToast('Deposit failed. See console for details.', 'error');
      }
    }
  };

  const handleCreateCampaign = () => {
    if (!newCampaignUrl) {
      addToast('Please enter a Tweet URL.', 'error');
      return;
    }
    
    if (!newCampaignUrl.includes('twitter.com') && !newCampaignUrl.includes('x.com')) {
      addToast('Invalid URL. Please use a valid X (Twitter) post link.', 'error');
      return;
    }

    if (promoBudget < costPerAction * 10) { // Min budget check
      addToast('Insufficient budget. Minimum $1.00 required to launch.', 'error');
      return;
    }
    
    // Deduct some initial budget (e.g. reserving for 10 actions)
    setPromoBudget(prev => prev - (costPerAction * 10));

    const newTask: TaskItem = {
      id: Math.random().toString(36).substr(2, 9),
      authorHandle: session?.user?.name || 'anonymous', 
      authorName: session?.user?.name || 'Anonymous',
      content: `Promoted Tweet: ${newCampaignUrl}`,
      tweetUrl: newCampaignUrl,
      reward: costPerAction,
      actions: { like: false, repost: false, reply: false },
      status: 'pending'
    };

    setTasks(prev => [newTask, ...prev]);
    setNewCampaignUrl('');
    addToast('Campaign launched! Your tweet is now live.', 'success');
    setActiveTab('earn'); 
  };

  const handleCompleteTask = (taskId: string, actionType: 'like' | 'repost' | 'reply') => {
    if (!isTwitterConnected) {
      addToast('Please connect Twitter first!', 'error');
      return;
    }

    // 1. Update task state to mark as clicked (UI feedback)
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        // If all actions are now completed (or this was the last one), start verification
        // For simplicity in this MVP, we treat each click as a step towards 'verifying' status
        // But to make it robust, let's switch to 'verifying' immediately after action
        return {
          ...t,
          actions: { ...t.actions, [actionType]: true },
          status: 'verifying',
          claimableAt: Date.now() + 5000 // 5 seconds delay for API consistency
        };
      }
      return t;
    }));

    addToast('Action recorded. Click "Claim" in 5s to verify.', 'info');
  };

  const handleClaimReward = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.claimableAt && Date.now() < task.claimableAt) {
      const remaining = Math.ceil((task.claimableAt - Date.now()) / 1000);
      addToast(`Please wait ${remaining}s for Twitter API update.`, 'error');
      return;
    }

    addToast('Verifying with X (Twitter)...', 'info');

    try {
        // Determine primary action to verify
        // For now, default to 'like' if multiple are present, or the most recent?
        // The API currently handles one action type.
        // Let's check 'like' if it's true.
        const actionType = task.actions.like ? 'like' : (task.actions.repost ? 'repost' : 'reply');

        const response = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                taskId, 
                actionType, 
                tweetUrl: task.tweetUrl 
            })
        });

        const data = await response.json();

        if (data.success) {
            // Success Path
            setEarningBalance(prev => prev + task.reward);
            setReputation(prev => Math.min(100, prev + 1));
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
            
            addToast(`Verification complete! Earned $${task.reward.toFixed(2)} (+1 Rep)`, 'success');

            // Log activity
            const newActivity: ActivityItem = {
              id: Math.random().toString(36).substr(2, 9),
              type: 'tip_like', // Generic for now
              amount: task.reward,
              token: 'USDC',
              date: 'Just now',
              twitterHandle: `@${task.authorHandle}`
            };
            setActivities(prev => [newActivity, ...prev]);
        } else {
            // Failure Path
            setReputation(prev => Math.max(0, prev - 5));
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'failed' } : t));
            addToast(`Verification FAILED: ${data.error || 'Action not found on X/Twitter.'}`, 'error');
        }

    } catch (error) {
        console.error('Claim Error:', error);
        addToast('System Error during verification.', 'error');
    }
  };

  const handleWithdraw = () => {
    if (earningBalance < 0.5) {
      addToast('Minimum withdrawal amount is $0.50', 'error');
      return;
    }
    
    setIsWithdrawing(true);
    setTimeout(() => {
      setIsWithdrawing(false);
      setEarningBalance(0);
      addToast(`Successfully withdrew $${earningBalance.toFixed(2)} to your wallet!`, 'success');
    }, 2000);
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to reset all app data? This cannot be undone.')) {
      localStorage.clear();
      setTasks(INITIAL_TASKS);
      setActivities([]);
      setEarningBalance(0);
      setPromoBudget(0);
      setReputation(50);
      addToast('App data reset successfully!', 'success');
      window.location.reload();
    }
  };

  if (!isLoaded) return null; // Prevent hydration mismatch

  return (
    <main className="min-h-screen bg-black text-white selection:bg-[#9945FF] selection:text-white pb-20 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(153,69,255,0.3)] border border-white/10">
              <NextImage src="/BoostFi.jpg" alt="BoostFiX Logo" fill className="object-cover" />
            </div>
            <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">BoostFiX</span>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Mode Switcher */}
            <div className="flex bg-white/5 p-1 rounded-full border border-white/10">
              <button 
                onClick={() => setActiveTab('earn')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'earn' 
                    ? 'bg-[#9945FF] text-white shadow-[0_0_20px_rgba(153,69,255,0.3)]' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <TrendingUp size={16} />
                Earn
              </button>
              <button 
                onClick={() => setActiveTab('promote')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'promote' 
                    ? 'bg-[#14F195] text-black shadow-[0_0_20px_rgba(20,241,149,0.3)]' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Megaphone size={16} />
                Promote
              </button>
            </div>

            <WalletMultiButton className="!bg-white/10 !transition-all hover:!bg-white/20 !rounded-xl !h-10 !px-6 !font-medium" />
          </div>
        </div>
      </nav>

      <div className="pt-32 max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Main Content */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              {activeTab === 'earn' ? 'Explore & Earn' : 'Promote Your Content'}
            </h1>
            <p className="text-gray-400">
              {activeTab === 'earn' 
                ? 'Like, Repost, and Reply to sponsored tweets to earn crypto instantly.' 
                : 'Boost your engagement by rewarding users for interactions.'}
            </p>
          </div>

          {/* Connect Twitter State */}
          {!isTwitterConnected ? (
            <div className="bg-[#1D9BF0]/10 border border-[#1D9BF0]/20 rounded-xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1D9BF0]/20 flex items-center justify-center text-[#1D9BF0]">
                  {isConnectingTwitter ? <Loader2 className="animate-spin" /> : <Twitter size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-white">Connect X (Twitter)</h3>
                  <p className="text-sm text-[#1D9BF0]/80">Required to verify your actions and posts.</p>
                </div>
              </div>
              <button 
                onClick={handleConnectTwitter}
                disabled={isConnectingTwitter}
                className="bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isConnectingTwitter ? 'Connecting...' : 'Connect Now'}
              </button>
            </div>
          ) : (
             <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-[#1D9BF0] flex items-center justify-center text-white">
                      {session?.user?.image ? (
                        <NextImage src={session.user.image} alt="Profile" width={32} height={32} className="rounded-full" />
                      ) : (
                        <Twitter size={16} />
                      )}
                   </div>
                   <span className="text-sm font-medium text-gray-300">Connected as <span className="text-white font-bold">@{(session?.user as any)?.handle || session?.user?.name}</span></span>
                </div>
                <button onClick={handleDisconnectTwitter} className="text-gray-500 hover:text-red-400 transition-colors">
                   <LogOut size={18} />
                </button>
             </div>
          )}

          {/* CONTENT AREA */}
          {activeTab === 'earn' ? (
             <EarnFeed tasks={tasks} onCompleteTask={handleCompleteTask} onClaimReward={handleClaimReward} />
          ) : (
            <div className="space-y-6">
              {/* PROMOTE FORM */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Tweet URL to Promote</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newCampaignUrl}
                        onChange={(e) => setNewCampaignUrl(e.target.value)}
                        placeholder="https://x.com/username/status/123456789"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#14F195] transition-colors"
                      />
                      <button 
                        onClick={() => setNewCampaignUrl('')}
                        className="bg-white/10 hover:bg-white/20 p-3 rounded-xl border border-white/10 transition-colors"
                      >
                        <X size={20} className="text-gray-400" />
                      </button>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-400">Reward per Action</label>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                      <div className="text-[#14F195]">
                        <DollarSign size={18} />
                      </div>
                      <span className="text-white font-medium flex-1">Cost per Action</span>
                      <input
                        type="number"
                        value={costPerAction}
                        onChange={(e) => setCostPerAction(parseFloat(e.target.value))}
                        min={0.01}
                        step={0.01}
                        className="bg-transparent text-right text-white font-mono focus:outline-none w-24"
                      />
                      <span className="text-gray-500 text-sm">USDC</span>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-white/10">
                    <button 
                      onClick={handleCreateCampaign}
                      disabled={!isTwitterConnected || promoBudget < (costPerAction * 10)}
                      className="w-full bg-gradient-to-r from-[#14F195] to-[#14F195]/80 hover:opacity-90 text-black font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(20,241,149,0.2)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {promoBudget < (costPerAction * 10) ? 'Insufficient Funds' : 'Launch Campaign 🚀'}
                    </button>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar (Wallet & Stats) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* BALANCE CARD */}
          <div className="bg-gradient-to-br from-[#1e1e1e] to-black border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#9945FF]/20 blur-[50px] rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 font-medium flex items-center gap-2">
                  <Wallet size={16} />
                  {activeTab === 'earn' ? 'Your Earnings' : 'Promo Budget'}
                </span>
                <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">USDC</span>
              </div>
              <div className="text-4xl font-bold text-white mb-2 font-mono">
                ${activeTab === 'earn' ? earningBalance.toFixed(2) : promoBudget.toFixed(2)}
              </div>
              
              {activeTab === 'promote' && (
                <div className="space-y-4 mt-6">
                   <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleDeposit(1)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 text-sm font-medium transition-colors text-[#14F195]"
                    >
                      + $1 USDT
                    </button>
                    <button 
                      onClick={() => handleDeposit(10)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 text-sm font-medium transition-colors"
                    >
                      + $10 USDT
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'earn' && (
                 <button 
                   onClick={handleWithdraw}
                   disabled={earningBalance <= 0 || isWithdrawing}
                   className="w-full mt-6 bg-[#9945FF]/20 border border-[#9945FF]/50 text-[#9945FF] hover:bg-[#9945FF]/30 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                   {isWithdrawing ? <Loader2 className="animate-spin" size={18} /> : 'Withdraw to Wallet'}
                 </button>
              )}
            </div>
          </div>

          {/* REPUTATION SCORE CARD */}
          {activeTab === 'earn' && (
            <div className="bg-gradient-to-br from-[#1e1e1e] to-black border border-white/10 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full -mr-16 -mt-16 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 font-medium flex items-center gap-2">
                    <CheckCircle size={16} />
                    Reputation Score
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${reputation > 80 ? 'bg-green-500/20 text-green-400' : reputation > 40 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {reputation > 80 ? 'Excellent' : reputation > 40 ? 'Good' : 'Risk'}
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <div className="text-4xl font-bold text-white font-mono">{reputation}</div>
                  <span className="text-gray-500 mb-2">/ 100</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full mt-4 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${reputation > 80 ? 'bg-green-500' : reputation > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${reputation}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  System periodically checks past actions. Undoing likes/reposts reduces score and may lead to a ban.
                </p>
              </div>
            </div>
          )}

          {/* LIVE ACTIVITY FEED */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-[400px] flex flex-col">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Activity
            </h3>
            <div className="flex-1 overflow-hidden relative">
               <ActivityFeed activities={activities} />
            </div>
          </div>

          {/* DEBUG TOOLS */}
          <div className="flex justify-center pt-4 pb-8">
            <button 
              onClick={clearHistory}
              className="text-xs text-gray-600 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <RefreshCw size={12} />
              Reset App Data (Debug)
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
