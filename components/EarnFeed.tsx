import { useState, useEffect } from 'react';
import { Heart, Repeat, MessageCircle, CheckCircle, ExternalLink, DollarSign, Loader2, X } from 'lucide-react';

export type TaskItem = {
  id: string;
  authorHandle: string;
  authorName: string;
  tweetUrl: string; // URL to the tweet
  avatarUrl?: string; // Optional avatar
  content: string;
  reward: number; // Reward in USD/SOL
  actions: {
    like: boolean;
    repost: boolean;
    reply: boolean;
  };
  status: 'pending' | 'verifying' | 'claimable' | 'completed' | 'failed';
  claimableAt?: number; // Timestamp when reward can be claimed
};

interface EarnFeedProps {
  tasks: TaskItem[];
  onCompleteTask: (taskId: string, actionType: 'like' | 'repost' | 'reply') => void;
  onClaimReward: (taskId: string) => void;
}

export const EarnFeed = ({ tasks, onCompleteTask, onClaimReward }: EarnFeedProps) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeLeft = (targetTime: number) => {
    const diff = Math.max(0, Math.ceil((targetTime - now) / 1000));
    return `${diff}s`;
  };

  const handleAction = (taskId: string, actionType: 'like' | 'repost' | 'reply', tweetUrl: string) => {
    // 1. Open Twitter in new tab
    window.open(tweetUrl, '_blank');
    
    // 2. Trigger verification process
    onCompleteTask(taskId, actionType);
  };

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="text-center p-8 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-gray-400">No active campaigns available right now.</p>
          <p className="text-sm text-gray-500 mt-2">Check back later to earn!</p>
        </div>
      ) : (
        tasks.map((task) => (
          <div 
            key={task.id} 
            className="group relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:border-[#9945FF]/50 transition-all duration-300"
          >
            {/* Header: Author Info & Reward */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] p-[2px]">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-bold text-white text-sm">
                    {task.authorName[0]}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white">{task.authorName}</h3>
                  <p className="text-xs text-gray-400">@{task.authorHandle}</p>
                </div>
              </div>
              <div className="bg-[#14F195]/10 border border-[#14F195]/20 px-3 py-1 rounded-full flex items-center gap-1">
                <DollarSign size={14} className="text-[#14F195]" />
                <span className="text-[#14F195] font-bold text-sm">+{task.reward.toFixed(2)}</span>
              </div>
            </div>

            {/* Tweet Content */}
            <p className="text-gray-300 text-sm mb-4 leading-relaxed border-l-2 border-gray-700 pl-3">
              {task.content}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4">
              {/* Like Action */}
              <button
                onClick={() => handleAction(task.id, 'like', task.tweetUrl)}
                disabled={task.actions.like || task.status === 'completed' || task.status === 'failed'}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  task.actions.like
                    ? 'bg-[#F91880]/20 text-[#F91880] cursor-default'
                    : 'bg-white/5 text-gray-400 hover:bg-[#F91880]/10 hover:text-[#F91880] disabled:opacity-50'
                }`}
              >
                {task.actions.like ? <CheckCircle size={16} /> : <Heart size={16} />}
                {task.actions.like ? 'Liked' : 'Like'}
              </button>

              {/* Repost Action */}
              <button
                onClick={() => handleAction(task.id, 'repost', task.tweetUrl)}
                disabled={task.actions.repost || task.status === 'completed' || task.status === 'failed'}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  task.actions.repost
                    ? 'bg-[#00BA7C]/20 text-[#00BA7C] cursor-default'
                    : 'bg-white/5 text-gray-400 hover:bg-[#00BA7C]/10 hover:text-[#00BA7C] disabled:opacity-50'
                }`}
              >
                {task.actions.repost ? <CheckCircle size={16} /> : <Repeat size={16} />}
                {task.actions.repost ? 'Reposted' : 'Repost'}
              </button>

               {/* Reply Action */}
               <button
                onClick={() => handleAction(task.id, 'reply', task.tweetUrl)}
                disabled={task.actions.reply || task.status === 'completed' || task.status === 'failed'}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  task.actions.reply
                    ? 'bg-[#1D9BF0]/20 text-[#1D9BF0] cursor-default'
                    : 'bg-white/5 text-gray-400 hover:bg-[#1D9BF0]/10 hover:text-[#1D9BF0] disabled:opacity-50'
                }`}
              >
                {task.actions.reply ? <CheckCircle size={16} /> : <MessageCircle size={16} />}
                {task.actions.reply ? 'Replied' : 'Reply'}
              </button>
            </div>

            {/* Status / Claim Section */}
            {task.status === 'verifying' && task.claimableAt && (
              <div className="mt-3">
                {now < task.claimableAt ? (
                  <div className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-lg py-2 px-4 flex items-center justify-center gap-2 text-yellow-500 text-sm font-medium animate-pulse">
                    <Loader2 size={16} className="animate-spin" />
                    Verifying permanence... ({formatTimeLeft(task.claimableAt)})
                  </div>
                ) : (
                  <button
                    onClick={() => onClaimReward(task.id)}
                    className="w-full bg-gradient-to-r from-[#14F195] to-[#14F195]/80 hover:opacity-90 text-black font-bold py-2 rounded-lg shadow-[0_0_15px_rgba(20,241,149,0.3)] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Claim Reward (+1 Rep)
                  </button>
                )}
              </div>
            )}

            {task.status === 'completed' && (
              <div className="mt-3 w-full bg-[#14F195]/20 border border-[#14F195]/30 rounded-lg py-2 flex items-center justify-center gap-2 text-[#14F195] font-bold text-sm">
                <CheckCircle size={16} />
                Reward Claimed
              </div>
            )}

            {task.status === 'failed' && (
              <div className="mt-3 w-full bg-red-500/20 border border-red-500/30 rounded-lg py-2 flex items-center justify-center gap-2 text-red-500 font-bold text-sm">
                <X size={16} />
                Verification Failed (Reputation -5)
              </div>
            )}
            
            {/* View Original Link */}
            <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink size={14} className="text-gray-500 hover:text-white cursor-pointer" />
            </div>
          </div>
        ))
      )}
    </div>
  );
};
