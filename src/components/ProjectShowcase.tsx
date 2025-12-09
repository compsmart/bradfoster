import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '../data/resume';
import { ExternalLink, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProjectShowcaseProps {
  projects: Project[];
}

// Image slider component for projects with multiple images
const ImageSlider: React.FC<{ images: string[]; title: string }> = ({ images, title }) => {
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-full group/slider">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentImage}
          src={images[currentImage]}
          alt={`${title} screenshot ${currentImage + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        />
      </AnimatePresence>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-black/80 z-10"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-black/80 z-10"
          >
            <ChevronRight size={16} className="text-white" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImage(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentImage
                    ? 'bg-white w-4'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const ProjectShowcase: React.FC<ProjectShowcaseProps> = ({ projects }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextProject = () => {
    setCurrentIndex((prev) => (prev + 1) % projects.length);
  };

  const prevProject = () => {
    setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
  };

  // Get images for a project (supports both single and multiple images)
  const getProjectImages = (project: Project): string[] => {
    if (project.imageUrls && project.imageUrls.length > 0) {
      return project.imageUrls;
    }
    if (project.imageUrl) {
      return [project.imageUrl];
    }
    return [];
  };

  return (
    <div className="relative h-[500px] flex items-center justify-center perspective-1000">
      {/* Navigation Buttons */}
      <button 
        onClick={prevProject}
        className="absolute left-4 z-20 p-3 bg-gray-800/80 rounded-full hover:bg-cyan-600 transition"
      >
        <ArrowLeft size={24} />
      </button>
      <button 
        onClick={nextProject}
        className="absolute right-4 z-20 p-3 bg-gray-800/80 rounded-full hover:bg-cyan-600 transition"
      >
        <ArrowRight size={24} />
      </button>

      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <AnimatePresence mode='popLayout'>
          {projects.map((project, index) => {
            // Calculate relative position
            let position = index - currentIndex;
            if (position < -Math.floor(projects.length / 2)) position += projects.length;
            if (position > Math.floor(projects.length / 2)) position -= projects.length;

            const isCenter = position === 0;
            const isVisible = Math.abs(position) <= 2;

            if (!isVisible) return null;

            const images = getProjectImages(project);
            const hasImages = images.length > 0;

            return (
              <motion.div
                key={project.title}
                initial={false}
                animate={{
                  x: position * 220, // spacing
                  scale: isCenter ? 1 : 0.8,
                  zIndex: isCenter ? 10 : 5 - Math.abs(position),
                  rotateY: position * -15,
                  opacity: Math.abs(position) > 1 ? 0.3 : 1,
                  filter: isCenter ? 'blur(0px)' : 'blur(2px)',
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                className={`absolute w-[350px] md:w-[500px] h-[350px] bg-gray-800 border ${isCenter ? 'border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 'border-gray-700'} rounded-2xl overflow-hidden cursor-pointer`}
                onClick={() => setCurrentIndex(index)}
              >
                {/* Content */}
                <div className="h-full flex flex-col">
                  {/* Project Image Area */}
                  <div className="h-48 bg-gray-900 flex items-center justify-center border-b border-gray-700 relative overflow-hidden group">
                     {/* Gradient Overlay */}
                     <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60 pointer-events-none z-[5]" />
                     
                     {!hasImages && (
                       <div className="text-6xl font-black text-gray-800 uppercase tracking-tighter group-hover:text-gray-700 transition">
                         {project.title.substring(0, 2)}
                       </div>
                     )}
                     
                     {/* Image display - single or slider */}
                     {hasImages && (
                       images.length > 1 && isCenter ? (
                         <ImageSlider images={images} title={project.title} />
                       ) : (
                         <img 
                           src={images[0]} 
                           alt={project.title} 
                           className="absolute inset-0 w-full h-full object-cover object-top" 
                         />
                       )
                     )}

                     {/* Multiple images badge */}
                     {images.length > 1 && (
                       <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
                         {images.length} images
                       </div>
                     )}
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">{project.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>
                    
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex gap-2 overflow-hidden">
                        {project.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs px-2 py-1 bg-gray-700 rounded text-cyan-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <a 
                        href={project.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-cyan-400 hover:text-white transition"
                        onClick={(e) => e.stopPropagation()} 
                      >
                        Visit <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
