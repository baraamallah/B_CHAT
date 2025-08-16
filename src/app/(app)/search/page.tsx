
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { FileText, User, MessageCircle, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, limit, startAt, endAt, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

interface FoundUser {
  uid: string;
  displayName: string;
  photoURL: string;
  role: string; // Assuming role is a field, otherwise provide a default
  tags: string[]; // Assuming tags is a field, otherwise provide a default
}

function UserResults({ users }: { users: FoundUser[] }) {
  if (users.length === 0) {
    return <p className="text-muted-foreground text-center col-span-full">No users found.</p>
  }
  return (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map(user => (
            <Card key={user.uid} className="text-center">
                <CardContent className="p-6">
                    <Avatar className="h-20 w-20 mx-auto mb-4">
                        <AvatarImage src={user.photoURL || "https://placehold.co/100x100.png"} data-ai-hint="person portrait"/>
                        <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold">{user.displayName}</h3>
                    <p className="text-sm text-muted-foreground">{user.role || 'BCHAT User'}</p>
                    <div className="flex flex-wrap gap-1 justify-center mt-4">
                        {(user.tags || []).map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                    </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/messages?startChatWith=${user.uid}`} className="w-full">
                    <Button className="w-full"><MessageCircle className="mr-2 h-4 w-4"/> Message</Button>
                  </Link>
                </CardFooter>
            </Card>
        ))}
     </div>
  )
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState<FoundUser[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

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
      const q = query(usersRef, 
        orderBy("displayName"), 
        startAt(searchQuery),
        endAt(searchQuery + '\uf8ff'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const users: FoundUser[] = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== currentUser.uid) { // Exclude current user from results
          users.push({ uid: doc.id, ...doc.data() } as FoundUser);
        }
      });
      setUserResults(users);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Search</h1>
      
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input 
          type="search" 
          placeholder="Search for users..." 
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
          <UserResults users={userResults}/>
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          {/* Document results can be re-enabled here if needed */}
        </TabsContent>
      </Tabs>
    </div>
  );
}

    