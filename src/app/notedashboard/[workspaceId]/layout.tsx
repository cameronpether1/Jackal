import Sidebar from "@/components/sidebar/sidebar";
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
  params: any;
}

const Layout: React.FC<LayoutProps> = ({ children, params }) => {
  return (
    <main className="flex overflow-hidden h-screen w-screen ">
      <Sidebar params={params} className="w-screen inline-block" />

      <div className="  w-full relative">{children}</div>
    </main>
  );
};

export default Layout;
