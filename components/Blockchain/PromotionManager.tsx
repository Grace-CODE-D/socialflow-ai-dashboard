import React, { useState, useEffect } from 'react';
import { PromotionBudgetSetup } from './PromotionBudgetSetup';

type Post = {
  id: string;
  content: string;
  isPromoted: boolean;
};

export const PromotionManager: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Requirement 13.1: Display list of promotable posts
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Blockchain Promotion Manager</h2>
      
      <div className="grid gap-4">
        {posts.map(post => (
          <div key={post.id} className="border p-4 rounded-lg flex justify-between items-center bg-white shadow-sm">
            <div>
              <p className="font-medium">{post.content.substring(0, 60)}...</p>
              <div className="flex gap-2 mt-2">
                {post.isPromoted ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active Promotion</span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Organic</span>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedPost(post)}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              {post.isPromoted ? 'Manage' : 'Promote'}
            </button>
          </div>
        ))}
      </div>

      {/* Modal for Requirement 402.2 */}
      {selectedPost && (
        <PromotionBudgetSetup 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
        />
      )}
    </div>
  );
};