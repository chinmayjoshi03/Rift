
import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-[#0D1B2A] text-white selection:bg-blue/30 overflow-hidden">
            <Sidebar />
            <main className="ml-64 min-h-screen relative">
                {/* Global ambient light effects */}
                <div className="fixed top-0 left-0 right-0 h-[500px] bg-blue/5 blur-[100px] pointer-events-none" />
                <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[100px] pointer-events-none" />

                <div className="relative z-10 p-8 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
