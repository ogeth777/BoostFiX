import { FC } from 'react';
import { ArrowUpRight, ArrowDownLeft, Twitter, Repeat, Heart, MessageCircle, UserPlus } from 'lucide-react';

export type ActivityItem = {
  id: string;
  type: 'deposit' | 'tip_like' | 'tip_repost' | 'tip_reply' | 'tip_follow';
  amount: number;
  token: string;
  date: string; // or Date object
  txHash?: string;
  twitterHandle?: string; // e.g. @solana
};

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export const ActivityFeed: FC<ActivityFeedProps> = ({ activities }) => {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="w-4 h-4 text-solana-green" />;
      case 'tip_like': return <Heart className="w-3 h-3 text-pink-500" />;
      case 'tip_repost': return <Repeat className="w-3 h-3 text-green-500" />;
      case 'tip_reply': return <MessageCircle className="w-3 h-3 text-blue-400" />;
      case 'tip_follow': return <UserPlus className="w-3 h-3 text-purple-500" />;
    }
  };

  const getLabel = (item: ActivityItem) => {
    switch (item.type) {
      case 'deposit': return 'Deposit';
      case 'tip_like': return `Liked ${item.twitterHandle || 'post'}`;
      case 'tip_repost': return `Reposted ${item.twitterHandle || 'post'}`;
      case 'tip_reply': return `Replied to ${item.twitterHandle || 'post'}`;
      case 'tip_follow': return `Followed ${item.twitterHandle || 'user'}`;
    }
  };

  return (
    <div className="bg-[#1a1a1a]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-white text-lg">Live Activity</h3>
        <div className="flex items-center space-x-2">
           <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Realtime</span>
        </div>
      </div>

      <div className="overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {activities.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-10 flex flex-col items-center">
                <div className="bg-white/5 p-3 rounded-full mb-3">
                    <Twitter className="w-5 h-5 opacity-50" />
                </div>
                No activity yet. <br/>Connect Twitter & start tipping!
            </div>
        ) : (
            activities.map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5 hover:bg-white/5 transition-colors group">
                <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/5 ${item.type === 'deposit' ? 'bg-green-500/10' : 'bg-purple-500/10'}`}>
                        {getIcon(item.type)}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-200">{getLabel(item)}</p>
                        <p className="text-[10px] text-gray-500">{item.date}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`block font-bold text-sm ${item.type === 'deposit' ? 'text-green-400' : 'text-white'}`}>
                        {item.type === 'deposit' ? '+' : '-'}${item.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-gray-600 font-mono">
                        {item.token}
                    </span>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};
