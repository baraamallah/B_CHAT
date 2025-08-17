
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Edit, LogOut, UserPlus, Check, X, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useRef } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc, collection, query, where, onSnapshot, arrayUnion, arrayRemove, getDocs, writeBatch, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";


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

function EditProfileDialog({ user, onUpdate }: { user: UserProfile, onUpdate: (data: Partial<UserProfile>) => void }) {
    const [displayName, setDisplayName] = useState(user.displayName);
    const [bio, setBio] = useState(user.bio);
    const [status, setStatus] = useState(user.status);
    const profilePicRef = useRef<HTMLInputElement>(null);
    const bgRef = useRef<HTMLInputElement>(null);
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
    const [bgFile, setBgFile] = useState<File | null>(null);

    const handleSave = async () => {
        const updatedData: Partial<UserProfile> = { displayName, bio, status };
        
        if (profilePicFile) {
            const storageRef = ref(storage, `profile_pictures/${auth.currentUser?.uid}`);
            await uploadBytes(storageRef, profilePicFile);
            updatedData.photoURL = await getDownloadURL(storageRef);
        }

        if (bgFile) {
            const storageRef = ref(storage, `backgrounds/${auth.currentUser?.uid}`);
            await uploadBytes(storageRef, bgFile);
            updatedData.bgURL = await getDownloadURL(storageRef);
        }
        
        onUpdate(updatedData);
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
                        <Label>Profile Picture</Label>
                        <Input type="file" ref={profilePicRef} onChange={(e) => setProfilePicFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Background Image</Label>
                        <Input type="file" ref={bgRef} onChange={(e) => setBgFile(e.target.files?.[0] || null)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button onClick={handleSave}>Save</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function FriendsTab({ currentUser }: { currentUser: User }) {
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);

    useEffect(() => {
        const q = query(collection(db, "friendRequests"), where("to", "==", currentUser.uid), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
            setRequests(reqs);
        });
        return () => unsubscribe();
    }, [currentUser.uid]);

     useEffect(() => {
        const unsub = onSnapshot(doc(db, 'users', currentUser.uid), async (doc) => {
            const userData = doc.data() as UserProfile;
            if (userData && userData.friends) {
                 if (userData.friends.length === 0) {
                    setFriends([]);
                    return;
                }
                const friendPromises = userData.friends.map(friendId => getDoc(db.collection('users').doc(friendId)));
                const friendDocs = await Promise.all(friendPromises);
                const friendData = friendDocs.filter(fDoc => fDoc.exists()).map(fDoc => ({ uid: fDoc.id, ...fDoc.data() } as Friend));
                setFriends(friendData);
            }
        });
        return () => unsub();
    }, [currentUser.uid]);


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

    return (
        <div className="space-y-6">
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                setCurrentUser(fbUser);
                const userDocRef = doc(db, "users", fbUser.uid);
                
                const unsub = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        setUser(doc.data() as UserProfile);
                    } else {
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
                        };
                        setDoc(userDocRef, newUserProfile);
                        setUser(newUserProfile);
                    }
                });

                setLoading(false);
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
            setUser(prevUser => prevUser ? { ...prevUser, ...data } : null);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/');
    }
    
    const renderStatus = () => {
        if (!user) return null;

        if (user.online) {
            return <div className="flex items-center gap-1 text-sm text-green-500"><Wifi className="h-4 w-4" /> Online</div>
        }

        if (user.lastActive) {
            const lastActiveDate = user.lastActive.toDate();
            return <div className="flex items-center gap-1 text-sm text-muted-foreground"><WifiOff className="h-4 w-4" /> Last active {formatDistanceToNow(lastActiveDate, { addSuffix: true })}</div>
        }
        
        return null;
    }


    if (loading || !user || !currentUser) {
        return <div className="flex justify-center items-center h-full">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <Card className="mb-8 overflow-hidden">
                <div style={{ backgroundImage: `url(${user.bgURL || 'https://placehold.co/1200x300.png'})`, backgroundSize: 'cover', backgroundPosition: 'center' }} className="h-48 w-full" data-ai-hint="abstract background"></div>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6 -mt-16">
                        <Avatar className="h-24 w-24 border-4 border-card ring-2 ring-primary">
                            <AvatarImage src={user.photoURL || "https://placehold.co/200x200.png"} data-ai-hint="person portrait" />
                            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-center md:text-left mt-4 md:mt-0">
                            <h1 className="text-2xl font-bold">{user.displayName}</h1>
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
                            <p className="text-muted-foreground">
                                {user.bio || "This user hasn't written a bio yet."}
                            </p>
                            <div className="mt-4">
                                <Badge variant="secondary">{user.email}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="friends" className="mt-6">
                   <FriendsTab currentUser={currentUser} />
                </TabsContent>
            </Tabs>

        </div>
    );
}

    