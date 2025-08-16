import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { FileText, User, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

function DocumentResults() {
  const documents = [
    { title: "Neural Network Architectures", author: "Geoffrey Hinton", image: "https://placehold.co/400x300.png", hint: "technology abstract" },
    { title: "The Future of Renewable Energy", author: "Jane Goodall", image: "https://placehold.co/400x300.png", hint: "nature technology" },
    { title: "A Study in Scarlet", author: "Arthur Conan Doyle", image: "https://placehold.co/400x300.png", hint: "vintage book" },
    { title: "The Design of Everyday Things", author: "Don Norman", image: "https://placehold.co/400x300.png", hint: "design objects" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {documents.map((doc) => (
        <Card key={doc.title}>
          <Image src={doc.image} data-ai-hint={doc.hint} alt={doc.title} width={400} height={300} className="w-full h-40 object-cover rounded-t-lg" />
          <CardHeader>
            <CardTitle className="text-base truncate">{doc.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 pt-1"><User className="h-4 w-4"/> {doc.author}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full"><FileText className="mr-2 h-4 w-4"/> View Document</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UserResults() {
  const users = [
    { name: "Alan Turing", role: "Mathematician & Computer Scientist", avatar: "https://placehold.co/100x100.png", tags: ["#crypto", "#AI", "#theory"] },
    { name: "Marie Curie", role: "Physicist & Chemist", avatar: "https://placehold.co/100x100.png", tags: ["#physics", "#chemistry", "#research"] },
    { name: "Leonardo da Vinci", role: "Polymath", avatar: "https://placehold.co/100x100.png", tags: ["#art", "#science", "#invention"] },
  ]
  return (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map(user => (
            <Card key={user.name} className="text-center">
                <CardContent className="p-6">
                    <Avatar className="h-20 w-20 mx-auto mb-4">
                        <AvatarImage src={user.avatar} data-ai-hint="person portrait"/>
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.role}</p>
                    <div className="flex flex-wrap gap-1 justify-center mt-4">
                        {user.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full"><MessageCircle className="mr-2 h-4 w-4"/> Message</Button>
                </CardFooter>
            </Card>
        ))}
     </div>
  )
}

export default function SearchPage() {
  // In a real app, you'd use useSearchParams() to get the query
  const query = "Innovation";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Search Results for &quot;{query}&quot;</h1>
      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="documents" className="mt-6">
          <DocumentResults />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <UserResults />
        </TabsContent>
      </Tabs>
    </div>
  );
}
