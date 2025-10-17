"use client"

import * as React from "react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/nav-main"

import {Command, MessageSquareIcon, UploadCloudIcon, LayoutDashboard} from 'lucide-react'
import { NavChats } from "@/components/nav-chats"
import { useUser } from "@/context/UserContext"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  
  const data = {
  navMain: [
        {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Chats",
      url: "/chat",
      icon: MessageSquareIcon,
    },
    {
      title: "Upload",
      url: "/upload",
      icon: UploadCloudIcon,

    },
  ],

}
  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">PASCHEK</span>
                  <span className="truncate text-xs">Chatbot</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
                <NavMain items={data.navMain} />
                {user?.email && <NavChats />}

      </SidebarContent>
      <SidebarFooter>
       <NavUser/>
      </SidebarFooter>
    </Sidebar>
  )
}
