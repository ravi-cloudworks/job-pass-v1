// components/layout/MainLayout.tsx
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, usePathname } from "next/navigation";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Determine which tab is active based on the current path
  const getActiveTab = () => {
    if (pathname?.includes("/tests")) return "tests";
    if (pathname?.includes("/question-sets")) return "question-sets";
    return "companies"; // Default tab
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* <h1 className="text-2xl font-bold mb-6">Interview Management System</h1>
       */}
      {/* <Tabs 
        defaultValue={getActiveTab()} 
        className="mb-8"
        onValueChange={(value) => {
          // Navigate when tab changes
          switch(value) {
            case "companies":
              router.push("/companies");
              break;
            case "tests":
              router.push("/tests");
              break;
            case "question-sets":
              router.push("/question-sets");
              break;
          }
        }}
      >
        <TabsList className="grid w-full grid-cols-3 h-14 text-lg">
          <TabsTrigger value="companies" className="py-3">Companies</TabsTrigger>
          <TabsTrigger value="tests" className="py-3">Tests</TabsTrigger>
          <TabsTrigger value="question-sets" className="py-3">Question Sets</TabsTrigger>
        </TabsList>
      </Tabs> */}
      
      <main>{children}</main>
    </div>
  );
}