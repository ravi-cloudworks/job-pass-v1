// components/layout/Breadcrumbs.tsx
import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center text-sm mb-6 bg-gray-50 p-3 rounded-md">
      {/* <Link href="/" className="flex items-center text-gray-600 hover:text-blue-600">
        <Home className="h-4 w-4 mr-1" />
        <span>Home</span>
      </Link> */}
      
      {items.map((item, index) => (
        <li key={index}>
          {index < items.length - 1 ? (
            <button 
              onClick={item.onClick}
              className="hover:text-blue-600"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-500">{item.label}</span>
          )}
        </li>
      ))}
    </nav>
  );
}