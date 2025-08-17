
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Send, Search, Trash2, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, getDoc, setDoc, getDocs, updateDoc, writeBatch } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


interface Conversation {
    id: string;
    participants: string[];
    lastMessage: string;
    timestamp: any;
    otherUser: {
        uid: string;
        displayName: string;
        photoURL: string;
    }
}

function ConversationList({ onSelectConversation, activeConversationId }: { onSelectConversation: (id: string, otherUser: any) => void, activeConversationId: string | null }) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(collection(db, "conversations"), where("participants", "array-contains", currentUser.uid));

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const convs: Conversation[] = [];
            for (const docSnap of querySnapshot.docs) {
                const data = docSnap.data();
                const otherUserId = data.participants.find((p: string) => p !== currentUser.uid);

                if (otherUserId) {
                    const userDoc = await getDoc(doc(db, "users", otherUserId));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        convs.push({
                            id: docSnap.id,
                            ...data,
                            otherUser: {
                                uid: otherUserId,
                                displayName: userData.displayName,
                                photoURL: userData.photoURL,
                            }
                        } as Conversation);
                    }
                }
            }
            setConversations(convs.sort((a,b) => b.timestamp - a.timestamp));
        });

        return () => unsubscribe();
    }, [currentUser]);

    if (!currentUser) return null;

    return (
        <Card className="h-full">
            <CardHeader className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search messages" className="pl-8" />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex-1 overflow-auto">
                    {conversations.map(c => (
                        <div key={c.id}
                             onClick={() => onSelectConversation(c.id, c.otherUser)}
                             className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 ${activeConversationId === c.id ? 'bg-muted' : ''}`}>
                            <Avatar>
                                <AvatarImage src={c.otherUser.photoURL || 'https://placehold.co/100x100.png'} data-ai-hint="person"/>
                                <AvatarFallback>{c.otherUser.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold">{c.otherUser.displayName}</p>
                                <p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: any;
    isDeleted?: boolean;
}

function ChatInterface({ conversationId, otherUser, currentUser }: { conversationId: string | null, otherUser: any | null, currentUser: User | null }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);
    
    useEffect(() => {
        if (!conversationId) return;

        const q = query(collection(db, "conversations", conversationId, "messages"), orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [conversationId]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !conversationId) return;

        const messageData = {
            text: newMessage,
            senderId: currentUser.uid,
            timestamp: serverTimestamp(),
            isDeleted: false,
        };
        
        const batch = writeBatch(db);

        const messagesRef = doc(collection(db, "conversations", conversationId, "messages"));
        batch.set(messagesRef, messageData);

        const conversationRef = doc(db, "conversations", conversationId);
        batch.update(conversationRef, {
            lastMessage: newMessage,
            timestamp: serverTimestamp()
        });

        await batch.commit();
        setNewMessage("");
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!conversationId) return;
        const messageRef = doc(db, "conversations", conversationId, "messages", messageId);
        await updateDoc(messageRef, {
            text: "This message was deleted.",
            isDeleted: true
        });
    };

    if (!conversationId || !otherUser || !currentUser) {
        return (
            <Card className="h-full flex flex-col items-center justify-center">
                <CardContent>
                    <div className="text-center text-muted-foreground">
                        <MessageSquare size={48} className="mx-auto mb-4" />
                        <h2 className="text-xl font-semibold">Select a conversation</h2>
                        <p>Start chatting with your contacts.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    const {displayName, photoURL} = otherUser;

    return (
        <Card className="h-full flex flex-col">
            <div className="p-4 border-b flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={photoURL || 'https://placehold.co/100x100.png'} data-ai-hint="person"/>
                    <AvatarFallback>{displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{displayName}</p>
                    {/*<p className="text-sm text-muted-foreground">Online</p>*/}
                </div>
            </div>
            <CardContent className="flex-1 overflow-auto p-6 space-y-6">
                 {messages.map(msg => (
                     <div key={msg.id} className={`group flex items-end gap-3 ${msg.senderId === currentUser.uid ? 'justify-end' : ''}`}>
                        {msg.senderId !== currentUser.uid && (
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={photoURL || "https://placehold.co/100x100.png"} data-ai-hint="person"/>
                                <AvatarFallback>{displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={`p-3 rounded-lg max-w-xs sm:max-w-md relative ${msg.senderId === currentUser.uid ? 'rounded-br-none bg-primary text-primary-foreground' : 'rounded-bl-none bg-muted'}`}>
                            <p className={`text-sm ${msg.isDeleted ? 'italic text-muted-foreground' : ''}`}>{msg.text}</p>
                             {msg.senderId === currentUser.uid && !msg.isDeleted && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="absolute -top-4 -right-4 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                       <Button variant="destructive" className="w-full" onClick={() => handleDeleteMessage(msg.id)}>
                                            Delete
                                        </Button>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                         {msg.senderId === currentUser.uid && (
                            <Avatar className="h-8 w-8">
                                 <AvatarImage src={currentUser.photoURL || "https://placehold.co/100x100.png"} data-ai-hint="person"/>
                                <AvatarFallback>{currentUser.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                 ))}
                 <div ref={messagesEndRef} />
            </CardContent>
            <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="relative">
                    <Textarea
                        placeholder="Type your message..."
                        className="pr-24 min-h-[60px] resize-none"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <Button variant="ghost" size="icon" type="button">
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" type="button">
                            <Italic className="h-4 w-4" />
                        </Button>
                        <Button size="icon" type="submit">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </div>
        </Card>
    );
}

export default function MessagesPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [activeOtherUser, setActiveOtherUser] = useState<any | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                setCurrentUser(user);
            } else {
                router.push('/');
            }
        });
        return () => unsubscribe();
    }, [router]);
    
    useEffect(() => {
        const startChatWith = searchParams.get('startChatWith');
        if (startChatWith && currentUser) {
            const getOrCreateConversation = async () => {
                const conversationQuery = query(
                    collection(db, 'conversations'),
                    where('participants', 'in', [[currentUser.uid, startChatWith], [startChatWith, currentUser.uid]])
                );
                
                const querySnapshot = await getDocs(conversationQuery);

                let convId = null;

                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    const participants = data.participants;
                    if(participants.includes(currentUser.uid) && participants.includes(startChatWith)){
                       convId = doc.id;
                    }
                });

                if (convId) {
                    const userDoc = await getDoc(doc(db, "users", startChatWith));
                    setActiveConversationId(convId);
                    setActiveOtherUser({uid: startChatWith, ...userDoc.data()});
                } else {
                    const newConvDoc = await addDoc(collection(db, 'conversations'), {
                        participants: [currentUser.uid, startChatWith],
                        lastMessage: "Started a new conversation.",
                        timestamp: serverTimestamp(),
                    });
                    const userDoc = await getDoc(doc(db, "users", startChatWith));
                    setActiveConversationId(newConvDoc.id);
                    setActiveOtherUser({uid: startChatWith, ...userDoc.data()});
                }
                 // remove query param
                router.replace('/messages', undefined);
            };
            getOrCreateConversation();
        }
    }, [searchParams, currentUser, router])


    const handleSelectConversation = (id: string, otherUser: any) => {
        setActiveConversationId(id);
        setActiveOtherUser(otherUser);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-theme(spacing.24))]">
            <div className="md:col-span-1 lg:col-span-1 hidden md:block">
               <ConversationList onSelectConversation={handleSelectConversation} activeConversationId={activeConversationId}/>
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
               <ChatInterface conversationId={activeConversationId} otherUser={activeOtherUser} currentUser={currentUser} />
            </div>
        </div>
    )
}

    