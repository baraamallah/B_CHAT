
'use client';

import { Logo } from '@/components/icons/Logo';
import { User, MessageSquare, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { motion } from "framer-motion";

const navItems = [
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/search', icon: Search, label: 'Search' },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <Link href="/profile" className="flex items-center gap-2" prefetch={false}>
          <Logo className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold">BCHAT</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <motion.div whileHover={{ scale: 1.05 }} className="w-full relative">
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {isActive && (
                    <motion.div
                      className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r-full"
                      layoutId="active-nav-item"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </motion.div>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
