
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, Users, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Linkify from 'react-linkify';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    timestamp: any;
    sender: string;
  };
  participantDetails: {
    [uid: string]: {
      displayName: string;
      photoURL: string;
      online?: boolean;
    };
  };
}

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: any;
}

function ConversationList({
  conversations,
  onSelectConversation,
  selectedConversationId,
  currentUser,
  loading,
}: {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  selectedConversationId: string | null;
  currentUser: User;
  loading: boolean;
}) {

  const getOtherParticipant = (convo: Conversation) => {
    const otherId = convo.participants.find(p => p !== currentUser.uid);
    return convo.participantDetails[otherId || ''];
  };

  if (loading) {
     return (
        <div className="p-4 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
     )
  }

  if (conversations.length === 0) {
      return (
          <div className="p-4 text-center text-muted-foreground">
            <MessageSquare className="mx-auto h-10 w-10 mb-2" />
            <p>No conversations yet. Start one from a user's profile!</p>
          </div>
      )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {conversations.map(convo => {
          const otherParticipant = getOtherParticipant(convo);
          if (!otherParticipant) return null;

          return (
            <button
              key={convo.id}
              onClick={() => onSelectConversation(convo.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
                selectedConversationId === convo.id ? 'bg-primary/10' : 'hover:bg-muted'
              )}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherParticipant.photoURL} data-ai-hint="person" />
                <AvatarFallback>{otherParticipant.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <p className="font-semibold">{otherParticipant.displayName}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {convo.lastMessage?.text || 'No messages yet'}
                </p>
              </div>
              {convo.lastMessage?.timestamp && (
                 <p className="text-xs text-muted-foreground self-start">
                    {formatDistanceToNow(convo.lastMessage.timestamp.toDate(), { addSuffix: true })}
                 </p>
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function ChatWindow({ conversationId, currentUser }: { conversationId: string | null; currentUser: User | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) {
        setLoading(false);
        return;
    };
    setLoading(true);

    const convoRef = doc(db, 'conversations', conversationId);
    const convoUnsub = onSnapshot(convoRef, (docSnap) => {
        if(docSnap.exists()) {
            setConversation({ id: docSnap.id, ...docSnap.data() } as Conversation)
        }
    }, async (error) => {
        const permissionError = new FirestorePermissionError({
            path: convoRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setLoading(false);
    }, async (error) => {
        const permissionError = new FirestorePermissionError({
            path: messagesRef.path,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
    });

    return () => {
        unsub();
        convoUnsub();
    };
  }, [conversationId]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !currentUser) return;

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const conversationRef = doc(db, 'conversations', conversationId);
    const text = newMessage;
    setNewMessage('');
    
    const newMsg = {
      sender: currentUser.uid,
      text: text,
      timestamp: serverTimestamp(),
    };

    const batch = writeBatch(db);
    
    batch.set(doc(messagesRef), newMsg);
    batch.update(conversationRef, {
        lastMessage: {
            text: text,
            timestamp: serverTimestamp(),
            sender: currentUser.uid
        }
    });

    await batch.commit().catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: conversationRef.path, // or messagesRef, depending on what fails
            operation: 'write',
            requestResourceData: { newMessage: newMsg, lastMessageUpdate: {text} },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  if (loading) {
      return (
        <div className="h-full flex flex-col p-4">
             <div className="flex items-center gap-4 border-b pb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </div>
            <div className="flex-1 space-y-4 py-4">
                 <Skeleton className="h-10 w-3/4" />
                 <Skeleton className="h-10 w-1/2 ml-auto" />
                 <Skeleton className="h-12 w-2/3" />
            </div>
             <Skeleton className="h-10 w-full" />
        </div>
      )
  }

  if (!conversationId || !conversation || !currentUser) {
    return (
      <Card className="h-full flex flex-col items-center justify-center border-0 shadow-none">
        <CardContent>
          <div className="text-center text-muted-foreground">
            <MessageSquare size={48} className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Select a conversation</h2>
            <p>Or start a new one from a user's profile.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const otherParticipantId = conversation.participants.find(p => p !== currentUser.uid);
  const otherParticipant = otherParticipantId ? conversation.participantDetails[otherParticipantId] : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 p-4 border-b">
         {otherParticipant && (
            <>
                <Avatar>
                    <AvatarImage src={otherParticipant.photoURL} data-ai-hint="person" />
                    <AvatarFallback>{otherParticipant.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{otherParticipant.displayName}</p>
                    <p className={cn("text-xs", otherParticipant.online ? 'text-green-500' : 'text-muted-foreground')}>
                        {otherParticipant.online ? 'Online' : 'Offline'}
                    </p>
                </div>
            </>
         )}
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map(msg => {
            const isSender = msg.sender === currentUser.uid;
            return (
              <div
                key={msg.id}
                className={cn('flex items-end gap-2', isSender ? 'justify-end' : '')}
              >
                {!isSender && otherParticipant && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={otherParticipant.photoURL} data-ai-hint="person" />
                        <AvatarFallback>{otherParticipant.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2',
                    isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                    <Linkify componentDecorator={(decoratedHref, decoratedText, key) => (
                        <a target="blank" href={decoratedHref} key={key} className="underline hover:text-primary/80">
                            {decoratedText}
                        </a>
                    )}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                    </Linkify>
                    <p className={cn("text-xs mt-1", isSender ? 'text-primary-foreground/70' : 'text-muted-foreground/70')}>
                       {msg.timestamp ? format(msg.timestamp.toDate(), 'p') : 'sending...'}
                    </p>
                </div>
                {isSender && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser.photoURL || ''} data-ai-hint="person" />
                        <AvatarFallback>{currentUser.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </div>
  );
}

export default function MessagesClientPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const startChat = useCallback(async (targetUserId: string, localCurrentUser: User) => {
    // Prevent starting chat with self
    if (localCurrentUser.uid === targetUserId) return;

    // Check if a conversation already exists
    const sortedIds = [localCurrentUser.uid, targetUserId].sort();
    const conversationId = sortedIds.join('_');
    const conversationRef = doc(db, 'conversations', conversationId);

    const docSnap = await getDoc(conversationRef);

    if (docSnap.exists()) {
        setSelectedConversationId(conversationId);
        router.replace('/messages', undefined);
    } else {
        // Create a new conversation
        const currentUserDoc = await getDoc(doc(db, 'users', localCurrentUser.uid));
        const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));

        if (currentUserDoc.exists() && targetUserDoc.exists()) {
            const currentUserData = currentUserDoc.data();
            const targetUserData = targetUserDoc.data();

            const newConversation = {
                participants: sortedIds,
                createdAt: serverTimestamp(),
                participantDetails: {
                    [localCurrentUser.uid]: {
                        displayName: currentUserData.displayName,
                        photoURL: currentUserData.photoURL,
                    },
                    [targetUserId]: {
                        displayName: targetUserData.displayName,
                        photoURL: targetUserData.photoURL,
                    }
                }
            };
            
            await setDoc(conversationRef, newConversation).catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: conversationRef.path,
                    operation: 'create',
                    requestResourceData: newConversation
                });
                errorEmitter.emit('permission-error', permissionError);
            });

            setSelectedConversationId(conversationId);
            // Clear the query param after handling
            router.replace('/messages', undefined);
        }
    }
  }, [router]);


  useEffect(() => {
    if (currentUser) {
      const startChatWith = searchParams.get('startChatWith');
      if (startChatWith) {
        startChat(startChatWith, currentUser);
      }
    }
  }, [currentUser, searchParams, startChat]);
  

  useEffect(() => {
    if (!currentUser) return;

    setLoadingConversations(true);
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessage.timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
        const convosPromises = snapshot.docs.map(async (docSnap) => {
        const convoData = docSnap.data() as Omit<Conversation, 'id'>;
        
        // Fetch details for all participants
        const participantDetails: Conversation['participantDetails'] = {};
        await Promise.all(convoData.participants.map(async (pid) => {
            if (!participantDetails[pid]) {
                const userDoc = await getDoc(doc(db, 'users', pid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    participantDetails[pid] = {
                        displayName: userData.displayName || 'Unknown User',
                        photoURL: userData.photoURL || '',
                        online: userData.online || false
                    };
                }
            }
        }));

        return {
          id: docSnap.id,
          ...convoData,
          participantDetails
        } as Conversation;
      });

      const convos = await Promise.all(convosPromises);
      setConversations(convos);
      setLoadingConversations(false);
    }, async (error) => {
        const permissionError = new FirestorePermissionError({
            path: q.toString(), // Note: This isn't perfect, but gives a hint
            operation: 'list'
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoadingConversations(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (loading || !currentUser) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-theme(spacing.24))]">
            <div className="md:col-span-1 lg:col-span-1 hidden md:block">
               <Card className="h-full">
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </CardContent>
               </Card>
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <Card className="h-full flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </Card>
            </div>
        </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-theme(spacing.24))]">
      <Card className="md:col-span-1 lg:col-span-1 hidden md:flex flex-col">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users/> Conversations</CardTitle>
        </CardHeader>
        <ConversationList
          conversations={conversations}
          onSelectConversation={setSelectedConversationId}
          selectedConversationId={selectedConversationId}
          currentUser={currentUser}
          loading={loadingConversations}
        />
      </Card>
      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <ChatWindow conversationId={selectedConversationId} currentUser={currentUser} />
      </Card>
    </div>
  );
}
