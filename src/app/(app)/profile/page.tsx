
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Edit, LogOut, UserPlus, Check, X, Wifi, WifiOff, Copy, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useRef } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, collection, query, where, onSnapshot, arrayUnion, getDocs, writeBatch, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";


interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    bio: string;
    status: string;
    photoURL: string;
    bgURL: string;
    friends?: string[];
    lastActive?: any;
    online?: boolean;
    role?: 'user' | 'admin';
    friendCode?: string;
    dob?: string;
    phone?: string;
}

interface FriendRequest {
    id: string;
    from: string;
    fromName: string;
    fromPhotoURL: string;
    status: 'pending' | 'accepted' | 'declined';
}

interface Friend {
    uid: string;
    displayName: string;
    photoURL: string;
}

// Function to generate a random friend code
const generateFriendCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};


function EditProfileDialog({ user, onUpdate }: { user: UserProfile, onUpdate: (data: Partial<UserProfile>) => void }) {
    const [displayName, setDisplayName] = useState(user.displayName);
    const [bio, setBio] = useState(user.bio);
    const [status, setStatus] = useState(user.status);
    const [photoURL, setPhotoURL] = useState(user.photoURL);
    const [bgURL, setBgURL] = useState(user.bgURL);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!auth.currentUser) return;
        setIsSaving(true);
        const updatedData: Partial<UserProfile> = { displayName, bio, status, photoURL, bgURL };
        
        try {
            await onUpdate(updatedData);
        } catch (error) {
            console.error("Error updating profile: ", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline"><Edit className="mr-2 h-4 w-4" />Edit Profile</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Input id="status" value={status} onChange={(e) => setStatus(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="photoURL">Profile Picture URL</Label>
                        <Input id="photoURL" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="https://example.com/image.png" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bgURL">Background Image URL</Label>
                        <Input id="bgURL" value={bgURL} onChange={(e) => setBgURL(e.target.value)} placeholder="https://example.com/image.png" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" disabled={isSaving}>Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function FriendsTab({ currentUser, friendIds }: { currentUser: User, friendIds: string[] }) {
    const { toast } = useToast();
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [foundUser, setFoundUser] = useState<Friend | null>(null);
    const [searchMessage, setSearchMessage] = useState("");
    const [sentRequests, setSentRequests] = useState<string[]>([]);

    useEffect(() => {
        const q = query(collection(db, "friendRequests"), where("to", "==", currentUser.uid), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
            setRequests(reqs);
        });
        return () => unsubscribe();
    }, [currentUser.uid]);

     useEffect(() => {
        if (!friendIds || friendIds.length === 0) {
            setFriends([]);
            return;
        }
        const fetchFriends = async () => {
            const friendPromises = friendIds.map(friendId => getDoc(doc(db, 'users', friendId)));
            const friendDocs = await Promise.all(friendPromises);
            const friendData = friendDocs
                .filter(fDoc => fDoc.exists())
                .map(fDoc => ({ uid: fDoc.id, ...fDoc.data() } as Friend));
            setFriends(friendData);
        }
        fetchFriends();
    }, [friendIds]);

    const handleRequest = async (requestId: string, fromId: string, accepted: boolean) => {
        const batch = writeBatch(db);
        const requestRef = doc(db, "friendRequests", requestId);

        if (accepted) {
            batch.update(requestRef, { status: 'accepted' });
            
            const currentUserRef = doc(db, "users", currentUser.uid);
            batch.update(currentUserRef, { friends: arrayUnion(fromId) });

            const friendUserRef = doc(db, "users", fromId);
            batch.update(friendUserRef, { friends: arrayUnion(currentUser.uid) });
            
        } else {
            batch.delete(requestRef);
        }
        await batch.commit();
    };

    const handleSearchFriend = async (e: React.FormEvent) => {
        e.preventDefault();
        setFoundUser(null);
        setSearchMessage("");
        if (!searchQuery.trim()) {
            setSearchMessage("Please enter a friend code.");
            return;
        }

        const q = query(collection(db, "users"), where("friendCode", "==", searchQuery.toUpperCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setSearchMessage("No user found with that friend code.");
            return;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        if (userDoc.id === currentUser.uid) {
            setSearchMessage("You can't add yourself as a friend.");
            return;
        }
        
        if (friendIds.includes(userDoc.id)) {
            setSearchMessage("This user is already your friend.");
            return;
        }

        setFoundUser({ uid: userDoc.id, ...userData } as Friend);
    };

    const handleAddFriend = async (targetUserId: string) => {
        if (!currentUser) return;
        
        const requestId = [currentUser.uid, targetUserId].sort().join('_');
        const requestDoc = await getDoc(doc(db, 'friendRequests', requestId));
        
        if(requestDoc.exists()){
           toast({ title: "Friend request already sent."});
           return;
        }

        const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
        const currentUserData = currentUserDoc.data();

        await setDoc(doc(db, "friendRequests", requestId), {
          from: currentUser.uid,
          to: targetUserId,
          fromName: currentUserData?.displayName,
          fromPhotoURL: currentUserData?.photoURL,
          status: "pending",
          createdAt: serverTimestamp(),
        });

        setSentRequests(prev => [...prev, targetUserId]);
        toast({ title: "Friend request sent!" });
      };


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Find Friend by Code</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearchFriend} className="flex gap-2 mb-4">
                        <Input 
                            placeholder="Enter friend code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Button type="submit"><Search className="h-4 w-4" /></Button>
                    </form>
                    {searchMessage && <p className="text-muted-foreground text-sm">{searchMessage}</p>}
                    {foundUser && (
                        <div className="flex items-center justify-between mt-4 p-2 rounded-md bg-muted">
                           <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={foundUser.photoURL || 'https://placehold.co/100x100.png'} data-ai-hint="person"/>
                                    <AvatarFallback>{foundUser.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <span>{foundUser.displayName}</span>
                            </div>
                             <Button 
                                onClick={() => handleAddFriend(foundUser.uid)}
                                disabled={sentRequests.includes(foundUser.uid)}
                                size="sm"
                              >
                                <UserPlus className="mr-2 h-4 w-4"/>
                                {sentRequests.includes(foundUser.uid) ? 'Sent' : 'Add Friend'}
                             </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Friend Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {requests.length > 0 ? (
                        <ul className="space-y-4">
                            {requests.map(req => (
                                <li key={req.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={req.fromPhotoURL || 'https://placehold.co/100x100.png'} data-ai-hint="person"/>
                                            <AvatarFallback>{req.fromName?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <span>{req.fromName}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="outline" onClick={() => handleRequest(req.id, req.from, true)}><Check className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="outline" onClick={() => handleRequest(req.id, req.from, false)}><X className="h-4 w-4"/></Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">No new friend requests.</p>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>My Friends</CardTitle>
                </CardHeader>
                <CardContent>
                   {friends.length > 0 ? (
                        <ul className="space-y-4">
                            {friends.map(friend => (
                                <li key={friend.uid} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={friend.photoURL || 'https://placehold.co/100x100.png'} data-ai-hint="person"/>
                                            <AvatarFallback>{friend.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <span>{friend.displayName}</span>
                                    </div>
                                    <Link href={`/messages?startChatWith=${friend.uid}`}>
                                      <Button variant="outline">Message</Button>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">You haven't added any friends yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}


export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                setCurrentUser(fbUser);
                const userDocRef = doc(db, "users", fbUser.uid);
                
                const unsub = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        const userData = doc.data();
                        if(!userData.friendCode) {
                            const friendCode = generateFriendCode();
                            updateDoc(userDocRef, {friendCode});
                            setUser({uid: doc.id, ...userData, friendCode } as UserProfile);
                        } else {
                            setUser({uid: doc.id, ...userData} as UserProfile);
                        }
                    } else {
                        // This logic handles creation of user profile if it doesn't exist
                         const newUserProfile: UserProfile = {
                            uid: fbUser.uid,
                            email: fbUser.email || "",
                            displayName: fbUser.displayName || "New User",
                            bio: "",
                            status: "I'm new!",
                            photoURL: fbUser.photoURL || "",
                            bgURL: "",
                            friends: [],
                            lastActive: serverTimestamp(),
                            online: true,
                            role: 'user',
                            friendCode: generateFriendCode(),
                            dob: "",
                            phone: "",
                        };
                        setDoc(userDocRef, newUserProfile).then(() => {
                            setUser(newUserProfile);
                        });
                    }
                     setLoading(false);
                });

                return () => unsub();

            } else {
                router.push("/");
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleUpdateProfile = async (data: Partial<UserProfile>) => {
        if (auth.currentUser) {
            const userDocRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userDocRef, data);
        }
    };

    const handleLogout = async () => {
        if(auth.currentUser) {
            await updateDoc(doc(db, "users", auth.currentUser.uid), { online: false, lastActive: serverTimestamp() });
        }
        await signOut(auth);
        router.push('/');
    }
    
    const renderStatus = () => {
        if (!user) return null;

        if (user.online) {
            return <div className="flex items-center gap-1 text-sm text-green-500"><Wifi className="h-4 w-4" /> Online</div>
        }

        if (user.lastActive) {
            try {
                const lastActiveDate = user.lastActive.toDate();
                return <div className="flex items-center gap-1 text-sm text-muted-foreground"><WifiOff className="h-4 w-4" /> Last active {formatDistanceToNow(lastActiveDate, { addSuffix: true })}</div>
            } catch(e) {
                 return <div className="flex items-center gap-1 text-sm text-muted-foreground"><WifiOff className="h-4 w-4" /> Last active recently</div>
            }
        }
        
        return null;
    }
    
    const handleCopyFriendCode = () => {
        if(user?.friendCode) {
            navigator.clipboard.writeText(user.friendCode);
            toast({title: "Friend code copied to clipboard!"});
        }
    }


    if (loading || !user || !currentUser) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }
    
    const friendIds = user.friends || [];

    return (
        <div className="space-y-6">
            <Card className="mb-8 overflow-hidden">
                <div style={{ backgroundImage: `url(${user.bgURL || 'https://placehold.co/1200x300.png'})`, backgroundSize: 'cover', backgroundPosition: 'center' }} className="h-48 w-full bg-muted" data-ai-hint="abstract background"></div>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6 -mt-16">
                        <Avatar className="h-24 w-24 border-4 border-card ring-2 ring-primary">
                            <AvatarImage src={user.photoURL || "https://placehold.co/200x200.png"} data-ai-hint="person portrait" />
                            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-center md:text-left mt-4 md:mt-0">
                            <div className="flex items-center justify-center md:justify-start gap-2">
                               <h1 className="text-2xl font-bold">{user.displayName}</h1>
                               {user.role === 'admin' && <Badge variant="destructive">Admin</Badge>}
                            </div>
                            <p className="text-muted-foreground italic">"{user.status}"</p>
                            <div className="mt-2">
                                {renderStatus()}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <EditProfileDialog user={user} onUpdate={handleUpdateProfile} />
                            <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/>Logout</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Tabs defaultValue="about">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="about">About Me</TabsTrigger>
                    <TabsTrigger value="friends">Friends</TabsTrigger>
                </TabsList>
                <TabsContent value="about" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>About Me</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold">Bio</h3>
                                    <p className="text-muted-foreground">
                                        {user.bio || "This user hasn't written a bio yet."}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Friend Code</h3>
                                     <div className="flex items-center gap-2">
                                        <p className="text-muted-foreground font-mono bg-muted px-2 py-1 rounded-md">{user.friendCode || 'No code'}</p>
                                        <Button variant="ghost" size="icon" onClick={handleCopyFriendCode}><Copy className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Email</h3>
                                    <p className="text-muted-foreground">{user.email}</p>
                                </div>
                                {user.dob && (
                                    <div>
                                        <h3 className="font-semibold">Birthday</h3>
                                        <p className="text-muted-foreground">{user.dob}</p>
                                    </div>
                                )}
                                 {user.phone && (
                                    <div>
                                        <h3 className="font-semibold">Phone</h3>
                                        <p className="text-muted-foreground">{user.phone}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="friends" className="mt-6">
                   <FriendsTab currentUser={currentUser} friendIds={friendIds} />
                </TabsContent>
            </Tabs>

        </div>
    );
}
