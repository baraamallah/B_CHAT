import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Send, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

function ConversationList() {
    const conversations = [
        { name: 'Alice Johnson', message: 'Sounds great, let me review it.', avatar: 'https://placehold.co/100x100.png', initial: 'AJ' },
        { name: 'Bob Williams', message: 'Can you send over the latest draft?', avatar: 'https://placehold.co/100x100.png', initial: 'BW', active: true },
        { name: 'Charlie Brown', message: 'I\'ve uploaded the new designs.', avatar: 'https://placehold.co/100x100.png', initial: 'CB' },
        { name: 'Diana Miller', message: 'Let\'s sync up tomorrow morning.', avatar: 'https://placehold.co/100x100.png', initial: 'DM' },
    ];

    return (
        <Card className="h-full">
            <CardContent className="p-0">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search messages" className="pl-8" />
                    </div>
                </div>
                <div className="flex-1 overflow-auto">
                    {conversations.map(c => (
                        <div key={c.name} className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 ${c.active ? 'bg-muted' : ''}`}>
                            <Avatar>
                                <AvatarImage src={c.avatar} data-ai-hint="person"/>
                                <AvatarFallback>{c.initial}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold">{c.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{c.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function ChatInterface() {
    return (
        <Card className="h-full flex flex-col">
            <div className="p-4 border-b flex items-center gap-3">
                <Avatar>
                    <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="person"/>
                    <AvatarFallback>BW</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">Bob Williams</p>
                    <p className="text-sm text-muted-foreground">Online</p>
                </div>
            </div>
            <CardContent className="flex-1 overflow-auto p-6 space-y-6">
                 <div className="flex items-end gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="person"/>
                        <AvatarFallback>BW</AvatarFallback>
                    </Avatar>
                    <div className="p-3 rounded-lg rounded-bl-none bg-muted max-w-xs sm:max-w-md">
                        <p className="text-sm">Can you send over the latest draft of the proposal? I want to give it a final look before the meeting.</p>
                    </div>
                </div>
                <div className="flex items-end gap-3 justify-end">
                     <div className="p-3 rounded-lg rounded-br-none bg-primary text-primary-foreground max-w-xs sm:max-w-md">
                        <p className="text-sm">Sure, just sent it to your email. Let me know what you think!</p>
                    </div>
                    <Avatar className="h-8 w-8">
                         <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="person"/>
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                </div>
                 <div className="flex items-end gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="person"/>
                        <AvatarFallback>BW</AvatarFallback>
                    </Avatar>
                    <div className="p-3 rounded-lg rounded-bl-none bg-muted max-w-xs sm:max-w-md">
                        <p className="text-sm">Perfect, got it. I'll get back to you with feedback in an hour.</p>
                    </div>
                </div>
            </CardContent>
            <div className="p-4 border-t">
                <div className="relative">
                    <Textarea placeholder="Type your message..." className="pr-24 min-h-[60px] resize-none"/>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <Button variant="ghost" size="icon">
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Italic className="h-4 w-4" />
                        </Button>
                        <Button size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}


export default function MessagesPage() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-theme(spacing.32))]">
            <div className="md:col-span-1 lg:col-span-1 hidden md:block">
               <ConversationList />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
               <ChatInterface />
            </div>
        </div>
    )
}
