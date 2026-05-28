import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Loader2, Users } from "lucide-react";
import { ReviewCard } from "./ReviewCard";
import { useAuth } from "../context/AuthContext";
import { getFollowingReviews, FollowingReview } from "../../api/reviews";

const PAGE_SIZE = 20;

export function FollowingFeedPage() {
  const { user } = useAuth();
  const [reviews,     setReviews]     = useState<FollowingReview[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total,       setTotal]       = useState(0);
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError("");
    getFollowingReviews(0, PAGE_SIZE)
      .then(res => {
        setReviews(res.results);
        setTotal(res.total);
      })
      .catch(e => {
        setError(e?.message ?? "Failed to load reviews.");
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const hasMore = reviews.length < total;

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await getFollowingReviews(reviews.length, PAGE_SIZE);
      setReviews(rs => [...rs, ...res.results]);
      setTotal(res.total);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load more reviews.");
    } finally {
      setLoadingMore(false);
    }
  };

  // Not signed in
  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Sign in to see your feed</h2>
      <p className="text-white/50 mb-6">Follow other users to see their latest reviews here.</p>
      <Link to="/login"
        className="inline-block px-6 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-white/10 transition-all">
        Sign In
      </Link>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Following</h1>
        <p className="text-white/50 text-sm sm:text-base">
          The latest reviews from users you follow.
        </p>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 mb-6">
          {error}
        </p>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Your feed is empty</h2>
          <p className="text-white/40 max-w-sm mx-auto">
            Follow some users to see their reviews here. Try searching for usernames or browsing top reviewers.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map(r => (
              <ReviewCard
                key={r.id}
                id={r.id}
                reviewer={{
                  username:    r.reviewer?.username    ?? "",
                  displayName: r.reviewer?.displayName,
                  avatar:      r.reviewer?.profilePicture,
                }}
                scores={{
                  gameplay:   r.gameplay   ?? 0,
                  content:    r.content    ?? 0,
                  narrative:  r.narrative  ?? 0,
                  aesthetics: r.aesthetics ?? 0,
                  polish:     r.polish     ?? 0,
                }}
                categoryText={{
                  gameplay:   r.gp_body,
                  content:    r.con_body,
                  narrative:  r.ntv_body,
                  aesthetics: r.aes_body,
                  polish:     r.pol_body,
                }}
                title={r.title}
                review={r.body ?? ""}
                likes={r.likes ?? 0}
                dislikes={0}
                comments={r.commentsCount ?? 0}
                createdAt={r.createdAt}
                showGame={true}
                gameId={r.gameId}
                gameName={r.gameName}
                gameCoverUrl={r.gameCoverUrl}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-white/5 border border-white/15 text-white/70 rounded-lg hover:border-white/30 transition-all disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
