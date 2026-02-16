"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import GuestNavbar from '@/components/navbar/GuestNavbar';
import { Mail, Send, User, Calendar, MessageCircle, XCircle, CheckCircle2 } from 'lucide-react';

type Message = {
  _id: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
  bookingId?: string;
  propertyId?: string;
};

type Conversation = {
  participantEmail: string;
  participantName: string;
  messages: Message[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  bookingId?: string;
  propertyId?: string;
};

export default function GuestMessages() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMessages();
      
      const interval = setInterval(() => {
        fetchMessages();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [status]);

  useEffect(() => {
    if (selectedConversation && conversations.length > 0) {
      const updatedConv = conversations.find(
        (c) => c.participantEmail === selectedConversation.participantEmail
      );
      if (updatedConv) {
        setSelectedConversation(updatedConv);
      }
    }
  }, [conversations]);

  // Mark messages as read when conversation is selected
  const markMessagesAsRead = async (participantEmail: string) => {
    try {
      await fetch('/api/guest/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantEmail }),
      });
      // Refresh to update unread counts
      fetchMessages();
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    // Mark messages as read when opening conversation
    if (conv.unreadCount > 0) {
      markMessagesAsRead(conv.participantEmail);
    }
  };

  const fetchMessages = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/guest/messages');
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;

    setError('');
    setSending(true);

    try {
      const res = await fetch('/api/guest/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: selectedConversation.participantEmail,
          subject: `${selectedConversation.messages[0]?.subject || 'Message'}`,
          message: replyText,
          bookingId: selectedConversation.bookingId,
          propertyId: selectedConversation.propertyId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);
      setReplyText('');
      
      await fetchMessages();
      
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please log in to view messages.</p>
          <a href="/auth/login" className="text-teal-500 font-semibold hover:underline">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
      <GuestNavbar />
      <main className="flex-1 p-10 ml-64">
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">Messages</h1>
          <p className="text-gray-600 text-base font-medium">View and reply to messages from hosts.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading messages...</p>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Messages Yet</h3>
            <p className="text-gray-600">When hosts send you messages, they'll appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
            {/* Conversations List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-teal-600" />
                  Conversations ({conversations.length})
                </h2>
              </div>
              <div className="overflow-y-auto h-full">
                {conversations.map((conv) => (
                  <button
                    key={conv.participantEmail}
                    className={`w-full p-4 border-b border-gray-100 hover:bg-teal-50 transition-colors text-left ${
                      selectedConversation?.participantEmail === conv.participantEmail ? 'bg-teal-50' : ''
                    }`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {conv.participantName?.charAt(0)?.toUpperCase() || 'H'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{conv.participantName || conv.participantEmail}</h3>
                          {conv.unreadCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(conv.lastMessageTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Thread */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                          {selectedConversation.participantName?.charAt(0)?.toUpperCase() || 'H'}
                        </div>
                        <div>
                          <h2 className="font-bold text-gray-900">{selectedConversation.participantName || selectedConversation.participantEmail}</h2>
                          <p className="text-sm text-gray-600">{selectedConversation.messages.length} messages</p>
                        </div>
                      </div>
                      {isRefreshing && (
                        <div className="flex items-center gap-2 text-teal-600 text-sm">
                          <div className="w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs">Syncing...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-gray-50 to-white">
                    {selectedConversation.messages.slice().reverse().map((msg) => {
                      const isFromMe = msg.senderEmail === session?.user?.email;
                      return (
                        <div key={msg._id} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isFromMe ? 'order-2' : 'order-1'}`}>
                            <div className={`rounded-2xl p-4 shadow-sm ${
                              isFromMe 
                                ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white' 
                                : 'bg-white border border-gray-200 text-gray-900'
                            }`}>
                              <p className="text-sm font-medium mb-2 opacity-90">{msg.subject}</p>
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                              <p className={`text-xs mt-2 ${isFromMe ? 'text-teal-100' : 'text-gray-500'}`}>
                                {new Date(msg.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Box */}
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    {success && (
                      <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Message sent successfully!
                      </div>
                    )}
                    {error && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <textarea
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-teal-500 focus:outline-none resize-none"
                        rows={1}
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        disabled={sending}
                      />
                      <button
                        className="px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 self-end"
                        onClick={handleSendReply}
                        disabled={sending || !replyText.trim()}
                      >
                        <Send className="h-3.5 w-3.5" />
                        {sending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a conversation to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
