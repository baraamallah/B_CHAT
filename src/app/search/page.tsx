

"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { FileText, User, MessageCircle, Search as SearchIcon, UserPlus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, limit, startAt, endAt, orderBy, doc, setDoc, getDoc, serverTimestamp, or } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import Link from "next/link";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";

interface FoundUser {
  uid: string;
  displayName: string;
  photoURL: string;
  role: string;
  tags: string[];
  friendCode: string;
}

function UserResults({ users, currentUser }: { users: FoundUser[], currentUser: FirebaseUser | null }) {
  const { toast } = useToast();
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  
  const handleAddFriend = async (targetUserId: string) => {
    if (!currentUser) return;
    
    // Check if a request already exists
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
  
  if (users.length === 0) {
    return <p className="text-muted-foreground text-center col-span-full">No users found.</p>
  }
  
  return (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map(user => (
            <Card key={user.uid} className="text-center flex flex-col">
                <CardContent className="p-6 flex-grow">
                    <Avatar className="h-20 w-20 mx-auto mb-4">
                        <AvatarImage src={user.photoURL || "https://placehold.co/100x100.png"} data-ai-hint="person portrait"/>
                        <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold">{user.displayName}</h3>
                     <p className="text-sm text-muted-foreground font-mono">{user.friendCode}</p>
                    <div className="flex flex-wrap gap-1 justify-center mt-4">
                        {(user.tags || []).map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button 
                     className="w-full"
                     onClick={() => handleAddFriend(user.uid)}
                     disabled={sentRequests.includes(user.uid)}
                   >
                     {sentRequests.includes(user.uid) ? <CheckCircle className="mr-2 h-4 w-4"/> : <UserPlus className="mr-2 h-4 w-4"/>}
                     {sentRequests.includes(user.uid) ? 'Request Sent' : 'Add Friend'}
                  </Button>
                  <Link href={`/messages?startChatWith=${user.uid}`} className="w-full">
                    <Button className="w-full" variant="secondary"><MessageCircle className="mr-2 h-4 w-4"/> Message</Button>
                  </Link>
                </CardFooter>
            </Card>
        ))}
     </div>
  )
}

function SearchPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState<FoundUser[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

   useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim() || !currentUser) {
        setUserResults([]);
        return;
      };

      const usersRef = collection(db, "users");
      const normalizedQuery = searchQuery.toUpperCase();
      
      const nameQuery = query(usersRef, orderBy("displayName"), startAt(searchQuery), endAt(searchQuery + '\uf8ff'), limit(20));
      const codeQuery = query(usersRef, where("friendCode", "==", normalizedQuery), limit(20));

      const [nameSnapshot, codeSnapshot] = await Promise.all([
          getDocs(nameQuery),
          getDocs(codeQuery)
      ]);
      
      const users: FoundUser[] = [];
      const seenUids = new Set();
      
      const processSnapshot = (snapshot: any) => {
        snapshot.forEach((doc: any) => {
            if (doc.id !== currentUser.uid && !seenUids.has(doc.id)) {
                users.push({ uid: doc.id, ...doc.data() } as FoundUser);
                seenUids.add(doc.id);
            }
        });
      }

      processSnapshot(nameSnapshot);
      processSnapshot(codeSnapshot);

      setUserResults(users);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-3xl font-bold">Search</h1>
      
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input 
          type="search" 
          placeholder="Search by name or friend code..." 
          className="flex-grow"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button type="submit"><SearchIcon className="mr-2 h-4 w-4" /> Search</Button>
      </form>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="documents" disabled>Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-6">
          <UserResults users={userResults} currentUser={currentUser} />
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          {/* Document results can be re-enabled here if needed */}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SearchPage() {
    return (
      <div className="flex flex-col min-h-screen">
        <Header/>
        <main className="flex-1">
          <SearchPageContent />
        </main>
      </div>
    );
  }