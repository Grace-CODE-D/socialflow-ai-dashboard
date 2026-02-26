import React from 'react';

interface Post {
  id: string;
  platform: string;
  content: string;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    total: number;
  };
  revenue: number;
  date: string;
}

const mockPosts: Post[] = [
  {
    id: '1',
    platform: 'TikTok',
    content: 'New product launch announcement 🚀',
    engagement: { likes: 45000, shares: 8200, comments: 3400, total: 56600 },
    revenue: 245.50,
    date: '2026-02-20',
  },
  {
    id: '2',
    platform: 'Instagram',
    content: 'Behind the scenes content',
    engagement: { likes: 32000, shares: 5100, comments: 2800, total: 39900 },
    revenue: 198.30,
    date: '2026-02-19',
  },
  {
    id: '3',
    platform: 'Twitter',
    content: 'Community update thread',
    engagement: { likes: 28000, shares: 6500, comments: 1900, total: 36400 },
    revenue: 175.80,
    date: '2026-02-18',
  },
  {
    id: '4',
    platform: 'LinkedIn',
    content: 'Industry insights article',
    engagement: { likes: 15000, shares: 3200, comments: 1800, total: 20000 },
    revenue: 142.60,
    date: '2026-02-17',
  },
  {
    id: '5',
    platform: 'YouTube',
    content: 'Tutorial video',
    engagement: { likes: 12000, shares: 2100, comments: 1500, total: 15600 },
    revenue: 128.90,
    date: '2026-02-16',
  },
];

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const PostPerformanceWidget: React.FC = () => {
  const topByEngagement = [...mockPosts].sort((a, b) => b.engagement.total - a.engagement.total).slice(0, 5);
  const topByRevenue = [...mockPosts].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const PostCard = ({ post, rankBy }: { post: Post; rankBy: 'engagement' | 'revenue' }) => (
    <div className="bg-dark-bg rounded-lg p-4 hover:bg-white/5 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-primary-blue">{post.platform}</span>
            <span className="text-xs text-gray-subtext">
              {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <p className="text-sm text-white line-clamp-2">{post.content}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <MaterialIcon name="favorite" className="text-red-400 text-sm" />
          <p className="text-xs text-gray-subtext mt-1">Likes</p>
          <p className="text-sm font-semibold text-white">{(post.engagement.likes / 1000).toFixed(1)}k</p>
        </div>
        <div className="text-center">
          <MaterialIcon name="share" className="text-blue-400 text-sm" />
          <p className="text-xs text-gray-subtext mt-1">Shares</p>
          <p className="text-sm font-semibold text-white">{(post.engagement.shares / 1000).toFixed(1)}k</p>
        </div>
        <div className="text-center">
          <MaterialIcon name="comment" className="text-green-400 text-sm" />
          <p className="text-xs text-gray-subtext mt-1">Comments</p>
          <p className="text-sm font-semibold text-white">{(post.engagement.comments / 1000).toFixed(1)}k</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-dark-border">
        <div>
          <p className="text-xs text-gray-subtext">
            {rankBy === 'engagement' ? 'Total Engagement' : 'Revenue'}
          </p>
          <p className="text-lg font-bold text-primary-teal">
            {rankBy === 'engagement'
              ? `${(post.engagement.total / 1000).toFixed(1)}k`
              : `$${post.revenue.toFixed(2)}`}
          </p>
        </div>
        <button className="flex items-center gap-1 text-xs text-primary-blue hover:text-blue-400 transition-colors">
          View Details
          <MaterialIcon name="arrow_forward" className="text-sm" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top by Engagement */}
      <div className="bg-dark-surface rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <MaterialIcon name="trending_up" className="text-primary-blue text-2xl" />
          <div>
            <h3 className="text-lg font-semibold text-white">Top Posts by Engagement</h3>
            <p className="text-sm text-gray-subtext">Most engaging content</p>
          </div>
        </div>
        <div className="space-y-4">
          {topByEngagement.map((post) => (
            <PostCard key={post.id} post={post} rankBy="engagement" />
          ))}
        </div>
      </div>

      {/* Top by Revenue */}
      <div className="bg-dark-surface rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <MaterialIcon name="payments" className="text-primary-teal text-2xl" />
          <div>
            <h3 className="text-lg font-semibold text-white">Top Posts by Revenue</h3>
            <p className="text-sm text-gray-subtext">Highest earning content</p>
          </div>
        </div>
        <div className="space-y-4">
          {topByRevenue.map((post) => (
            <PostCard key={post.id} post={post} rankBy="revenue" />
          ))}
        </div>
      </div>
    </div>
  );
};
