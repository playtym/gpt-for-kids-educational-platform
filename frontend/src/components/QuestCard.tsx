
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestCardProps {
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  image: string;
  className?: string;
}

const QuestCard: React.FC<QuestCardProps> = ({
  title,
  description,
  category,
  difficulty,
  image,
  className,
}) => {
  // Get color based on difficulty
  const getDifficultyColor = () => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "hard":
        return "bg-red-500";
    }
  };

  // Get badge color based on category
  const getCategoryStyles = () => {
    switch (category) {
      case "Space Explorer":
        return "bg-plural-purple/10 text-plural-purple";
      case "Ocean Voyager":
        return "bg-blue-500/10 text-blue-500";
      case "Desert Adventurer":
        return "bg-orange-500/10 text-orange-500";
      case "Forest Ranger":
        return "bg-green-500/10 text-green-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <Card className={cn("glass-card overflow-hidden group", className)}>
      <div className="relative h-40 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/50" />
        <Badge className={cn("absolute top-3 left-3", getCategoryStyles())}>
          {category}
        </Badge>
        <div className="absolute bottom-3 right-3 flex items-center space-x-1">
          <span className="text-white text-xs">{difficulty}</span>
          <div className={cn("w-2 h-2 rounded-full", getDifficultyColor())} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-lg line-clamp-1">{title}</h3>
        <p className="text-gray-600 text-sm mt-1 line-clamp-2">{description}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex">
            {[...Array(3)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className="text-yellow-400 fill-yellow-400 mr-0.5"
              />
            ))}
            {[...Array(2)].map((_, i) => (
              <Star key={i} size={14} className="text-gray-300 mr-0.5" />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-plural-blue hover:text-plural-purple transition-colors"
          >
            Start <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default QuestCard;
