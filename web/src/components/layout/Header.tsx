"use client";

import { Bell, Search, User } from "lucide-react";

export function Header() {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <div className="w-full flex-1">
                <form>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Search..."
                            className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3 outline-none border rounded-md px-2 py-1 focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </form>
            </div>
            <button className="rounded-full size-8 flex items-center justify-center hover:bg-muted">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Toggle notifications</span>
            </button>
            <button className="rounded-full size-8 flex items-center justify-center bg-secondary hover:bg-secondary/80">
                <User className="h-4 w-4" />
                <span className="sr-only">Toggle user menu</span>
            </button>
        </header>
    );
}
