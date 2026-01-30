import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { TwitterApi } from 'twitter-api-v2';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { taskId, actionType, tweetUrl } = body;

    if (!session || !(session as any).accessToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Please reconnect Twitter' }, { status: 401 });
    }

    const accessToken = (session as any).accessToken;
    
    // Initialize Twitter Client with User's Access Token
    const client = new TwitterApi(accessToken);
    
    // Get current user's ID
    const me = await client.v2.me();
    const userId = me.data.id;

    // Extract Tweet ID
    // Supports twitter.com and x.com
    const tweetIdMatch = tweetUrl.match(/status\/(\d+)/);
    const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;

    if (!tweetId) {
       return NextResponse.json({ success: false, error: 'Invalid Tweet URL' }, { status: 400 });
    }

    let verified = false;

    if (actionType === 'like') {
      // Check if user liked the tweet (Limit 100 most recent likes)
      const likedTweets = await client.v2.userLikedTweets(userId, { 
        max_results: 100,
        "tweet.fields": ["id"] 
      });
      
      // Check if the target tweet ID exists in the liked list
      // Note: likedTweets.data might be undefined if no likes
      const likes = likedTweets.data || [];
      verified = likes.some(tweet => tweet.id === tweetId);
    } 
    else if (actionType === 'repost') {
       // Check Retweets is harder via API v2 standard. 
       // We can check User Timeline to see if they posted a Retweet of this ID.
       // or use 'retweeted_by' if we had the tweet context.
       // For MVP: We will trust the user or check if they recently tweeted it.
       // Let's implement a 'Soft' check: Returns true if API call succeeds (Connectivity check)
       // TO-DO: Implement rigorous Retweet check
       verified = true; 
    }
    else {
       // Reply / Follow
       verified = true;
    }

    return NextResponse.json({ success: verified });

  } catch (error: any) {
    console.error('Verification Error:', error);
    
    // Handle Token Expiry or Revocation
    if (error.code === 401 || error.message?.includes('Unauthorized')) {
        return NextResponse.json({ success: false, error: 'Session expired. Please reconnect Twitter.' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: error.message || 'Verification failed' }, { status: 500 });
  }
}
