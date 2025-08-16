
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Edit, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useRef } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    bio: string;
    status: string;
    photoURL: string;
    bgURL: string;
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

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser(userDoc.data() as UserProfile);
                } else {
                    // If user exists in auth but not in firestore, create the document
                    const newUserProfile: UserProfile = {
                        uid: currentUser.uid,
                        email: currentUser.email || "",
                        displayName: currentUser.displayName || "New User",
                        bio: "",
                        status: "I'm new!",
                        photoURL: currentUser.photoURL || "",
                        bgURL: ""
                    };
                    await setDoc(userDocRef, newUserProfile);
                    setUser(newUserProfile);
                }
            } else {
                router.push("/");
            }
            setLoading(false);
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

    if (loading) {
        return <div className="flex justify-center items-center h-full">Loading...</div>;
    }

    if (!user) {
        // This case should ideally not be hit anymore, but as a fallback
        return <div className="flex justify-center items-center h-full">User not found. Redirecting...</div>;
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
                            <p className="text-muted-foreground">{user.status}</p>
                        </div>
                        <div className="flex gap-2">
                            <EditProfileDialog user={user} onUpdate={handleUpdateProfile} />
                            <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/>Logout</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
        </div>
    );
}
