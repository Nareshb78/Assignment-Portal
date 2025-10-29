// src/components/common/CommentSection.jsx

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCommentsForSubmission, postComment } from '../../redux/slices/submissionSlice';
import { Send, User, MessageSquare, Reply } from 'lucide-react';
import Loader from './Loader';

const CommentSection = ({ submissionId }) => {
    const dispatch = useDispatch();
    const { comments, isLoading: commentsLoading } = useSelector(state => state.submissions);
    const { user } = useSelector(state => state.auth);

    const [commentText, setCommentText] = useState('');
    const [replyingToId, setReplyingToId] = useState(null);
    const [isPosting, setIsPosting] = useState(false);

    // Fetch comments when the component mounts or submissionId changes
    useEffect(() => {
        if (submissionId) {
            dispatch(fetchCommentsForSubmission(submissionId));
        }
    }, [dispatch, submissionId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setIsPosting(true);
        try {
            await dispatch(postComment({
                submissionId,
                text: commentText.trim(),
                parentId: replyingToId
            })).unwrap();
            
            setCommentText('');
            setReplyingToId(null);
        } catch (error) {
            alert('Failed to post comment: ' + error.message);
        } finally {
            setIsPosting(false);
        }
    };
    
    // Utility to render comment threads recursively
    const renderComment = (comment) => {
        const isAuthor = comment.authorId?._id === user?._id;
        const authorRole = comment.authorId?.role || 'student';
        const isTeacherOrAdmin = authorRole === 'teacher' || authorRole === 'admin';

        // Filter replies for the current comment
        const replies = comments.filter(c => c.parentId === comment._id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        return (
            // KEY CHANGE 1: Use 'ml-3 sm:ml-6' for replies. This reduces the margin/indent on small screens (ml-3) but keeps the deeper indent on larger screens (sm:ml-6).
            <div key={comment._id} className={`mb-4 ${comment.parentId ? 'ml-3 sm:ml-6' : ''}`}>
                <div className={`p-3 rounded-lg ${isTeacherOrAdmin ? 'bg-accentPrimary/20 border border-accentPrimary/50' : 'bg-gray-800 border border-gray-700'}`}>
                    {/* Header: Author Name and Time */}
                    <div className="flex justify-between items-start mb-1">
                        {/* Use flex-col on small screens if necessary, though 'items-start' is often enough */}
                        <span className={`text-sm font-semibold flex items-center ${isTeacherOrAdmin ? 'text-[#ba68c8]' : 'text-accentSecondary'} break-words pr-2`}>
                            <User className='h-4 w-4 mr-2 flex-shrink-0'/>
                            {/* Ensure author name wraps if needed */}
                            <span className='break-all'>{comment.authorId?.name || 'Unknown User'}</span>
                            {isAuthor && <span className="ml-2 text-xs text-[#bdbdbd] flex-shrink-0">(You)</span>}
                        </span>
                        {/* Ensure time stamp is readable */}
                        <span className="text-xs text-[#bdbdbd] flex-shrink-0">
                            {new Date(comment.createdAt).toLocaleTimeString()}
                        </span>
                    </div>
                    {/* Comment Text */}
                    {/* KEY CHANGE 2: Removed fixed 'ml-6' from comment text to save horizontal space, especially when indented. */}
                    <p className="text-[#e0e0e0] text-base mt-1">{comment.text}</p>
                    <button 
                        onClick={() => setReplyingToId(comment._id)} 
                        className="text-xs text-[#bdbdbd] hover:text-[#ba68c8] mt-2 transition-colors flex items-center"
                        disabled={isPosting}
                    >
                        <Reply size={14} className='mr-1'/> Reply
                    </button>
                </div>

                {/* Render replies indented */}
                {replies.length > 0 && (
                    <div className="mt-2 pl-3 border-l border-gray-700">
                        {replies.map(renderComment)}
                    </div>
                )}
            </div>
        );
    };

    const topLevelComments = comments.filter(c => !c.parentId);

    return (
        // KEY CHANGE 3: Added 'p-3 sm:p-6' to the surrounding div to ensure container padding is not too excessive on mobile.
        <div className="space-y-6 p-3 sm:p-6 bg-gray-900 rounded-xl"> 
            <h2 className="text-xl sm:text-2xl font-bold text-[#e0e0e0] border-b border-gray-700 pb-2 flex items-center">
                <MessageSquare className='h-6 w-6 mr-2 text-[#ba68c8]'/> Discussion ({comments.length})
            </h2>

            {/* Display Comments */}
            {/* Scrollable area is fine, kept as is. */}
            <div className="min-h-[100px] max-h-[400px] overflow-y-auto space-y-4 pr-2">
                {commentsLoading && <Loader message="Loading discussion..." />}
                {!commentsLoading && topLevelComments.length === 0 && (
                    <p className="text-[#bdbdbd] italic pt-4">Start the conversation below.</p>
                )}
                {!commentsLoading && topLevelComments.map(renderComment)}
            </div>

            {/* Comment Input Form */}
            <form onSubmit={handleSubmit} className="p-4 bg-gray-800 rounded-xl border border-gray-700 space-y-3">
                {replyingToId && (
                    <div className="text-sm text-accentSecondary flex justify-between items-center bg-surface p-2 rounded-lg">
                        Replying to: Comment ID {replyingToId.slice(-4)}
                        <button type="button" onClick={() => setReplyingToId(null)} className="text-red-500 hover:text-red-400">Cancel</button>
                    </div>
                )}
                <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={"Type your message here..."}
                    rows={3}
                    disabled={isPosting}
                    className="w-full bg-surface text-[#e0e0e0] border border-gray-700 rounded-lg py-2 px-3 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all placeholder-[#bdbdbd]"
                />
                <button
                    type="submit"
                    disabled={isPosting || !commentText.trim()}
                    className="flex items-center bg-[#ba68c8] text-white py-2 px-4 rounded-lg hover:bg-violet-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-sm font-medium"
                >
                    <Send className="h-4 w-4 mr-2" /> {isPosting ? 'Posting...' : 'Post Comment'}
                </button>
            </form>
        </div>
    );
};

export default CommentSection;