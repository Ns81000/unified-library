"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface ItemCardProps {
  item: any;
  onClick: () => void;
}

export default function ItemCard({ item, onClick }: ItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const imageSrc = item.coverImage
    ? item.coverImage
    : "/media/placeholder.svg";

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-lg overflow-hidden border bg-card hover:shadow-lg transition-all"
    >
      <div className="aspect-[2/3] relative bg-muted">
        {item.coverImage ? (
          <Image
            src={imageSrc}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
            unoptimized
            onError={(e) => {
              e.currentTarget.src = "/media/placeholder.svg";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{item.title}</h3>
        <Badge variant="secondary" className="text-xs">
          {item.type}
        </Badge>
        
        {/* Display AI explanation if it exists (from AI search) */}
        {item.explanation && (
          <div
            onClick={(e) => {
              e.stopPropagation(); // Prevent opening the modal
              setIsExpanded(!isExpanded);
            }}
            className="mt-2 cursor-pointer group/explanation"
          >
            <p
              className={`text-xs text-muted-foreground italic border-l-2 border-primary pl-2 transition-all ${
                isExpanded ? "" : "line-clamp-3"
              }`}
            >
              {item.explanation}
            </p>
            <p className="text-[10px] text-primary mt-1 group-hover/explanation:underline">
              {isExpanded ? "Show less" : "Read more"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
